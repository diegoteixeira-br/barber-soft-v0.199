import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useRemainingSpots } from "@/hooks/useRemainingSpots";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Inicial",
    monthlyPrice: 99,
    annualPrice: 79,
    annualSavings: 240,
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
    name: "Profissional",
    monthlyPrice: 199,
    annualPrice: 159,
    annualSavings: 480,
    description: "O mais escolhido pelos nossos clientes",
    features: [
      "Até 1 Unidade",
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
    name: "Franquias",
    monthlyPrice: 499,
    annualPrice: 399,
    annualSavings: 1200,
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

export function PricingSection() {
  const { ref, isVisible } = useScrollAnimation();
  const { remainingSpots, isLoading } = useRemainingSpots();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="precos" className="py-16 sm:py-20 bg-background relative">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 sm:px-4 relative z-10">
        <div
          ref={ref}
          className={`text-center mb-8 sm:mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-gold font-semibold text-sm uppercase tracking-wider">
            Planos
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Todos os planos incluem 7 dias grátis. Cancele quando quiser.
          </p>
        </div>

        {/* Banner Flutuante - Aviso de Teste Grátis */}
        <div className="flex justify-center mb-6 sm:mb-8 px-2">
          <div className="animate-float bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-green-500/30 w-full sm:w-auto">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                <span className="text-lg sm:text-xl">🎉</span>
                <p className="text-xs sm:text-sm md:text-base font-bold text-center">
                  PERÍODO DE TESTES — PLANOS AINDA NÃO ESTÃO VALENDO!
                </p>
                <span className="text-lg sm:text-xl hidden sm:inline">🎉</span>
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm opacity-90 text-center">
                Use a plataforma completa gratuitamente. Sem cartão de crédito, sem compromisso.
              </p>
              <div className="mt-2 px-3 sm:px-4 py-1 bg-white/20 rounded-full">
                <p className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2">
                  🔥 Apenas <span className="text-yellow-300 text-base sm:text-lg">{isLoading ? "..." : remainingSpots}</span> vagas para testadores!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div
          className={`flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
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

        {/* Cards - 1 coluna em mobile, 3 em desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan, index) => {
            const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            
            return (
              <div
                key={index}
                className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-500 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-gold/10 to-charcoal border-2 border-gold/50 shadow-xl shadow-gold/10 md:scale-105 z-10"
                    : "bg-charcoal/50 border border-border/30 hover:border-border/60"
                } ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${(index + 1) * 150}ms` }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 sm:px-4 py-1 rounded-full bg-gold text-black text-xs sm:text-sm font-semibold whitespace-nowrap">
                      <Sparkles className="h-3 w-3" />
                      Recomendado
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-muted-foreground text-sm">R$</span>
                    <span className="text-3xl sm:text-4xl font-bold text-foreground transition-all duration-300">
                      {currentPrice}
                    </span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  {isAnnual && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        cobrado anualmente
                      </p>
                      <p className="text-xs text-green-400 font-medium">
                        Economize R$ {plan.annualSavings}/ano
                      </p>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 sm:space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check
                        className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                          plan.highlighted ? "text-gold" : "text-green-500"
                        }`}
                      />
                      <span className="text-xs sm:text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-gold hover:bg-gold/90 text-black font-semibold"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  onClick={() => navigate("/auth?tab=signup")}
                >
                  Começar Agora
                </Button>
              </div>
            );
          })}
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center mt-8 sm:mt-12">
          <p className="text-muted-foreground text-xs sm:text-sm">
            💰 Garantia de 30 dias ou seu dinheiro de volta. Sem perguntas.
          </p>
        </div>
      </div>
    </section>
  );
}
