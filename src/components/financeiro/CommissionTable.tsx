import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FinancialAppointment, 
  calculateCardFee, 
  calculateNetValue, 
  calculateCommissionWithFees, 
  calculateProfitWithFees 
} from "@/hooks/useFinancialData";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentBadge } from "./PaymentMethodModal";

interface CommissionTableProps {
  appointments: FinancialAppointment[];
  isLoading: boolean;
  debitFeePercent?: number;
  creditFeePercent?: number;
  calculationBase?: 'gross' | 'net';
}

export function CommissionTable({ 
  appointments, 
  isLoading,
  debitFeePercent = 1.5,
  creditFeePercent = 3.0,
  calculationBase = 'gross'
}: CommissionTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totals = appointments.reduce(
    (acc, apt) => {
      const barberDebitFee = apt.barber?.debit_card_fee_percent;
      const barberCreditFee = apt.barber?.credit_card_fee_percent;
      
      const cardFee = calculateCardFee(
        apt.total_price, 
        apt.payment_method, 
        debitFeePercent, 
        creditFeePercent,
        barberDebitFee,
        barberCreditFee
      );
      const netValue = calculateNetValue(
        apt.total_price, 
        apt.payment_method, 
        debitFeePercent, 
        creditFeePercent,
        barberDebitFee,
        barberCreditFee
      );
      const commission = calculateCommissionWithFees(
        apt.total_price, 
        apt.payment_method, 
        apt.barber?.commission_rate ?? null,
        debitFeePercent,
        creditFeePercent,
        calculationBase,
        barberDebitFee,
        barberCreditFee
      );
      const profit = calculateProfitWithFees(
        apt.total_price,
        apt.payment_method,
        apt.barber?.commission_rate ?? null,
        debitFeePercent,
        creditFeePercent,
        calculationBase,
        barberDebitFee,
        barberCreditFee
      );
      
      return {
        total: acc.total + apt.total_price,
        cardFee: acc.cardFee + cardFee,
        netValue: acc.netValue + netValue,
        commission: acc.commission + commission,
        profit: acc.profit + profit,
      };
    },
    { total: 0, cardFee: 0, netValue: 0, commission: 0, profit: 0 }
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>Nenhum atendimento encontrado para o período e barbeiro selecionados.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Data</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Valor Bruto</TableHead>
              <TableHead className="text-right">Taxa Cartão</TableHead>
              <TableHead className="text-right">Valor Líquido</TableHead>
              <TableHead className="text-center">Comissão (%)</TableHead>
              <TableHead className="text-right">Valor Comissão</TableHead>
              <TableHead className="text-right">Lucro Barbearia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => {
              const commissionRate = appointment.barber?.commission_rate ?? 50;
              const barberDebitFee = appointment.barber?.debit_card_fee_percent;
              const barberCreditFee = appointment.barber?.credit_card_fee_percent;
              
              const cardFee = calculateCardFee(
                appointment.total_price, 
                appointment.payment_method, 
                debitFeePercent, 
                creditFeePercent,
                barberDebitFee,
                barberCreditFee
              );
              const netValue = calculateNetValue(
                appointment.total_price, 
                appointment.payment_method, 
                debitFeePercent, 
                creditFeePercent,
                barberDebitFee,
                barberCreditFee
              );
              const commissionValue = calculateCommissionWithFees(
                appointment.total_price,
                appointment.payment_method,
                commissionRate,
                debitFeePercent,
                creditFeePercent,
                calculationBase,
                barberDebitFee,
                barberCreditFee
              );
              const profitValue = calculateProfitWithFees(
                appointment.total_price,
                appointment.payment_method,
                commissionRate,
                debitFeePercent,
                creditFeePercent,
                calculationBase,
                barberDebitFee,
                barberCreditFee
              );

              return (
                <TableRow key={appointment.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {format(new Date(appointment.start_time), "dd/MM", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{appointment.service?.name || "-"}</TableCell>
                  <TableCell>
                    <PaymentBadge method={appointment.payment_method} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(appointment.total_price)}
                  </TableCell>
                  <TableCell className="text-right text-red-500">
                    {cardFee > 0 ? `-${formatCurrency(cardFee)}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(netValue)}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {commissionRate}%
                  </TableCell>
                  <TableCell className="text-right text-primary font-medium">
                    {formatCurrency(commissionValue)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-500 font-medium">
                    {formatCurrency(profitValue)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter className="bg-muted/80">
            <TableRow>
              <TableCell colSpan={3} className="font-bold">TOTAL</TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(totals.total)}
              </TableCell>
              <TableCell className="text-right font-bold text-red-500">
                {totals.cardFee > 0 ? `-${formatCurrency(totals.cardFee)}` : "-"}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(totals.netValue)}
              </TableCell>
              <TableCell />
              <TableCell className="text-right font-bold text-primary">
                {formatCurrency(totals.commission)}
              </TableCell>
              <TableCell className="text-right font-bold text-emerald-500">
                {formatCurrency(totals.profit)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
