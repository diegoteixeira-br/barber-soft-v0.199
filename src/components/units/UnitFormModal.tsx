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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Unit } from "@/hooks/useUnits";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Globe } from "lucide-react";

// Fusos horários brasileiros
const BRAZIL_TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília/São Paulo (UTC-3)' },
  { value: 'America/Cuiaba', label: 'Cuiabá/Campo Grande (UTC-4)' },
  { value: 'America/Manaus', label: 'Manaus/Amazonas (UTC-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco/Acre (UTC-5)' },
  { value: 'America/Recife', label: 'Recife/Nordeste (UTC-3)' },
  { value: 'America/Belem', label: 'Belém/Pará (UTC-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza/Ceará (UTC-3)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (UTC-2)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho/Rondônia (UTC-4)' },
  { value: 'America/Boa_Vista', label: 'Boa Vista/Roraima (UTC-4)' },
];

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  address: z.string().max(200, "Endereço muito longo").optional(),
  phone: z.string().max(20, "Telefone muito longo").optional(),
  manager_name: z.string().max(100, "Nome muito longo").optional(),
  evolution_instance_name: z
    .string()
    .max(50, "Nome muito longo")
    .regex(/^[a-zA-Z0-9_-]*$/, "Use apenas letras, números, hífens e underscores")
    .optional(),
  timezone: z.string().default('America/Sao_Paulo'),
});

type FormData = z.infer<typeof formSchema>;

interface UnitFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  unit?: Unit | null;
  isLoading?: boolean;
}

export function UnitFormModal({ open, onClose, onSubmit, unit, isLoading }: UnitFormModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      manager_name: "",
      evolution_instance_name: "",
      timezone: "America/Sao_Paulo",
    },
  });

  useEffect(() => {
    if (unit) {
      form.reset({
        name: unit.name,
        address: unit.address || "",
        phone: unit.phone || "",
        manager_name: unit.manager_name || "",
        evolution_instance_name: unit.evolution_instance_name || "",
        timezone: unit.timezone || "America/Sao_Paulo",
      });
    } else {
      form.reset({
        name: "",
        address: "",
        phone: "",
        manager_name: "",
        evolution_instance_name: "",
        timezone: "America/Sao_Paulo",
      });
    }
  }, [unit, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit({
      name: data.name,
      address: data.address || undefined,
      phone: data.phone || undefined,
      manager_name: data.manager_name || undefined,
      evolution_instance_name: data.evolution_instance_name?.toLowerCase().trim() || undefined,
      timezone: data.timezone,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{unit ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Unidade *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Barbearia Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua das Flores, 123" {...field} />
                  </FormControl>
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
                    <Input placeholder="Ex: (11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manager_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gerente Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Globe className="h-4 w-4" />
                Configuração Regional
              </div>

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuso Horário</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fuso horário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BRAZIL_TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Fuso horário para interpretação de agendamentos via WhatsApp.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                Integração WhatsApp (n8n)
              </div>

              <FormField
                control={form.control}
                name="evolution_instance_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Instância</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: barbearia-centro" {...field} />
                    </FormControl>
                    <FormDescription>
                      Identificador único usado pelo n8n para esta unidade. Use apenas letras, números, hífens e underscores.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : unit ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
