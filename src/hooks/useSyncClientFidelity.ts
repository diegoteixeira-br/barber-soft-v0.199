import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSyncClientFidelity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Sync a single client
  const syncSingle = useMutation({
    mutationFn: async (clientId: string) => {
      // 1. Get client info and unit fidelity settings
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id, unit_id, phone, name, available_courtesies")
        .eq("id", clientId)
        .single();

      if (clientError || !client) throw new Error("Cliente não encontrado");

      const { data: unit, error: unitError } = await supabase
        .from("units")
        .select("fidelity_program_enabled, fidelity_min_value, fidelity_cuts_threshold")
        .eq("id", client.unit_id)
        .single();

      if (unitError || !unit) throw new Error("Unidade não encontrada");

      if (!unit.fidelity_program_enabled) {
        throw new Error("Programa de fidelidade não está ativado nesta unidade");
      }

      const minValue = unit.fidelity_min_value || 0;

      // 2. Count completed appointments that qualify for fidelity
      const { data: appointments, error: apptError } = await supabase
        .from("appointments")
        .select("id, total_price, payment_method, start_time")
        .eq("unit_id", client.unit_id)
        .eq("status", "completed")
        .or(`client_phone.eq.${client.phone},client_name.ilike.${client.name.toLowerCase().trim()}`);

      if (apptError) throw apptError;

      // Count cuts - excluding courtesy payments since those redeem the counter
      let loyaltyCuts = 0;
      let totalVisits = 0;
      let lastVisit: string | null = null;

      for (const appt of appointments || []) {
        totalVisits++;
        if (!lastVisit || appt.start_time > lastVisit) {
          lastVisit = appt.start_time;
        }
        // Only count towards fidelity if: meets min value AND not a courtesy payment
        if (
          appt.total_price >= minValue &&
          appt.payment_method !== "Cortesia de Fidelidade" &&
          appt.payment_method !== "fidelity_courtesy"
        ) {
          loyaltyCuts++;
        }
      }

      // If client has available courtesies, we reset the counter after they're used
      // The counter represents cuts SINCE last courtesy earned
      const threshold = unit.fidelity_cuts_threshold || 10;
      const earnedCourtesies = Math.floor(loyaltyCuts / threshold);
      const currentCuts = loyaltyCuts % threshold;

      // 3. Update client record
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          loyalty_cuts: currentCuts,
          total_visits: totalVisits,
          total_courtesies_earned: earnedCourtesies,
          last_visit_at: lastVisit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId);

      if (updateError) throw updateError;

      return { 
        loyaltyCuts: currentCuts, 
        totalVisits, 
        earnedCourtesies,
        threshold
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Fidelidade atualizada!",
        description: `${data.loyaltyCuts}/${data.threshold} cortes · ${data.totalVisits} visitas`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao sincronizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync ALL clients using the database function
  const syncAll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("recalculate_all_client_fidelity");
      if (error) throw error;
      return data as { processed_clients: number; updated_clients: number }[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      const result = data?.[0];
      toast({
        title: "Fidelidade sincronizada!",
        description: `${result?.processed_clients || 0} clientes processados, ${result?.updated_clients || 0} atualizados`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao sincronizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { syncSingle, syncAll };
}
