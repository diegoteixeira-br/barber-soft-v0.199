import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export interface Appointment {
  id: string;
  unit_id: string;
  company_id: string | null;
  barber_id: string | null;
  service_id: string | null;
  client_name: string;
  client_phone: string | null;
  client_birth_date: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  total_price: number;
  notes: string | null;
  created_at: string;
  barber?: {
    id: string;
    name: string;
    calendar_color: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  } | null;
}

export interface AppointmentFormData {
  client_name: string;
  client_phone?: string;
  client_birth_date?: string;
  barber_id: string;
  service_id: string;
  start_time: Date;
  notes?: string;
}

export interface QuickServiceFormData {
  client_name: string;
  client_phone?: string;
  client_birth_date?: string;
  barber_id: string;
  service_id: string;
  total_price: number;
  notes?: string;
  schedule_later?: boolean;
  scheduled_date?: string;
  scheduled_time?: string;
}

export function useAppointments(startDate?: Date, endDate?: Date) {
  const { currentUnitId, currentCompanyId } = useCurrentUnit();
  const queryClient = useQueryClient();

  // Realtime subscription para atualizar automaticamente quando agendamentos são criados/alterados externamente
  useEffect(() => {
    if (!currentUnitId) return;

    const channel = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `unit_id=eq.${currentUnitId}`,
        },
        (payload) => {
          console.log('Realtime appointment change:', payload);
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUnitId, queryClient]);

  // Fetch ALL appointments including cancelled (we filter on the frontend for toggle)
  const query = useQuery({
    queryKey: ["appointments", currentUnitId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!currentUnitId) return [];

      let queryBuilder = supabase
        .from("appointments")
        .select(`
          *,
          barber:barbers(id, name, calendar_color),
          service:services(id, name, duration_minutes, price)
        `)
        .eq("unit_id", currentUnitId)
        .order("start_time", { ascending: true });

      if (startDate) {
        queryBuilder = queryBuilder.gte("start_time", startDate.toISOString());
      }
      if (endDate) {
        queryBuilder = queryBuilder.lte("start_time", endDate.toISOString());
      }
      // Não filtra por barberId - carrega todos para visualização completa
      // O filtro visual é aplicado no frontend

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!currentUnitId,
  });

  // Check for conflicts before creating/updating
  const checkConflict = async (barberId: string, startTime: Date, endTime: Date, excludeAppointmentId?: string) => {
    if (!currentUnitId) return false;

    let queryBuilder = supabase
      .from("appointments")
      .select("id, start_time, end_time, client_name")
      .eq("unit_id", currentUnitId)
      .eq("barber_id", barberId)
      .neq("status", "cancelled")
      .lt("start_time", endTime.toISOString())
      .gt("end_time", startTime.toISOString());

    if (excludeAppointmentId) {
      queryBuilder = queryBuilder.neq("id", excludeAppointmentId);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  };

  const createAppointment = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (!currentUnitId) throw new Error("Nenhuma unidade selecionada");

      // Get service to calculate end time and price
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("duration_minutes, price")
        .eq("id", data.service_id)
        .single();

      if (serviceError) throw serviceError;

      const startTime = new Date(data.start_time);
      const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

      // Check for conflicts with active appointments
      const conflict = await checkConflict(data.barber_id, startTime, endTime);
      if (conflict) {
        throw new Error(`Horário ocupado! ${conflict.client_name} já tem agendamento nesse horário.`);
      }

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          unit_id: currentUnitId,
          company_id: currentCompanyId,
          barber_id: data.barber_id,
          service_id: data.service_id,
          client_name: data.client_name,
          client_phone: data.client_phone || null,
          client_birth_date: data.client_birth_date || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_price: service.price,
          notes: data.notes || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Agendamento criado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar agendamento", description: error.message, variant: "destructive" });
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AppointmentFormData> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.client_name) updateData.client_name = data.client_name;
      if (data.client_phone !== undefined) updateData.client_phone = data.client_phone || null;
      if (data.client_birth_date !== undefined) updateData.client_birth_date = data.client_birth_date || null;
      if (data.barber_id) updateData.barber_id = data.barber_id;
      if (data.notes !== undefined) updateData.notes = data.notes || null;
      
      if (data.service_id) {
        updateData.service_id = data.service_id;
        
        // Recalculate end time if service or start_time changed
        const { data: service } = await supabase
          .from("services")
          .select("duration_minutes, price")
          .eq("id", data.service_id)
          .single();

        if (service) {
          updateData.total_price = service.price;
          
          if (data.start_time) {
            const startTime = new Date(data.start_time);
            const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);
            updateData.start_time = startTime.toISOString();
            updateData.end_time = endTime.toISOString();
          }
        }
      } else if (data.start_time) {
        // Get current appointment to get service duration
        const { data: currentAppointment } = await supabase
          .from("appointments")
          .select("service_id")
          .eq("id", id)
          .single();

        if (currentAppointment?.service_id) {
          const { data: service } = await supabase
            .from("services")
            .select("duration_minutes")
            .eq("id", currentAppointment.service_id)
            .single();

          if (service) {
            const startTime = new Date(data.start_time);
            const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);
            updateData.start_time = startTime.toISOString();
            updateData.end_time = endTime.toISOString();
          }
        }
      }

      const { data: appointment, error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Agendamento atualizado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  // Helper to record cancellation in history
  const recordCancellationHistory = async (
    appointment: Appointment,
    isNoShow: boolean = false,
    source: string = "manual"
  ) => {
    const now = new Date();
    const scheduledTime = new Date(appointment.start_time);
    const minutesBefore = Math.round((scheduledTime.getTime() - now.getTime()) / 60000);
    const isLateCancellation = minutesBefore < 10;

    const { error } = await supabase
      .from("cancellation_history")
      .insert({
        unit_id: appointment.unit_id,
        company_id: appointment.company_id,
        appointment_id: appointment.id,
        client_name: appointment.client_name,
        client_phone: appointment.client_phone,
        barber_name: appointment.barber?.name || "Desconhecido",
        service_name: appointment.service?.name || "Serviço",
        scheduled_time: appointment.start_time,
        cancelled_at: now.toISOString(),
        minutes_before: minutesBefore,
        is_late_cancellation: isLateCancellation,
        is_no_show: isNoShow,
        total_price: appointment.total_price,
        cancellation_source: isNoShow ? "no_show" : source,
      });

    if (error) {
      console.error("Error recording cancellation history:", error);
    }
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, isNoShow = false }: { id: string; status: AppointmentStatus; isNoShow?: boolean }) => {
      // Fetch full appointment data first for cancellation history
      if (status === "cancelled") {
        const { data: fullAppointment } = await supabase
          .from("appointments")
          .select(`
            *,
            barber:barbers(id, name, calendar_color),
            service:services(id, name, duration_minutes, price)
          `)
          .eq("id", id)
          .single();

        if (fullAppointment) {
          await recordCancellationHistory(fullAppointment as Appointment, isNoShow, "manual");
        }
      }

      const { data, error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["cancellation-history"] });
      toast({ title: "Status atualizado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Agendamento excluído!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });


  // Create quick service (already completed) or schedule for later
  const createQuickService = useMutation({
    mutationFn: async (data: QuickServiceFormData) => {
      if (!currentUnitId) throw new Error("Nenhuma unidade selecionada");

      // Get service to calculate end time
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("duration_minutes")
        .eq("id", data.service_id)
        .single();

      if (serviceError) throw serviceError;

      let startTime: Date;
      let status: AppointmentStatus;

      if (data.schedule_later && data.scheduled_date && data.scheduled_time) {
        // Schedule for later
        startTime = new Date(`${data.scheduled_date}T${data.scheduled_time}`);
        status = "pending";

        // Check for conflicts
        const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);
        const conflict = await checkConflict(data.barber_id, startTime, endTime);
        if (conflict) {
          throw new Error(`Horário ocupado! ${conflict.client_name} já tem agendamento nesse horário.`);
        }
      } else {
        // Quick service (now)
        startTime = new Date();
        status = "completed";
      }

      const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          unit_id: currentUnitId,
          company_id: currentCompanyId,
          barber_id: data.barber_id,
          service_id: data.service_id,
          client_name: data.client_name,
          client_phone: data.client_phone || null,
          client_birth_date: data.client_birth_date || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_price: data.total_price,
          notes: data.notes || null,
          status,
        })
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      const message = variables.schedule_later 
        ? "Serviço agendado com sucesso!" 
        : "Atendimento registrado com sucesso!";
      toast({ title: message });
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar", description: error.message, variant: "destructive" });
    },
  });

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    error: query.error,
    createAppointment,
    updateAppointment,
    updateStatus,
    deleteAppointment,
    createQuickService,
  };
}
