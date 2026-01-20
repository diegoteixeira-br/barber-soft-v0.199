import { useState, useMemo } from "react";
import { DollarSign, Calendar, TrendingUp, Users, Zap, Banknote, Smartphone, CreditCard, Gift } from "lucide-react";
import { useFinancialData, getDateRanges } from "@/hooks/useFinancialData";
import { RevenueCard } from "./RevenueCard";
import { TransactionsTable } from "./TransactionsTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { QuickServiceModal } from "@/components/agenda/QuickServiceModal";
import { useBarbers } from "@/hooks/useBarbers";
import { useServices } from "@/hooks/useServices";
import { useAppointments, type QuickServiceFormData } from "@/hooks/useAppointments";
import { useCurrentUnit } from "@/contexts/UnitContext";

type PeriodFilter = "today" | "week" | "month";

export function CashFlowTab() {
  const { currentUnitId } = useCurrentUnit();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [isQuickServiceOpen, setIsQuickServiceOpen] = useState(false);
  const dateRanges = getDateRanges();

  // Fetch data for each period
  const { appointments: todayAppointments } = useFinancialData(dateRanges.today);
  const { appointments: weekAppointments } = useFinancialData(dateRanges.week);
  const { appointments: monthAppointments, isLoading } = useFinancialData(dateRanges.month);

  const { barbers } = useBarbers(currentUnitId);
  const { services } = useServices(currentUnitId);
  const { createQuickService } = useAppointments();

  const handleQuickServiceSubmit = async (data: QuickServiceFormData) => {
    await createQuickService.mutateAsync(data);
    setIsQuickServiceOpen(false);
  };

  // Calculate totals
  const todayTotal = useMemo(
    () => todayAppointments.reduce((sum, apt) => sum + apt.total_price, 0),
    [todayAppointments]
  );

  const weekTotal = useMemo(
    () => weekAppointments.reduce((sum, apt) => sum + apt.total_price, 0),
    [weekAppointments]
  );

  const monthTotal = useMemo(
    () => monthAppointments.reduce((sum, apt) => sum + apt.total_price, 0),
    [monthAppointments]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Get filtered appointments based on selected period
  const filteredAppointments = useMemo(() => {
    switch (periodFilter) {
      case "today":
        return todayAppointments;
      case "week":
        return weekAppointments;
      case "month":
      default:
        return monthAppointments;
    }
  }, [periodFilter, todayAppointments, weekAppointments, monthAppointments]);

  // Calculate payment method breakdown for filtered period
  const paymentBreakdown = useMemo(() => {
    const breakdown = {
      cash: { total: 0, count: 0 },
      pix: { total: 0, count: 0 },
      debit_card: { total: 0, count: 0 },
      credit_card: { total: 0, count: 0 },
      courtesy: { total: 0, count: 0 },
    };

    filteredAppointments.forEach((apt) => {
      const method = apt.payment_method as keyof typeof breakdown;
      if (method && breakdown[method]) {
        breakdown[method].total += apt.total_price;
        breakdown[method].count += 1;
      }
    });

    return breakdown;
  }, [filteredAppointments]);

  const paymentMethodConfig = [
    { key: "cash" as const, label: "Dinheiro", icon: Banknote, color: "text-green-500", bg: "bg-green-500/10" },
    { key: "pix" as const, label: "PIX", icon: Smartphone, color: "text-blue-500", bg: "bg-blue-500/10" },
    { key: "debit_card" as const, label: "Débito", icon: CreditCard, color: "text-orange-500", bg: "bg-orange-500/10" },
    { key: "credit_card" as const, label: "Crédito", icon: CreditCard, color: "text-purple-500", bg: "bg-purple-500/10" },
    { key: "courtesy" as const, label: "Cortesia", icon: Gift, color: "text-pink-500", bg: "bg-pink-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueCard
          title="Faturamento Hoje"
          value={formatCurrency(todayTotal)}
          subtitle={`${todayAppointments.length} atendimento(s)`}
          icon={DollarSign}
          variant="success"
        />
        <RevenueCard
          title="Faturamento da Semana"
          value={formatCurrency(weekTotal)}
          subtitle={`${weekAppointments.length} atendimento(s)`}
          icon={Calendar}
          variant="info"
        />
        <RevenueCard
          title="Faturamento do Mês"
          value={formatCurrency(monthTotal)}
          subtitle={`${monthAppointments.length} atendimento(s)`}
          icon={TrendingUp}
          variant="warning"
        />
        <RevenueCard
          title="Total Finalizados"
          value={String(monthAppointments.length)}
          subtitle="Este mês"
          icon={Users}
          variant="default"
        />
      </div>

      {/* Payment Method Breakdown */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Faturamento por Forma de Pagamento ({periodFilter === "today" ? "Hoje" : periodFilter === "week" ? "Semana" : "Mês"})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {paymentMethodConfig.map(({ key, label, icon: Icon, color, bg }) => (
            <div key={key} className={`rounded-lg ${bg} p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className={`text-sm font-medium ${color}`}>{label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(paymentBreakdown[key].total)}</p>
              <p className="text-xs text-muted-foreground">{paymentBreakdown[key].count} venda(s)</p>
            </div>
          ))}
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Transações Finalizadas</h3>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setIsQuickServiceOpen(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Lançar Serviço
          </Button>
          <Tabs value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <TabsList className="bg-muted">
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionsTable appointments={filteredAppointments} isLoading={isLoading} />

      {/* Quick Service Modal */}
      <QuickServiceModal
        open={isQuickServiceOpen}
        onOpenChange={setIsQuickServiceOpen}
        barbers={barbers}
        services={services}
        onSubmit={handleQuickServiceSubmit}
        isLoading={createQuickService.isPending}
      />
    </div>
  );
}
