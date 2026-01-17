-- Add custom card fee fields to barbers table
ALTER TABLE public.barbers
ADD COLUMN debit_card_fee_percent numeric(5,2) DEFAULT NULL,
ADD COLUMN credit_card_fee_percent numeric(5,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.barbers.debit_card_fee_percent IS 'Custom debit card fee percentage for this barber. If NULL, uses global business_settings value.';
COMMENT ON COLUMN public.barbers.credit_card_fee_percent IS 'Custom credit card fee percentage for this barber. If NULL, uses global business_settings value.';