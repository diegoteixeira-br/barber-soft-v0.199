import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { useMarketingSettings } from "@/hooks/useMarketingSettings";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useAppointmentNotification() {
  const { currentUnitId } = useCurrentUnit();
  const { settings } = useMarketingSettings();
  const processedInsertIdsRef = useRef<Set<string>>(new Set());
  const processedCancelIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUnitId) return;

    const channel = supabase
      .channel('appointment-notifications')
      // Listen for new appointments
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `unit_id=eq.${currentUnitId}`,
        },
        async (payload) => {
          const newAppointment = payload.new as {
            id: string;
            client_name: string;
            barber_id: string | null;
            service_id: string | null;
            start_time: string;
            source: string | null;
          };

          // Only notify for WhatsApp appointments
          if (newAppointment.source !== 'whatsapp') {
            console.log('Skipping notification: not a WhatsApp appointment');
            return;
          }

          // Avoid duplicate notifications
          if (processedInsertIdsRef.current.has(newAppointment.id)) return;
          processedInsertIdsRef.current.add(newAppointment.id);

          // Check if vocal notification is enabled
          if (!settings?.vocal_notification_enabled) return;

          // Fetch barber and service details
          let barberName = "um profissional";
          let serviceName = "um serviço";

          if (newAppointment.barber_id) {
            const { data: barber } = await supabase
              .from("barbers")
              .select("name")
              .eq("id", newAppointment.barber_id)
              .single();
            if (barber) barberName = barber.name;
          }

          if (newAppointment.service_id) {
            const { data: service } = await supabase
              .from("services")
              .select("name")
              .eq("id", newAppointment.service_id)
              .single();
            if (service) serviceName = service.name;
          }

          // Build notification message
          const date = new Date(newAppointment.start_time);
          const isToday = isSameDay(date, new Date());
          const dateText = isToday 
            ? "hoje" 
            : format(date, "d 'de' MMMM", { locale: ptBR });
          const timeText = format(date, "HH 'e' mm", { locale: ptBR });

          const message = `${newAppointment.client_name} agendou com ${barberName} o serviço ${serviceName} para ${dateText} às ${timeText}`;

          // Speak using Web Speech API
          speak(message);
        }
      )
      // Listen for status updates (confirmations and cancellations)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `unit_id=eq.${currentUnitId}`,
        },
        async (payload) => {
          const updatedAppointment = payload.new as {
            id: string;
            client_name: string;
            start_time: string;
            status: string;
            source: string | null;
          };
          const oldAppointment = payload.old as {
            status: string;
          };

          // Only notify for WhatsApp appointments
          if (updatedAppointment.source !== 'whatsapp') {
            return;
          }

          const date = new Date(updatedAppointment.start_time);
          const timeText = format(date, "HH 'e' mm", { locale: ptBR });

          // === CONFIRMAÇÃO: status muda de pending para confirmed ===
          if (updatedAppointment.status === 'confirmed' && oldAppointment.status === 'pending') {
            // Avoid duplicate notifications
            const confirmKey = `confirm_${updatedAppointment.id}`;
            if (processedCancelIdsRef.current.has(confirmKey)) return;
            processedCancelIdsRef.current.add(confirmKey);

            // Check if vocal notification is enabled
            if (!settings?.vocal_notification_enabled) return;

            const message = `${updatedAppointment.client_name} confirmou presença para o agendamento das ${timeText}`;
            speak(message);
            return;
          }

          // === CANCELAMENTO: status muda para cancelled ===
          if (updatedAppointment.status === 'cancelled' && oldAppointment.status !== 'cancelled') {
            // Avoid duplicate notifications
            if (processedCancelIdsRef.current.has(updatedAppointment.id)) return;
            processedCancelIdsRef.current.add(updatedAppointment.id);

            // Check if cancellation vocal notification is enabled
            if (!settings?.vocal_cancellation_enabled) return;

            const message = `O agendamento de ${updatedAppointment.client_name} às ${timeText} foi cancelado`;
            speak(message);
            return;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUnitId, settings?.vocal_notification_enabled, settings?.vocal_cancellation_enabled]);
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API not supported');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 1.0;
  utterance.volume = 0.8;

  // Try to select a Portuguese voice
  const voices = speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.includes('pt-BR')) 
    || voices.find(v => v.lang.includes('pt'));
  if (ptVoice) utterance.voice = ptVoice;

  speechSynthesis.speak(utterance);
}
