import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { User, Building2, CreditCard } from "lucide-react";
import { Barber } from "@/hooks/useBarbers";
import { Unit } from "@/hooks/useUnits";

const PRESET_COLORS = [
  "#FF6B00", "#D4AF37", "#22C55E", "#3B82F6", 
  "#8B5CF6", "#EC4899", "#EF4444", "#06B6D4"
];

const barberSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  photo_url: z.string().optional().or(z.literal("")),
  calendar_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  commission_rate: z.number().min(0).max(100),
  is_active: z.boolean(),
  unit_id: z.string().optional(),
  use_custom_fees: z.boolean(),
  debit_card_fee_percent: z.number().min(0).max(100).optional().nullable(),
  credit_card_fee_percent: z.number().min(0).max(100).optional().nullable(),
});

type BarberFormValues = z.infer<typeof barberSchema>;

interface BarberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber?: Barber | null;
  onSubmit: (data: BarberFormValues) => void;
  isLoading?: boolean;
  units?: Unit[];
  defaultUnitId?: string;
}

export function BarberFormModal({
  open,
  onOpenChange,
  barber,
  onSubmit,
  isLoading,
  units = [],
  defaultUnitId,
}: BarberFormModalProps) {
  const form = useForm<BarberFormValues>({
    resolver: zodResolver(barberSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      photo_url: "",
      calendar_color: "#FF6B00",
      commission_rate: 50,
      is_active: true,
      unit_id: "",
      use_custom_fees: false,
      debit_card_fee_percent: null,
      credit_card_fee_percent: null,
    },
  });

  const [selectedColor, setSelectedColor] = useState("#FF6B00");
  
  const isEditMode = !!barber;
  const showUnitSelector = !isEditMode && units.length > 1;
  const useCustomFees = form.watch("use_custom_fees");

  // Reset form when modal opens/closes or barber changes
  useEffect(() => {
    if (open) {
      const hasCustomFees = barber?.debit_card_fee_percent != null || barber?.credit_card_fee_percent != null;
      form.reset({
        name: barber?.name || "",
        phone: barber?.phone || "",
        email: barber?.email || "",
        photo_url: barber?.photo_url || "",
        calendar_color: barber?.calendar_color || "#FF6B00",
        commission_rate: barber?.commission_rate || 50,
        is_active: barber?.is_active ?? true,
        unit_id: barber?.unit_id || defaultUnitId || (units.length === 1 ? units[0]?.id : ""),
        use_custom_fees: hasCustomFees,
        debit_card_fee_percent: barber?.debit_card_fee_percent ?? null,
        credit_card_fee_percent: barber?.credit_card_fee_percent ?? null,
      });
      setSelectedColor(barber?.calendar_color || "#FF6B00");
    }
  }, [open, barber, form, defaultUnitId, units]);

  const handleSubmit = (data: BarberFormValues) => {
    const submitData = {
      ...data,
      debit_card_fee_percent: data.use_custom_fees ? data.debit_card_fee_percent : null,
      credit_card_fee_percent: data.use_custom_fees ? data.credit_card_fee_percent : null,
    };
    onSubmit(submitData);
    form.reset();
  };

  const getUnitName = () => {
    if (!barber) return null;
    const unit = units.find(u => u.id === barber.unit_id);
    return unit?.name || barber.unit_name || "Unidade desconhecida";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {barber ? "Editar Profissional" : "Novo Profissional"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Unit Selector for new barbers */}
            {showUnitSelector && (
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Show unit info for editing */}
            {isEditMode && units.length > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-2">
                <Building2 className="h-4 w-4" />
                <span>Unidade: <strong className="text-foreground">{getUnitName()}</strong></span>
              </div>
            )}

            {/* Avatar Upload */}
            <div className="flex justify-center pb-2">
              <AvatarUpload
                currentImageUrl={form.watch("photo_url") || undefined}
                onImageUploaded={(url) => form.setValue("photo_url", url)}
                onImageRemoved={() => form.setValue("photo_url", "")}
                bucket="barber-content"
                folder="profissionais"
                fallbackIcon={<User className="h-8 w-8 text-muted-foreground" />}
                size="lg"
                label="Foto do Profissional"
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do profissional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email {!barber && "(para acesso ao sistema)"}</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="profissional@email.com" 
                      {...field} 
                      disabled={!!barber?.user_id}
                    />
                  </FormControl>
                  {!barber && (
                    <p className="text-xs text-muted-foreground">
                      O profissional receberá um convite para criar sua conta
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="calendar_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor na Agenda</FormLabel>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === color
                            ? "border-foreground scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setSelectedColor(color);
                          field.onChange(color);
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Card Fees Section */}
            <div className="border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Taxas de Cartão Personalizadas</span>
                </div>
                <FormField
                  control={form.control}
                  name="use_custom_fees"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              
              {useCustomFees && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="debit_card_fee_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Taxa Débito (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="1.50"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="credit_card_fee_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Taxa Crédito (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="3.00"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {!useCustomFees && (
                <p className="text-xs text-muted-foreground">
                  Usando taxas globais definidas em Configurações → Taxas Financeiras
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || (showUnitSelector && !form.watch("unit_id"))}>
                {barber ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
