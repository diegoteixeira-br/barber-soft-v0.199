import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Banknote, Smartphone, CreditCard, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMethod = "cash" | "pix" | "debit_card" | "credit_card" | "courtesy";

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentMethod: PaymentMethod) => void;
  totalPrice: number;
  isLoading?: boolean;
}

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
  { value: "cash", label: "Dinheiro", icon: Banknote, color: "text-green-500 bg-green-500/10 border-green-500/30 hover:bg-green-500/20" },
  { value: "pix", label: "PIX", icon: Smartphone, color: "text-blue-500 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20" },
  { value: "debit_card", label: "Débito", icon: CreditCard, color: "text-orange-500 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20" },
  { value: "credit_card", label: "Crédito", icon: CreditCard, color: "text-purple-500 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20" },
  { value: "courtesy", label: "Cortesia", icon: Gift, color: "text-pink-500 bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20" },
];

export function PaymentMethodModal({
  open,
  onOpenChange,
  onConfirm,
  totalPrice,
  isLoading,
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod);
      setSelectedMethod(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedMethod(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Forma de Pagamento
          </DialogTitle>
          <DialogDescription>
            Selecione como o cliente vai pagar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valor */}
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">Valor a receber</p>
            <p className="text-2xl font-bold text-foreground">
              {selectedMethod === "courtesy" ? formatCurrency(0) : formatCurrency(totalPrice)}
            </p>
            {selectedMethod === "courtesy" && (
              <p className="text-xs text-pink-500 mt-1">Serviço oferecido como cortesia</p>
            )}
          </div>

          {/* Payment Methods Grid */}
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.value;
              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setSelectedMethod(method.value)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all",
                    method.color,
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <Icon className="h-8 w-8" />
                  <span className="font-medium">{method.label}</span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedMethod || isLoading}
              className="flex-1"
            >
              {isLoading ? "Finalizando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for displaying payment method badge
export function PaymentBadge({ method }: { method: string | null }) {
  if (!method) return <span className="text-muted-foreground">-</span>;

  const config: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    cash: { label: "Dinheiro", icon: Banknote, className: "bg-green-500/10 text-green-500" },
    pix: { label: "PIX", icon: Smartphone, className: "bg-blue-500/10 text-blue-500" },
    debit_card: { label: "Débito", icon: CreditCard, className: "bg-orange-500/10 text-orange-500" },
    credit_card: { label: "Crédito", icon: CreditCard, className: "bg-purple-500/10 text-purple-500" },
    courtesy: { label: "Cortesia", icon: Gift, className: "bg-pink-500/10 text-pink-500" },
  };

  const methodConfig = config[method];
  if (!methodConfig) return <span className="text-muted-foreground">{method}</span>;

  const Icon = methodConfig.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", methodConfig.className)}>
      <Icon className="h-3 w-3" />
      {methodConfig.label}
    </span>
  );
}
