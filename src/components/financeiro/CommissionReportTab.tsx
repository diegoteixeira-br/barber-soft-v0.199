import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Wallet, TrendingUp, Banknote, Smartphone, CreditCard, Receipt, Info, Gift } from "lucide-react";
import { 
  useFinancialData, 
  getMonthRange, 
  calculateCardFee,
  calculateNetValue,
  calculateCommissionWithFees,
  calculateProfitWithFees
} from "@/hooks/useFinancialData";
import { useBarbers } from "@/hooks/useBarbers";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { RevenueCard } from "./RevenueCard";
import { CommissionTable } from "./CommissionTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function CommissionReportTab() {
  const { currentUnitId } = useCurrentUnit();
  const { barbers } = useBarbers(currentUnitId);
  const { settings } = useBusinessSettings();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  const dateRange = useMemo(
    () => getMonthRange(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const { appointments, isLoading } = useFinancialData(dateRange, selectedBarberId);

  // Get fee settings
  const debitFeePercent = settings?.debit_card_fee_percent ?? 1.5;
  const creditFeePercent = settings?.credit_card_fee_percent ?? 3.0;
  const calculationBase = (settings?.commission_calculation_base as 'gross' | 'net') ?? 'gross';

  // Calculate totals with fees
  const totals = useMemo(() => {
    return appointments.reduce(
      (acc, apt) => {
        const cardFee = calculateCardFee(apt.total_price, apt.payment_method, debitFeePercent, creditFeePercent);
        const netValue = calculateNetValue(apt.total_price, apt.payment_method, debitFeePercent, creditFeePercent);
        const commission = calculateCommissionWithFees(
          apt.total_price,
          apt.payment_method,
          apt.barber?.commission_rate ?? null,
          debitFeePercent,
          creditFeePercent,
          calculationBase
        );
        const profit = calculateProfitWithFees(
          apt.total_price,
          apt.payment_method,
          apt.barber?.commission_rate ?? null,
          debitFeePercent,
          creditFeePercent,
          calculationBase
        );
        
        return {
          gross: acc.gross + apt.total_price,
          cardFees: acc.cardFees + cardFee,
          net: acc.net + netValue,
          commission: acc.commission + commission,
          profit: acc.profit + profit,
        };
      },
      { gross: 0, cardFees: 0, net: 0, commission: 0, profit: 0 }
    );
  }, [appointments, debitFeePercent, creditFeePercent, calculationBase]);

  // Payment method breakdown with fees
  const paymentBreakdown = useMemo(() => {
    const breakdown = {
      cash: { total: 0, cardFee: 0, netValue: 0, commission: 0, count: 0 },
      pix: { total: 0, cardFee: 0, netValue: 0, commission: 0, count: 0 },
      debit_card: { total: 0, cardFee: 0, netValue: 0, commission: 0, count: 0 },
      credit_card: { total: 0, cardFee: 0, netValue: 0, commission: 0, count: 0 },
      courtesy: { total: 0, cardFee: 0, netValue: 0, commission: 0, count: 0 },
    };

    appointments.forEach((apt) => {
      const method = (apt.payment_method || "cash") as keyof typeof breakdown;
      const cardFee = calculateCardFee(apt.total_price, apt.payment_method, debitFeePercent, creditFeePercent);
      const netValue = calculateNetValue(apt.total_price, apt.payment_method, debitFeePercent, creditFeePercent);
      const commission = calculateCommissionWithFees(
        apt.total_price,
        apt.payment_method,
        apt.barber?.commission_rate ?? null,
        debitFeePercent,
        creditFeePercent,
        calculationBase
      );
      
      if (breakdown[method]) {
        breakdown[method].total += apt.total_price;
        breakdown[method].cardFee += cardFee;
        breakdown[method].netValue += netValue;
        breakdown[method].commission += commission;
        breakdown[method].count += 1;
      }
    });

    return breakdown;
  }, [appointments, debitFeePercent, creditFeePercent, calculationBase]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Generate month options
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i, 1), "MMMM", { locale: ptBR }),
  }));

  // Generate year options (last 3 years)
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  return (
    <div className="space-y-6">
      {/* Configuration indicator */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Base de cálculo: <Badge variant="outline" className="ml-1">{calculationBase === 'net' ? 'Valor Líquido' : 'Valor Bruto'}</Badge>
        </span>
        <span className="text-sm text-muted-foreground ml-4">
          Taxa Débito: <Badge variant="outline">{debitFeePercent}%</Badge>
        </span>
        <span className="text-sm text-muted-foreground ml-2">
          Taxa Crédito: <Badge variant="outline">{creditFeePercent}%</Badge>
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-muted/30 border border-border">
        <div className="space-y-2">
          <Label>Mês</Label>
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={String(month.value)}>
                  {month.label.charAt(0).toUpperCase() + month.label.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ano</Label>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Barbeiro</Label>
          <Select
            value={selectedBarberId || "all"}
            onValueChange={(v) => setSelectedBarberId(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Barbeiros</SelectItem>
              {barbers.map((barber) => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards - Updated with fees */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <TooltipProvider>
          <RevenueCard
            title={selectedBarber ? `Total Bruto - ${selectedBarber.name}` : "Total Bruto"}
            value={formatCurrency(totals.gross)}
            subtitle={`${appointments.length} atendimento(s)`}
            icon={DollarSign}
            variant="default"
          />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <RevenueCard
                  title="Taxas de Cartão"
                  value={`-${formatCurrency(totals.cardFees)}`}
                  subtitle="Débito + Crédito"
                  icon={Receipt}
                  variant="danger"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Débito: {debitFeePercent}% | Crédito: {creditFeePercent}%</p>
            </TooltipContent>
          </Tooltip>

          <RevenueCard
            title="Total Líquido"
            value={formatCurrency(totals.net)}
            subtitle="Após taxas de cartão"
            icon={DollarSign}
            variant="default"
          />

          <RevenueCard
            title="Comissão a Pagar"
            value={formatCurrency(totals.commission)}
            subtitle={selectedBarber ? `Taxa: ${selectedBarber.commission_rate || 50}%` : calculationBase === 'net' ? 'Sobre valor líquido' : 'Sobre valor bruto'}
            icon={Wallet}
            variant="warning"
          />

          <RevenueCard
            title="Lucro da Barbearia"
            value={formatCurrency(totals.profit)}
            subtitle="Líquido - Comissões"
            icon={TrendingUp}
            variant="success"
          />
        </TooltipProvider>
      </div>

      {/* Payment Method Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Resumo por Forma de Pagamento</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-muted-foreground">Dinheiro</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(paymentBreakdown.cash.total)}</p>
            <p className="text-xs text-muted-foreground">
              {paymentBreakdown.cash.count} atend. • Comissão: {formatCurrency(paymentBreakdown.cash.commission)}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-medium text-muted-foreground">PIX</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(paymentBreakdown.pix.total)}</p>
            <p className="text-xs text-muted-foreground">
              {paymentBreakdown.pix.count} atend. • Comissão: {formatCurrency(paymentBreakdown.pix.commission)}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Débito</span>
              <Badge variant="outline" className="text-xs">-{debitFeePercent}%</Badge>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(paymentBreakdown.debit_card.total)}</p>
            <p className="text-xs text-muted-foreground">
              {paymentBreakdown.debit_card.count} atend. • Taxa: {formatCurrency(paymentBreakdown.debit_card.cardFee)}
            </p>
            <p className="text-xs text-muted-foreground">
              Líq: {formatCurrency(paymentBreakdown.debit_card.netValue)} • Com: {formatCurrency(paymentBreakdown.debit_card.commission)}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Crédito</span>
              <Badge variant="outline" className="text-xs">-{creditFeePercent}%</Badge>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(paymentBreakdown.credit_card.total)}</p>
            <p className="text-xs text-muted-foreground">
              {paymentBreakdown.credit_card.count} atend. • Taxa: {formatCurrency(paymentBreakdown.credit_card.cardFee)}
            </p>
            <p className="text-xs text-muted-foreground">
              Líq: {formatCurrency(paymentBreakdown.credit_card.netValue)} • Com: {formatCurrency(paymentBreakdown.credit_card.commission)}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-medium text-muted-foreground">Cortesia</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(paymentBreakdown.courtesy.total)}</p>
            <p className="text-xs text-muted-foreground">
              {paymentBreakdown.courtesy.count} atend. • Comissão: {formatCurrency(paymentBreakdown.courtesy.commission)}
            </p>
          </div>
        </div>
      </div>

      {/* Commission Table */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Detalhamento de Comissões</h3>
        <CommissionTable 
          appointments={appointments} 
          isLoading={isLoading}
          debitFeePercent={debitFeePercent}
          creditFeePercent={creditFeePercent}
          calculationBase={calculationBase}
        />
      </div>
    </div>
  );
}
