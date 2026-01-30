-- Adicionar colunas para token de recuperação de senha de exclusão
ALTER TABLE public.business_settings 
  ADD COLUMN IF NOT EXISTS deletion_password_reset_token TEXT,
  ADD COLUMN IF NOT EXISTS deletion_password_reset_expires TIMESTAMPTZ;