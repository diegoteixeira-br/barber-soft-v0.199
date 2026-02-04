import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Barber } from "@/hooks/useBarbers";
import type { Service } from "@/hooks/useServices";
import { Zap, CalendarClock } from "lucide-react";

const formSchema = z.object({
  client_name: z.string().min(1, "Nome do cliente é obrigatório"),
  client_phone: z.string().optional(),
  client_birth_date: z.string().optional(),
  barber_id: z.string().min(1, "Selecione um profissional"),
  service_id: z.string().min(1, "Selecione um serviço"),
  total_price: z.number().min(0, "Valor inválido"),
  notes: z.string().optional(),
  schedule_later: z.boolean().default(false),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  payment_method: z.string().optional(),
}).refine((data) => {
  if (data.schedule_later) {
    return data.scheduled_date && data.scheduled_time;
  }
  return true;
}, {
  message: "Data e hora são obrigatórios para agendamento",
  path: ["scheduled_date"],
}).refine((data) => {
  // Payment method is required only when NOT scheduling for later
  if (!data.schedule_later) {
    return !!data.payment_method;
  }
  return true;
}, {
  message: "Forma de pagamento é obrigatória",
  path: ["payment_method"],
});

type FormData = z.infer<typeof formSchema>;

interface QuickServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbers: Barber[];
  services: Service[];
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

export function QuickServiceModal({
  open,
  onOpenChange,
  barbers,
  services,
  onSubmit,
  isLoading,
}: QuickServiceModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_name: "",
      client_phone: "",
      client_birth_date: "",
      barber_id: "",
      service_id: "",
      total_price: 0,
      notes: "",
      schedule_later: false,
      scheduled_date: "",
      scheduled_time: "",
      payment_method: "",
    },
  });

  const scheduleLater = form.watch("schedule_later");

  const activeBarbers = useMemo(
    () => barbers.filter((b) => b.is_active),
    [barbers]
  );

  const activeServices = useMemo(
    () => services.filter((s) => s.is_active),
    [services]
  );

  const selectedServiceId = form.watch("service_id");

  // Update price when service changes
  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find((s) => s.id === selectedServiceId);
      if (service) {
        form.setValue("total_price", service.price);
      }
    }
  }, [selectedServiceId, services, form]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      const today = format(new Date(), "yyyy-MM-dd");
      const now = format(new Date(), "HH:mm");
      form.reset({
        client_name: "",
        client_phone: "",
        client_birth_date: "",
        barber_id: activeBarbers[0]?.id || "",
        service_id: "",
        total_price: 0,
        notes: "",
        schedule_later: false,
        scheduled_date: today,
        scheduled_time: now,
        payment_method: "",
      });
    }
  }, [open, form, activeBarbers]);

  const handleSubmit = async (data: FormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Atendimento Rápido
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 pb-2">
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="client_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="client_birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="barber_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissional</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o profissional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeBarbers.map((barber) => (
                            <SelectItem key={barber.id} value={barber.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: barber.calendar_color || "#FF6B00" }}
                                />
                                {barber.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="service_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - R$ {service.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Cobrado (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Method - Only show when NOT scheduling for later */}
                {!scheduleLater && (
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">💵 Dinheiro</SelectItem>
                            <SelectItem value="pix">📱 PIX</SelectItem>
                            <SelectItem value="debit_card">💳 Débito</SelectItem>
                            <SelectItem value="credit_card">💳 Crédito</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Toggle para agendar */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <CalendarClock className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label htmlFor="schedule-later">Agendar para depois</Label>
                      <p className="text-sm text-muted-foreground">
                        Agendar o serviço para uma data e hora específica
                      </p>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="schedule_later"
                    render={({ field }) => (
                      <Switch
                        id="schedule-later"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {/* Campos de data/hora quando agendar para depois */}
                {scheduleLater && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="scheduled_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scheduled_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre o atendimento..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : scheduleLater ? "Agendar Serviço" : "Lançar Atendimento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
