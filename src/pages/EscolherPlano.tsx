import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Scissors, Check, Sparkles, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "inicial",
    name: "Inicial",
    monthlyPrice: 99,
    annualPrice: 79,
    annualTotal: 948,
    description: "Perfeito para barbearias iniciantes",
    features: [
      "1 Unidade",
      "Até 5 Profissionais",
      "Agenda completa",
      "Dashboard financeiro",
      "Gestão de clientes",
      "Controle de serviços",
    ],
    highlighted: false,
  },
  {
    id: "profissional",
    name: "Profissional",
    monthlyPrice: 199,
    annualPrice: 159,
    annualTotal: 1908,
    description: "O mais escolhido pelos nossos clientes",
    features: [
      "1 Unidade",
      "Até 10 Profissionais",
      "Integração WhatsApp",
      "Jackson IA (Atendente Virtual)",
      "Marketing e automações",
      "Comissões automáticas",
      "Controle de estoque",
      "Relatórios avançados",
    ],
    highlighted: true,
  },
  {
    id: "franquias",
    name: "Franquias",
    monthlyPrice: 499,
    annualPrice: 399,
    annualTotal: 4788,
    description: "Para redes com múltiplas unidades",
    features: [
      "Unidades ilimitadas",
      "Profissionais ilimitados",
      "Tudo do Profissional",
      "Dashboard consolidado de todas unidades",
    ],
    highlighted: false,
  },
];

export default function EscolherPlano() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startCheckout } = useSubscription();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setLoadingPlan(planId);
    
    try {
      const billing = isAnnual ? "annual" : "monthly";
      await startCheckout(planId, billing);
    } catch (error) {
      console.error("Error starting checkout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Logo */}
        <Link to="/" className="mb-8 flex flex-col items-center group">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary glow-gold group-hover:scale-105 transition-transform">
            <Scissors className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gold group-hover:text-gold/80 transition-colors">BarberSoft</h1>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            Escolha seu plano
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Todos os planos incluem <span className="text-gold font-semibold">7 dias grátis</span> para você testar.
            Cancele quando quiser.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span
            className={`text-sm font-medium transition-colors ${
              !isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Mensal
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
              isAnnual ? "bg-gold" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                isAnnual ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium transition-colors ${
                isAnnual ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Anual
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
              -20%
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isLoadingThis = loadingPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-gold/10 to-charcoal border-2 border-gold/50 shadow-xl shadow-gold/10 md:scale-105 z-10"
                    : "bg-charcoal/50 border-border/30 hover:border-border/60"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-gold text-black text-sm font-semibold">
                      <Sparkles className="h-3 w-3" />
                      Recomendado
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="flex items-baseline justify-center gap-1 mt-4">
                    <span className="text-muted-foreground text-sm">R$</span>
                    <span className="text-4xl font-bold text-foreground">{currentPrice}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-muted-foreground mt-1">
                      cobrado R$ {plan.annualTotal}/ano
                    </p>
                  )}
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check
                          className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                            plan.highlighted ? "text-gold" : "text-green-500"
                          }`}
                        />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-gold hover:bg-gold/90 text-black font-semibold"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loadingPlan !== null}
                  >
                    {isLoadingThis ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Iniciar Trial de 7 Dias"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Guarantee Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-muted-foreground text-sm">
            <Shield className="h-4 w-4 text-green-500" />
            Garantia de 30 dias ou seu dinheiro de volta
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} BarberSoft. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
