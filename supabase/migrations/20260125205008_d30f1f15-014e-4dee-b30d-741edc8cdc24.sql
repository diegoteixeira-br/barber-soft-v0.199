-- Fix the sync_client_on_appointment_complete trigger to NOT overwrite titular client data
CREATE OR REPLACE FUNCTION public.sync_client_on_appointment_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  client_record RECORD;
BEGIN
  -- Only execute when status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Only sync if phone is provided
    IF NEW.client_phone IS NOT NULL AND NEW.client_phone != '' THEN
      
      -- Check if client already exists
      SELECT * INTO client_record 
      FROM public.clients 
      WHERE unit_id = NEW.unit_id AND phone = NEW.client_phone;
      
      IF client_record IS NULL THEN
        -- Client doesn't exist: only create if NOT a dependent appointment
        IF NEW.is_dependent IS NOT TRUE THEN
          -- Create new client with appointment data
          INSERT INTO public.clients (company_id, unit_id, name, phone, birth_date, last_visit_at, total_visits)
          VALUES (
            NEW.company_id,
            NEW.unit_id,
            NEW.client_name,
            NEW.client_phone,
            NEW.client_birth_date,
            NOW(),
            1
          );
        END IF;
        -- If is_dependent = true and client doesn't exist, skip (titular should exist first)
      ELSE
        -- Client exists: ONLY update visit stats, NEVER overwrite name or birth_date
        UPDATE public.clients
        SET 
          last_visit_at = NOW(),
          total_visits = COALESCE(total_visits, 0) + 1,
          updated_at = NOW()
        WHERE id = client_record.id;
      END IF;
      
    END IF;
      
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Correct the client record that was incorrectly overwritten (Diego -> Caio)
UPDATE public.clients 
SET name = 'Diego Teixeira'
WHERE id = 'e6625bbd-9c4d-4d26-8d27-0af49fab5fee'
  AND name = 'Caio Teixeira';