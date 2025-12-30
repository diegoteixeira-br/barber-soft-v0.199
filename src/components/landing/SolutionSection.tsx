import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ChatSimulation } from "./ChatSimulation";
import { Bot, Clock, MessageCircle, Calendar, Bell, UserCheck, Gift, RefreshCcw } from "lucide-react";

const features = [
  { icon: Clock, text: "Responde 24 horas por dia" },
  { icon: Calendar, text: "Agenda automaticamente" },
  { icon: Bell, text: "Confirma presença" },
  { icon: Gift, text: "Lembra aniversários" },
  { icon: RefreshCcw, text: "Resgata clientes inativos" },
  { icon: UserCheck, text: "Envia lembretes" },
];

export function SolutionSection() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-charcoal/30 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-neon/10 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div
          ref={ref}
          className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
              <Bot className="h-4 w-4 text-gold" />
              <span className="text-sm text-gold">Automação Inteligente</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Conheça o <span className="text-gold">Jackson</span>: Seu Gerente Virtual
            </h2>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Ele responde 24h, agenda, confirma presença, lembra aniversários e resgata clientes inativos.{" "}
              <span className="text-foreground font-medium">
                Tudo automático no WhatsApp da sua barbearia.
              </span>
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-gold" />
                  </div>
                  <span className="text-sm text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">Redução de 80%</span> nas faltas com lembretes automáticos
              </p>
            </div>
          </div>

          {/* Chat Simulation */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-radial from-gold/20 to-transparent opacity-50 blur-3xl" />
            <div className="relative z-10 transform lg:translate-x-8">
              <ChatSimulation />
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -top-4 -left-4 bg-charcoal border border-border/30 rounded-lg p-4 shadow-xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">98%</p>
                  <p className="text-xs text-muted-foreground">Taxa de resposta</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-charcoal border border-border/30 rounded-lg p-4 shadow-xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">~30s</p>
                  <p className="text-xs text-muted-foreground">Resposta natural</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}