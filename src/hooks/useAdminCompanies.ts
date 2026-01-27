import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminCompany {
  id: string;
  name: string;
  business_name?: string;
  owner_user_id: string;
  owner_email?: string;
  created_at: string | null;
  updated_at: string | null;
  plan_status: string | null;
  plan_type: string | null;
  trial_ends_at: string | null;
  last_login_at: string | null;
  signup_source: string | null;
  monthly_price: number | null;
  is_blocked: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export function useAdminCompanies() {
  const queryClient = useQueryClient();

  const companiesQuery = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async (): Promise<AdminCompany[]> => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Fetch business_settings to get actual business names
      const ownerIds = [...new Set((data || []).map(c => c.owner_user_id))];
      const { data: settingsData } = await supabase
        .from("business_settings")
        .select("user_id, business_name")
        .in("user_id", ownerIds);
      
      const businessNames: Record<string, string> = {};
      settingsData?.forEach(s => {
        if (s.business_name) {
          businessNames[s.user_id] = s.business_name;
        }
      });
      
      // Fetch owner emails
      let ownerEmails: Record<string, string> = {};
      try {
        const response = await supabase.functions.invoke("get-company-owners");
        if (response.data?.ownerEmails) {
          ownerEmails = response.data.ownerEmails;
        }
      } catch (e) {
        console.error("Failed to fetch owner emails:", e);
      }
      
      // Map emails and business names to companies
      return (data || []).map(company => ({
        ...company,
        business_name: businessNames[company.owner_user_id] || undefined,
        owner_email: ownerEmails[company.owner_user_id] || undefined
      }));
    }
  });

  const blockCompanyMutation = useMutation({
    mutationFn: async ({ companyId, blocked }: { companyId: string; blocked: boolean }) => {
      const { error } = await supabase
        .from("companies")
        .update({ is_blocked: blocked })
        .eq("id", companyId);
      
      if (error) throw error;
    },
    onSuccess: (_, { blocked }) => {
      toast.success(blocked ? "Empresa bloqueada" : "Empresa desbloqueada");
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar empresa: " + error.message);
    }
  });

  const extendTrialMutation = useMutation({
    mutationFn: async ({ companyId, days }: { companyId: string; days: number }) => {
      const company = companiesQuery.data?.find(c => c.id === companyId);
      const currentEnd = company?.trial_ends_at ? new Date(company.trial_ends_at) : new Date();
      const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from("companies")
        .update({ 
          trial_ends_at: newEnd.toISOString(),
          plan_status: 'trial'
        })
        .eq("id", companyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trial estendido com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    },
    onError: (error) => {
      toast.error("Erro ao estender trial: " + error.message);
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ companyId, planType, planStatus }: { 
      companyId: string; 
      planType?: string;
      planStatus?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (planType) updates.plan_type = planType;
      if (planStatus) updates.plan_status = planStatus;
      
      const { error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", companyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar plano: " + error.message);
    }
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async ({ companyId }: { companyId: string }) => {
      const response = await supabase.functions.invoke("delete-company", {
        body: { companyId }
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Erro ao excluir empresa");
      }
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    },
    onSuccess: () => {
      toast.success("Empresa excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    },
    onError: (error) => {
      toast.error("Erro ao excluir empresa: " + error.message);
    }
  });

  return {
    companies: companiesQuery.data || [],
    isLoading: companiesQuery.isLoading,
    error: companiesQuery.error,
    blockCompany: blockCompanyMutation.mutate,
    extendTrial: extendTrialMutation.mutate,
    updatePlan: updatePlanMutation.mutate,
    deleteCompany: deleteCompanyMutation.mutate,
    isDeletingCompany: deleteCompanyMutation.isPending
  };
}
