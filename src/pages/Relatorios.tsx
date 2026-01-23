import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnits } from "@/hooks/useUnits";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, TrendingUp, Calendar, UserPlus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/financeiro/DateRangePicker";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientDistributionChart } from "@/components/relatorios/ClientDistributionChart";
import { UnitMetricsTable } from "@/components/relatorios/UnitMetricsTable";
import { VisitsPerUnitChart } from "@/components/relatorios/VisitsPerUnitChart";
import { NewClientsChart } from "@/components/relatorios/NewClientsChart";

interface UnitMetrics {
  unitId: string;
  unitName: string;
  totalClients: number;
  totalVisits: number;
  activeClients: number;
  inactiveClients: number;
  birthdayClients: number;
  newClientsThisMonth: number;
}

type PeriodFilter = "today" | "week" | "month" | "custom";

export default function Relatorios() {
  const { units, isLoading: unitsLoading } = useUnits();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [customDateRange, setCustomDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (periodFilter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case "custom":
        return customDateRange;
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [periodFilter, customDateRange]);

  const periodLabel = useMemo(() => {
    switch (periodFilter) {
      case "today": return "Hoje";
      case "week": return "Esta Semana";
      case "custom": return "No Período";
      default: return "Este Mês";
    }
  }, [periodFilter]);

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["all-clients-report"],
    queryFn: async () => {
      const { data: userUnits } = await supabase.from("units").select("id, name");
      if (!userUnits || userUnits.length === 0) return { clients: [], units: [] };

      const unitIds = userUnits.map((u) => u.id);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .in("unit_id", unitIds);

      if (error) throw error;
      return { clients: data || [], units: userUnits };
    },
  });

  const unitMetrics: UnitMetrics[] = useMemo(() => {
    if (!clientsData) return [];

    const { clients, units: unitsList } = clientsData;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const currentMonth = new Date().getMonth() + 1;

    return unitsList.map((unit: { id: string; name: string }) => {
      const unitClients = clients.filter((c: any) => c.unit_id === unit.id);
      
      const activeClients = unitClients.filter((c: any) => {
        if (!c.last_visit_at) return false;
        return new Date(c.last_visit_at) >= thirtyDaysAgo;
      }).length;

      const inactiveClients = unitClients.filter((c: any) => {
        if (!c.last_visit_at) return true;
        return new Date(c.last_visit_at) < thirtyDaysAgo;
      }).length;

      const birthdayClients = unitClients.filter((c: any) => {
        if (!c.birth_date) return false;
        const birthMonth = Number(c.birth_date.split("-")[1]);
        return birthMonth === currentMonth;
      }).length;

      // Novos clientes filtrados pelo período selecionado
      const newClientsInPeriod = unitClients.filter((c: any) => {
        if (!c.created_at) return false;
        const createdDate = new Date(c.created_at);
        return isWithinInterval(createdDate, { start: dateRange.start, end: dateRange.end });
      }).length;

      const totalVisits = unitClients.reduce((sum: number, c: any) => sum + (c.total_visits || 0), 0);

      return {
        unitId: unit.id,
        unitName: unit.name,
        totalClients: unitClients.length,
        totalVisits,
        activeClients,
        inactiveClients,
        birthdayClients,
        newClientsThisMonth: newClientsInPeriod,
      };
    });
  }, [clientsData, dateRange]);

  const totalClients = unitMetrics.reduce((sum, u) => sum + u.totalClients, 0);
  const totalVisits = unitMetrics.reduce((sum, u) => sum + u.totalVisits, 0);
  const totalNewClients = unitMetrics.reduce((sum, u) => sum + u.newClientsThisMonth, 0);
  const totalActive = unitMetrics.reduce((sum, u) => sum + u.activeClients, 0);

  const isLoading = unitsLoading || clientsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise de clientes e métricas por unidade
            </p>
          </div>
          
          {/* Filtros de período */}
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <TabsList className="bg-secondary">
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
                <TabsTrigger value="custom">Personalizado</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {periodFilter === "custom" && (
              <DateRangePicker
                dateRange={customDateRange}
                onDateRangeChange={setCustomDateRange}
              />
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{totalClients}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Total de Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{totalActive}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Clientes Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{totalVisits}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Total de Visitas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                  <UserPlus className="h-5 w-5 text-gold" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{totalNewClients}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Novos {periodLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Distribuição de Clientes por Unidade
              </CardTitle>
              <CardDescription>
                Proporção de clientes em cada unidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : unitMetrics.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              ) : (
                <ClientDistributionChart data={unitMetrics} />
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Visitas por Unidade
              </CardTitle>
              <CardDescription>
                Total de visitas acumuladas em cada unidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : unitMetrics.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              ) : (
                <VisitsPerUnitChart data={unitMetrics} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* New Clients Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Novos Clientes {periodLabel} por Unidade
            </CardTitle>
            <CardDescription>
              Comparativo de captação de novos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : unitMetrics.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <NewClientsChart data={unitMetrics} />
            )}
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Métricas Detalhadas por Unidade</CardTitle>
            <CardDescription>
              Visão completa de todas as métricas de clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <UnitMetricsTable data={unitMetrics} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
