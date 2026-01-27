import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SubscriptionStatus {
  plan_status: "trial" | "active" | "cancelled" | "overdue" | "partner" | null;
  plan_type: "inicial" | "profissional" | "franquias" | null;
  trial_ends_at: string | null;
  is_partner: boolean;
  days_remaining: number | null;
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        return;
      }

      if (data) {
        // Calculate days remaining for trial
        let daysRemaining: number | null = null;
        if (data.trial_ends_at) {
          const trialEnd = new Date(data.trial_ends_at);
          const now = new Date();
          daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        }

        setStatus({
          plan_status: data.plan_status || null,
          plan_type: data.plan_type || null,
          trial_ends_at: data.trial_ends_at || null,
          is_partner: data.is_partner || false,
          days_remaining: daysRemaining,
        });
      }
    } catch (error) {
      console.error("Error in checkSubscription:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível abrir o portal de assinatura",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Erro",
        description: "Erro ao acessar portal de assinatura",
        variant: "destructive",
      });
    }
  };

  const startCheckout = async (plan: string, billing: "monthly" | "annual") => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { plan, billing },
      });

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível iniciar o checkout",
          variant: "destructive",
        });
        return null;
      }

      if (data?.url) {
        window.location.href = data.url;
        return data.url;
      }

      return null;
    } catch (error) {
      console.error("Error starting checkout:", error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar checkout",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Refresh subscription status every minute
    const interval = setInterval(checkSubscription, 60000);
    
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return {
    status,
    isLoading,
    checkSubscription,
    openCustomerPortal,
    startCheckout,
    isTrialing: status?.plan_status === "trial",
    isActive: status?.plan_status === "active" || status?.plan_status === "partner",
    isPartner: status?.is_partner || false,
    daysRemaining: status?.days_remaining,
  };
}
