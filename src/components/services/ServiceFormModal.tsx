import { useEffect } from "react";
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
import { Service } from "@/hooks/useServices";

const serviceSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  price: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  duration_minutes: z.number().min(5, "Duração mínima é 5 minutos"),
  is_active: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSubmit: (data: ServiceFormValues) => void;
  isLoading?: boolean;
}

export function ServiceFormModal({
  open,
  onOpenChange,
  service,
  onSubmit,
  isLoading,
}: ServiceFormModalProps) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      price: 0,
      duration_minutes: 30,
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: service?.name || "",
        price: service?.price || 0,
        duration_minutes: service?.duration_minutes || 30,
        is_active: service?.is_active ?? true,
      });
    }
  }, [open, service, form]);

  const handleSubmit = (data: ServiceFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {service ? "Editar Serviço" : "Novo Serviço"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Corte Masculino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="50.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração (minutos)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="5"
                      step="5"
                      placeholder="30"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {service ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
