import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export interface FinancialAppointment {
  id: string;
  client_name: string;
  client_phone: string | null;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  payment_method: string | null;
  barber: {
    id: string;
    name: string;
    commission_rate: number | null;
    debit_card_fee_percent: number | null;
    credit_card_fee_percent: number | null;
  } | null;
  service: {
    id: string;
    name: string;
    price: number;
  } | null;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export function useFinancialData(dateRange?: DateRange, barberId?: string | null) {
  const { currentUnitId } = useCurrentUnit();

  const { data: appointments = [], isLoading, error, refetch } = useQuery({
    queryKey: ["financial-appointments", currentUnitId, dateRange?.start?.toISOString(), dateRange?.end?.toISOString(), barberId],
    queryFn: async () => {
      if (!currentUnitId) return [];

      let query = supabase
        .from("appointments")
        .select(`
          id,
          client_name,
          client_phone,
          start_time,
          end_time,
          total_price,
          status,
          payment_method,
          barber:barbers(id, name, commission_rate, debit_card_fee_percent, credit_card_fee_percent),
          service:services(id, name, price)
        `)
        .eq("unit_id", currentUnitId)
        .eq("status", "completed")
        .order("start_time", { ascending: false });

      if (dateRange) {
        query = query
          .gte("start_time", dateRange.start.toISOString())
          .lte("start_time", dateRange.end.toISOString());
      }

      if (barberId) {
        query = query.eq("barber_id", barberId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        barber: Array.isArray(item.barber) ? item.barber[0] : item.barber,
        service: Array.isArray(item.service) ? item.service[0] : item.service,
      })) as FinancialAppointment[];
    },
    enabled: !!currentUnitId,
  });

  return {
    appointments,
    isLoading,
    error,
    refetch,
  };
}

export function getDateRanges() {
  const now = new Date();
  return {
    today: { start: startOfDay(now), end: endOfDay(now) },
    week: { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) },
    month: { start: startOfMonth(now), end: endOfMonth(now) },
  };
}

export function getMonthRange(year: number, month: number): DateRange {
  const date = new Date(year, month);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function calculateCommission(totalPrice: number, commissionRate: number | null): number {
  const rate = commissionRate ?? 50;
  return totalPrice * (rate / 100);
}

export function calculateProfit(totalPrice: number, commissionRate: number | null): number {
  return totalPrice - calculateCommission(totalPrice, commissionRate);
}

// Calculate card fee based on payment method
// Uses barber-specific fees if available, otherwise global fees
export function calculateCardFee(
  totalPrice: number,
  paymentMethod: string | null,
  debitFeePercent: number,
  creditFeePercent: number,
  barberDebitFee?: number | null,
  barberCreditFee?: number | null
): number {
  if (paymentMethod === "debit_card") {
    const fee = barberDebitFee ?? debitFeePercent;
    return totalPrice * (fee / 100);
  }
  if (paymentMethod === "credit_card") {
    const fee = barberCreditFee ?? creditFeePercent;
    return totalPrice * (fee / 100);
  }
  return 0; // Cash and PIX have no fee
}

// Calculate net value (after card fee)
export function calculateNetValue(
  totalPrice: number,
  paymentMethod: string | null,
  debitFeePercent: number,
  creditFeePercent: number,
  barberDebitFee?: number | null,
  barberCreditFee?: number | null
): number {
  return totalPrice - calculateCardFee(totalPrice, paymentMethod, debitFeePercent, creditFeePercent, barberDebitFee, barberCreditFee);
}

// Calculate commission based on configuration (gross or net)
export function calculateCommissionWithFees(
  totalPrice: number,
  paymentMethod: string | null,
  commissionRate: number | null,
  debitFeePercent: number,
  creditFeePercent: number,
  calculationBase: 'gross' | 'net',
  barberDebitFee?: number | null,
  barberCreditFee?: number | null
): number {
  const rate = commissionRate ?? 50;
  
  if (calculationBase === 'net') {
    const netValue = calculateNetValue(totalPrice, paymentMethod, debitFeePercent, creditFeePercent, barberDebitFee, barberCreditFee);
    return netValue * (rate / 100);
  }
  
  // Gross base - commission on total value
  return totalPrice * (rate / 100);
}

// Calculate profit considering card fees and commission base
export function calculateProfitWithFees(
  totalPrice: number,
  paymentMethod: string | null,
  commissionRate: number | null,
  debitFeePercent: number,
  creditFeePercent: number,
  calculationBase: 'gross' | 'net',
  barberDebitFee?: number | null,
  barberCreditFee?: number | null
): number {
  const cardFee = calculateCardFee(totalPrice, paymentMethod, debitFeePercent, creditFeePercent, barberDebitFee, barberCreditFee);
  const commission = calculateCommissionWithFees(
    totalPrice,
    paymentMethod,
    commissionRate,
    debitFeePercent,
    creditFeePercent,
    calculationBase,
    barberDebitFee,
    barberCreditFee
  );
  return totalPrice - cardFee - commission;
}
