import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BusinessSettings {
  id: string;
  user_id: string;
  business_name: string | null;
  logo_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  webhook_url: string | null;
  cancellation_time_limit_minutes: number | null;
  late_cancellation_fee_percent: number | null;
  no_show_fee_percent: number | null;
  debit_card_fee_percent: number | null;
  credit_card_fee_percent: number | null;
  commission_calculation_base: 'gross' | 'net' | null;
  fidelity_program_enabled: boolean | null;
  fidelity_cuts_threshold: number | null;
  fidelity_min_value: number | null;
  deletion_password_hash: string | null;
  deletion_password_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettingsInput {
  business_name?: string | null;
  logo_url?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  webhook_url?: string | null;
  cancellation_time_limit_minutes?: number | null;
  late_cancellation_fee_percent?: number | null;
  no_show_fee_percent?: number | null;
  debit_card_fee_percent?: number | null;
  credit_card_fee_percent?: number | null;
  commission_calculation_base?: 'gross' | 'net' | null;
  fidelity_program_enabled?: boolean | null;
  fidelity_cuts_threshold?: number | null;
  fidelity_min_value?: number | null;
  deletion_password_hash?: string | null;
  deletion_password_enabled?: boolean | null;
}

// Utility function to hash password using SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useBusinessSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as BusinessSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (input: BusinessSettingsInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: existing } = await supabase
        .from("business_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("business_settings")
          .update(input)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("business_settings")
          .insert({ ...input, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadLogo = async (file: File): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Erro no upload",
        description: uploadError.message,
        variant: "destructive",
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("logos")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const testWebhook = async (url: string): Promise<{ success: boolean; message: string }> => {
    try {
      new URL(url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "test",
          message: "Teste de conexão do Sistema de Barbearia",
          timestamp: new Date().toISOString(),
        }),
        mode: "no-cors",
      });

      return { 
        success: true, 
        message: "Requisição enviada! Verifique se o webhook recebeu a mensagem." 
      };
    } catch (error) {
      return { 
        success: false, 
        message: "URL inválida ou não acessível" 
      };
    }
  };

  // Function to set deletion password (hashes and saves)
  const setDeletionPassword = async (password: string): Promise<boolean> => {
    try {
      const hash = await hashPassword(password);
      await updateSettings.mutateAsync({
        deletion_password_hash: hash,
        deletion_password_enabled: true,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Function to verify deletion password
  const verifyDeletionPassword = async (inputPassword: string): Promise<boolean> => {
    if (!settings?.deletion_password_enabled || !settings?.deletion_password_hash) {
      return true; // No password required
    }
    const inputHash = await hashPassword(inputPassword);
    return inputHash === settings.deletion_password_hash;
  };

  // Function to disable deletion password (requires current password verification)
  const disableDeletionPassword = async (currentPassword?: string): Promise<boolean> => {
    // If password is enabled, require verification first
    if (settings?.deletion_password_enabled && settings?.deletion_password_hash) {
      if (!currentPassword) {
        return false;
      }
      const isValid = await verifyDeletionPassword(currentPassword);
      if (!isValid) {
        toast({
          title: "Senha incorreta",
          description: "A senha informada não está correta.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    try {
      await updateSettings.mutateAsync({
        deletion_password_enabled: false,
        deletion_password_hash: null,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Function to change deletion password (requires current password verification)
  const changeDeletionPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    // Verify current password first
    if (settings?.deletion_password_enabled && settings?.deletion_password_hash) {
      const isValid = await verifyDeletionPassword(currentPassword);
      if (!isValid) {
        toast({
          title: "Senha incorreta",
          description: "A senha atual não está correta.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    try {
      const hash = await hashPassword(newPassword);
      await updateSettings.mutateAsync({
        deletion_password_hash: hash,
        deletion_password_enabled: true,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Function to request password reset via email
  const requestDeletionPasswordReset = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado.",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase.functions.invoke("reset-deletion-password", {
        method: "POST",
        body: { user_id: user.id },
      });

      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir a senha de exclusão.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    uploadLogo,
    testWebhook,
    setDeletionPassword,
    verifyDeletionPassword,
    disableDeletionPassword,
    changeDeletionPassword,
    requestDeletionPasswordReset,
  };
}
