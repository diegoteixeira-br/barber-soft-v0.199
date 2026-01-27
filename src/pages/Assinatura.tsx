import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  XCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Zap,
  Building2,
  Users
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const planDetails = {
  inicial: {
    name: "Inicial",
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    features: ["1 Unidade", "5 Profissionais", "Agenda ilimitada", "Relatórios básicos"],
    monthlyPrice: 99,
    annualPrice: 79,
  },
  profissional: {
    name: "Profissional",
    icon: Crown,
    color: "text-gold",
    bgColor: "bg-gold/10",
    features: ["3 Unidades", "15 Profissionais", "WhatsApp integrado", "Jackson IA", "Marketing automation"],
    monthlyPrice: 199,
    annualPrice: 159,
  },
  franquias: {
    name: "Franquias",
    icon: Building2,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    features: ["Unidades ilimitadas", "Profissionais ilimitados", "Multi-loja", "API completa", "Suporte prioritário"],
    monthlyPrice: 499,
    annualPrice: 399,
  },
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "trial":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Em Trial</Badge>;
    case "active":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
    case "cancelled":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelado</Badge>;
    case "overdue":
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Pagamento Pendente</Badge>;
    case "partner":
      return <Badge className="bg-gold/20 text-gold border-gold/30">Parceiro</Badge>;
    default:
      return <Badge variant="secondary">Desconhecido</Badge>;
  }
};

export default function Assinatura() {
  const { status, isLoading, openCustomerPortal, startCheckout, isTrialing, isPartner, daysRemaining } = useSubscription();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  const currentPlan = status?.plan_type ? planDetails[status.plan_type] : null;
  const PlanIcon = currentPlan?.icon || Crown;

  const handleOpenPortal = async () => {
    setIsPortalLoading(true);
    await openCustomerPortal();
    setIsPortalLoading(false);
  };

  const handleUpgrade = async (plan: string) => {
    setIsUpgrading(plan);
    await startCheckout(plan, "monthly");
    setIsUpgrading(null);
  };

  const trialProgress = isTrialing && daysRemaining !== null 
    ? ((7 - daysRemaining) / 7) * 100 
    : 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minha Assinatura</h1>
          <p className="text-muted-foreground">Gerencie seu plano e informações de pagamento</p>
        </div>

        {/* Trial Alert */}
        {isTrialing && daysRemaining !== null && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-blue-400">Período de Avaliação</h3>
                    <p className="text-sm text-muted-foreground">
                      Você está aproveitando seu trial gratuito de 7 dias. 
                      {daysRemaining > 0 
                        ? ` Restam ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} para testar todas as funcionalidades.`
                        : " Seu trial expira hoje!"
                      }
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progresso do trial</span>
                      <span className="text-blue-400">{7 - (daysRemaining || 0)}/7 dias</span>
                    </div>
                    <Progress value={trialProgress} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Partner Status */}
        {isPartner && (
          <Card className="border-gold/30 bg-gold/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gold/20">
                  <Crown className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-gold">Parceiro BarberSoft</h3>
                  <p className="text-sm text-muted-foreground">
                    Você tem acesso especial como parceiro. Obrigado por fazer parte da nossa jornada!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PlanIcon className={`h-5 w-5 ${currentPlan?.color || 'text-gold'}`} />
                  Plano Atual
                </CardTitle>
                {getStatusBadge(status?.plan_status)}
              </div>
              <CardDescription>Detalhes da sua assinatura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPlan ? (
                <>
                  <div className={`p-4 rounded-lg ${currentPlan.bgColor}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`text-xl font-bold ${currentPlan.color}`}>
                          {currentPlan.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          R$ {currentPlan.monthlyPrice}/mês
                        </p>
                      </div>
                      <currentPlan.icon className={`h-10 w-10 ${currentPlan.color} opacity-50`} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recursos inclusos:</p>
                    <ul className="space-y-1">
                      {currentPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum plano ativo</p>
                  <Button className="mt-4" onClick={() => window.location.href = "/escolher-plano"}>
                    Escolher um Plano
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing & Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Faturamento
              </CardTitle>
              <CardDescription>Gerencie pagamentos e faturas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={handleOpenPortal}
                disabled={isPortalLoading || !currentPlan}
              >
                <span className="flex items-center gap-2">
                  {isPortalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Gerenciar Método de Pagamento
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={handleOpenPortal}
                disabled={isPortalLoading || !currentPlan}
              >
                <span className="flex items-center gap-2">
                  {isPortalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                  Ver Histórico de Faturas
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Ações da Assinatura</p>
                
                {/* Upgrade Button */}
                {currentPlan && status?.plan_type !== "franquias" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2 text-green-500 hover:text-green-400 hover:bg-green-500/10">
                        <ArrowUpCircle className="h-4 w-4" />
                        Fazer Upgrade
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Fazer Upgrade de Plano</AlertDialogTitle>
                        <AlertDialogDescription>
                          Escolha o novo plano para fazer upgrade. Você será redirecionado ao portal de pagamento.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid gap-3 py-4">
                        {Object.entries(planDetails)
                          .filter(([key]) => {
                            const order = ["inicial", "profissional", "franquias"];
                            return order.indexOf(key) > order.indexOf(status?.plan_type || "");
                          })
                          .map(([key, plan]) => (
                            <Button
                              key={key}
                              variant="outline"
                              className="justify-between"
                              onClick={() => handleUpgrade(key)}
                              disabled={isUpgrading === key}
                            >
                              <span className="flex items-center gap-2">
                                <plan.icon className={`h-4 w-4 ${plan.color}`} />
                                {plan.name}
                              </span>
                              <span className="text-muted-foreground">
                                R$ {plan.monthlyPrice}/mês
                              </span>
                            </Button>
                          ))}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Downgrade Button */}
                {currentPlan && status?.plan_type !== "inicial" && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                    onClick={handleOpenPortal}
                    disabled={isPortalLoading}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    Fazer Downgrade
                  </Button>
                )}

                {/* Cancel Button */}
                {currentPlan && !isPartner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                        <XCircle className="h-4 w-4" />
                        Cancelar Assinatura
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja cancelar? Você perderá acesso a todas as funcionalidades premium 
                          ao final do período já pago. Esta ação pode ser revertida até a data de expiração.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Manter Assinatura</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleOpenPortal}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Confirmar Cancelamento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Money-back Guarantee */}
        <Card className="border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gold/20">
                <CheckCircle className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold">Garantia de 30 Dias</h3>
                <p className="text-sm text-muted-foreground">
                  Não está satisfeito? Entre em contato com nosso suporte em até 30 dias após a compra 
                  e devolvemos 100% do seu dinheiro. Sem perguntas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
