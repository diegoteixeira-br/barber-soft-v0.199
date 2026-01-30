import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FidelityCheckResult {
  isFreeCut: boolean;
  loyaltyCuts: number;
  threshold: number;
  clientName: string | null;
}

export function useFidelityCourtesy() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const useCourtesy = useMutation({
    mutationFn: async ({ clientPhone, unitId }: { clientPhone: string; unitId: string }) => {
      // Find the client by phone and unit
      const { data: client, error: findError } = await supabase
        .from("clients")
        .select("id, available_courtesies")
        .eq("unit_id", unitId)
        .eq("phone", clientPhone)
        .maybeSingle();

      if (findError) throw findError;
      if (!client) throw new Error("Cliente não encontrado");
      if (!client.available_courtesies || client.available_courtesies <= 0) {
        throw new Error("Cliente não possui cortesias disponíveis");
      }

      // Decrement available courtesies
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          available_courtesies: client.available_courtesies - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", client.id);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Cortesia de fidelidade utilizada!",
        description: "O saldo de cortesias do cliente foi atualizado.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao usar cortesia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getClientCourtesies = async (clientPhone: string | null, unitId: string): Promise<number> => {
    if (!clientPhone) return 0;
    
    const { data } = await supabase
      .from("clients")
      .select("available_courtesies")
      .eq("unit_id", unitId)
      .eq("phone", clientPhone)
      .maybeSingle();

    return data?.available_courtesies || 0;
  };

  // Check if the current service will be the FREE cut (6th cut scenario)
  // Returns true if loyalty_cuts >= threshold - meaning THIS cut should be free
  const checkIfNextCutIsFree = async (
    clientPhone: string | null,
    unitId: string,
    companyId: string | null,
    serviceValue: number
  ): Promise<FidelityCheckResult> => {
    const defaultResult: FidelityCheckResult = {
      isFreeCut: false,
      loyaltyCuts: 0,
      threshold: 0,
      clientName: null,
    };

    if (!clientPhone || !companyId) return defaultResult;

    try {
      // Get company owner to fetch settings
      const { data: company } = await supabase
        .from("companies")
        .select("owner_user_id")
        .eq("id", companyId)
        .maybeSingle();

      if (!company) return defaultResult;

      // Get fidelity settings
      const { data: settings } = await supabase
        .from("business_settings")
        .select("fidelity_program_enabled, fidelity_cuts_threshold, fidelity_min_value")
        .eq("user_id", company.owner_user_id)
        .maybeSingle();

      if (!settings?.fidelity_program_enabled) return defaultResult;

      const threshold = settings.fidelity_cuts_threshold || 10;
      const minValue = settings.fidelity_min_value || 30;

      // Get client data
      const { data: client } = await supabase
        .from("clients")
        .select("loyalty_cuts, name, available_courtesies")
        .eq("unit_id", unitId)
        .eq("phone", clientPhone)
        .maybeSingle();

      if (!client) return defaultResult;

      const loyaltyCuts = client.loyalty_cuts || 0;
      const hasCourtesyPending = (client.available_courtesies || 0) > 0;

      // If client already has a courtesy pending, this IS the free cut!
      // (They accumulated 5 cuts and the 6th is pending to be used as courtesy)
      if (hasCourtesyPending && serviceValue >= minValue) {
        return {
          isFreeCut: true,
          loyaltyCuts: threshold, // They've completed the cycle
          threshold,
          clientName: client.name,
        };
      }

      // Check if this cut would complete the cycle (loyaltyCuts = threshold - 1)
      // e.g., if threshold = 5 and loyaltyCuts = 4, next cut (5th) completes cycle
      // But the FREE cut is AFTER completing the cycle (6th cut)
      // So we check if loyalty_cuts >= threshold (which means cycle was just completed)
      
      // Actually, the logic is: 
      // - Client has 5 paid cuts (loyalty_cuts = 5, threshold = 5)
      // - Next cut should be FREE (this is the 6th cut)
      // So we check if loyalty_cuts >= threshold
      const isFreeCut = loyaltyCuts >= threshold && serviceValue >= minValue;

      return {
        isFreeCut,
        loyaltyCuts,
        threshold,
        clientName: client.name,
      };
    } catch {
      return defaultResult;
    }
  };

  // Check if client earned a new courtesy by comparing before and after values
  const checkCycleCompletion = async (
    clientPhone: string | null,
    unitId: string,
    courtesiesBefore: number
  ): Promise<{ earned: boolean; currentCourtesies: number }> => {
    if (!clientPhone) return { earned: false, currentCourtesies: 0 };
    
    const currentCourtesies = await getClientCourtesies(clientPhone, unitId);
    
    return {
      earned: currentCourtesies > courtesiesBefore,
      currentCourtesies,
    };
  };

  return {
    useCourtesy,
    getClientCourtesies,
    checkIfNextCutIsFree,
    checkCycleCompletion,
  };
}
