import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Barber {
  id: string;
  unit_id: string;
  company_id: string | null;
  name: string;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  user_id: string | null;
  calendar_color: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  unit_name?: string;
  invite_token?: string | null;
  debit_card_fee_percent?: number | null;
  credit_card_fee_percent?: number | null;
}

export type BarberFormData = Omit<Barber, "id" | "created_at" | "company_id" | "unit_name"> & {
  unit_id?: string;
};

export function useBarbers(unitId: string | null | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: barbers = [], isLoading, refetch } = useQuery({
    queryKey: ["barbers", unitId],
    queryFn: async () => {
      let query = supabase
        .from("barbers")
        .select("*, units!inner(name)")
        .order("name");

      if (unitId) {
        query = query.eq("unit_id", unitId);
      } else if (unitId === null) {
        // Get all units owned by the user
        const { data: userUnits } = await supabase
          .from("units")
          .select("id");
        
        if (!userUnits || userUnits.length === 0) return [];
        
        const unitIds = userUnits.map(u => u.id);
        query = query.in("unit_id", unitIds);
      } else {
        return [];
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        unit_name: item.units?.name || "Unidade desconhecida",
        units: undefined,
      })) as Barber[];
    },
    enabled: unitId !== undefined,
  });

  const createBarber = useMutation({
    mutationFn: async (barber: Omit<BarberFormData, "unit_id"> & { unit_id?: string }) => {
      const targetUnitId = barber.unit_id || unitId;
      if (!targetUnitId) throw new Error("Nenhuma unidade selecionada");

      // Get company_id from the unit
      const { data: unit } = await supabase
        .from("units")
        .select("company_id")
        .eq("id", targetUnitId)
        .single();

      const { data, error } = await supabase
        .from("barbers")
        .insert({ 
          name: barber.name,
          phone: barber.phone,
          email: barber.email || null,
          photo_url: barber.photo_url,
          calendar_color: barber.calendar_color,
          commission_rate: barber.commission_rate,
          is_active: barber.is_active,
          unit_id: targetUnitId,
          company_id: unit?.company_id || null,
          debit_card_fee_percent: barber.debit_card_fee_percent ?? null,
          credit_card_fee_percent: barber.credit_card_fee_percent ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return { barber: data, email: barber.email };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
      
      // If email provided, send invite
      if (result.email && result.barber) {
        try {
          const { error } = await supabase.functions.invoke("invite-barber", {
            body: {
              barberId: result.barber.id,
              email: result.email,
              name: result.barber.name,
              redirectUrl: `${window.location.origin}/auth/barber`,
            },
          });

          if (error) {
            toast({ 
              title: "Profissional adicionado", 
              description: "Mas houve erro ao enviar convite. Tente reenviar depois.",
              variant: "destructive" 
            });
          } else {
            toast({ 
              title: "Profissional adicionado!", 
              description: "Convite enviado por email."
            });
          }
        } catch (e) {
          toast({ 
            title: "Profissional adicionado", 
            description: "Mas houve erro ao enviar convite.",
          });
        }
      } else {
        toast({ title: "Profissional adicionado com sucesso!" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar profissional", description: error.message, variant: "destructive" });
    },
  });

  const updateBarber = useMutation({
    mutationFn: async ({ id, ...barber }: Partial<Barber> & { id: string }) => {
      // Check if barber has user_id to determine if email can be updated
      const { data: currentBarber } = await supabase
        .from("barbers")
        .select("user_id")
        .eq("id", id)
        .single();

      const updateData: Record<string, unknown> = {
        name: barber.name,
        phone: barber.phone,
        photo_url: barber.photo_url,
        calendar_color: barber.calendar_color,
        commission_rate: barber.commission_rate,
        is_active: barber.is_active,
        debit_card_fee_percent: barber.debit_card_fee_percent ?? null,
        credit_card_fee_percent: barber.credit_card_fee_percent ?? null,
      };

      // Only update email if barber doesn't have an associated user account
      if (!currentBarber?.user_id && barber.email !== undefined) {
        updateData.email = barber.email || null;
      }

      const { data, error } = await supabase
        .from("barbers")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
      toast({ title: "Profissional atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar profissional", description: error.message, variant: "destructive" });
    },
  });

  const deleteBarber = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
      toast({ title: "Profissional removido com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover profissional", description: error.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("barbers")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
      toast({ title: data.is_active ? "Profissional ativado!" : "Profissional desativado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" });
    },
  });

  const generateInviteToken = useMutation({
    mutationFn: async (id: string) => {
      // Generate a new UUID token
      const token = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from("barbers")
        .update({ invite_token: token })
        .eq("id", id)
        .select("invite_token")
        .single();

      if (error) throw error;
      return data.invite_token;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao gerar link", description: error.message, variant: "destructive" });
    },
  });

  return { 
    barbers, 
    isLoading, 
    refetch,
    createBarber, 
    updateBarber, 
    deleteBarber,
    toggleActive,
    generateInviteToken
  };
}
