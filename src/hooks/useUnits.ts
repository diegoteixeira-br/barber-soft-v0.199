import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Unit {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  manager_name: string | null;
  evolution_instance_name: string | null;
  evolution_api_key: string | null;
  user_id: string;
  company_id: string | null;
  created_at: string;
  is_headquarters: boolean;
  whatsapp_name: string | null;
  whatsapp_phone: string | null;
  whatsapp_picture_url: string | null;
}

interface UnitFormData {
  name: string;
  address?: string;
  phone?: string;
  manager_name?: string;
  evolution_instance_name?: string;
  is_headquarters?: boolean;
}

export function useUnits(companyId: string | null = null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

const { data: units = [], isLoading, refetch } = useQuery({
    queryKey: ["units", companyId],
    queryFn: async () => {
      let query = supabase
        .from("units")
        .select("*")
        .order("is_headquarters", { ascending: false })
        .order("created_at", { ascending: true });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Unit[];
    },
  });

  const createUnit = useMutation({
    mutationFn: async (unit: UnitFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get company_id for the user
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("units")
        .insert({ 
          ...unit, 
          user_id: user.id,
          company_id: company?.id || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({ title: "Unidade criada com sucesso!" });
    },
    onError: (error: Error) => {
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        toast({ 
          title: "Erro ao criar unidade", 
          description: "Esse nome de instância já está sendo usado por outra unidade", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Erro ao criar unidade", description: error.message, variant: "destructive" });
      }
    },
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, ...unit }: UnitFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("units")
        .update(unit)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({ title: "Unidade atualizada com sucesso!" });
    },
    onError: (error: Error) => {
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        toast({ 
          title: "Erro ao atualizar unidade", 
          description: "Esse nome de instância já está sendo usado por outra unidade", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Erro ao atualizar unidade", description: error.message, variant: "destructive" });
      }
    },
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("units")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({ title: "Unidade excluída com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir unidade", description: error.message, variant: "destructive" });
    },
  });

  const setAsHeadquarters = useMutation({
    mutationFn: async (unitId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Remove headquarters from all other units
      await supabase
        .from("units")
        .update({ is_headquarters: false })
        .eq("user_id", user.id);

      // Set the selected unit as headquarters
      const { error } = await supabase
        .from("units")
        .update({ is_headquarters: true })
        .eq("id", unitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({ title: "Unidade definida como matriz!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao definir matriz", description: error.message, variant: "destructive" });
    },
  });

  return { units, isLoading, createUnit, updateUnit, deleteUnit, setAsHeadquarters, refetch };
}
