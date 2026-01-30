-- Remove o trigger duplicado que causa execução dupla da função de sincronização
DROP TRIGGER IF EXISTS trigger_sync_client_on_complete ON public.appointments;