-- Adicionar coluna timezone na tabela units para suporte a fusos horários brasileiros
ALTER TABLE public.units 
ADD COLUMN timezone TEXT DEFAULT 'America/Sao_Paulo';