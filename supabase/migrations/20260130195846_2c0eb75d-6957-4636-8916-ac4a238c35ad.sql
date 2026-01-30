-- Update the sync_client_on_appointment_complete function to:
-- 1. Pause counting when client already has available_courtesies > 0
-- 2. Handle fidelity_courtesy payment method to reset loyalty_cuts
CREATE OR REPLACE FUNCTION public.sync_client_on_appointment_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  client_record RECORD;
  fidelity_enabled boolean;
  cuts_threshold integer;
  min_value numeric;
  owner_id uuid;
  should_count_loyalty boolean;
  is_new_status_completed boolean;
  current_loyalty_cuts integer;
  current_available_courtesies integer;
BEGIN
  -- Determine if this is a new completion
  IF TG_OP = 'INSERT' THEN
    is_new_status_completed := (NEW.status = 'completed');
  ELSE
    is_new_status_completed := (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed');
  END IF;

  IF is_new_status_completed AND NEW.client_phone IS NOT NULL AND NEW.client_phone != '' THEN
    
    -- Check if client already exists
    SELECT * INTO client_record 
    FROM public.clients 
    WHERE unit_id = NEW.unit_id AND phone = NEW.client_phone;
    
    IF client_record IS NULL THEN
      -- Create new client (only if NOT dependent)
      IF NEW.is_dependent IS NOT TRUE THEN
        INSERT INTO public.clients (company_id, unit_id, name, phone, birth_date, last_visit_at, total_visits, loyalty_cuts)
        VALUES (NEW.company_id, NEW.unit_id, NEW.client_name, NEW.client_phone, NEW.client_birth_date, NOW(), 1, 0)
        RETURNING * INTO client_record;
      END IF;
    ELSE
      -- Client exists: update visit stats
      UPDATE public.clients
      SET last_visit_at = NOW(), total_visits = COALESCE(total_visits, 0) + 1, updated_at = NOW()
      WHERE id = client_record.id;
    END IF;
    
    -- Handle fidelity program (for both new and existing clients)
    IF client_record IS NOT NULL THEN
      -- Get owner and settings
      SELECT owner_user_id INTO owner_id FROM public.companies WHERE id = NEW.company_id;
      
      SELECT COALESCE(bs.fidelity_program_enabled, false), 
             COALESCE(bs.fidelity_cuts_threshold, 10),
             COALESCE(bs.fidelity_min_value, 30.00)
      INTO fidelity_enabled, cuts_threshold, min_value
      FROM public.business_settings bs WHERE bs.user_id = owner_id;
      
      -- Get CURRENT values from database (fresh read)
      SELECT loyalty_cuts, available_courtesies 
      INTO current_loyalty_cuts, current_available_courtesies 
      FROM public.clients WHERE id = client_record.id;
      
      current_loyalty_cuts := COALESCE(current_loyalty_cuts, 0);
      current_available_courtesies := COALESCE(current_available_courtesies, 0);
      
      -- Handle fidelity_courtesy payment: reset loyalty_cuts (courtesy is being used NOW)
      IF NEW.payment_method = 'fidelity_courtesy' THEN
        UPDATE public.clients
        SET loyalty_cuts = 0, updated_at = NOW()
        WHERE id = client_record.id;
        -- Don't process further counting for this completion
        RETURN NEW;
      END IF;
      
      -- Check if should count for loyalty:
      -- 1. Fidelity must be enabled
      -- 2. Threshold must be > 0
      -- 3. Price must be >= minimum value
      -- 4. Payment must NOT be courtesy
      -- 5. Client must NOT already have a pending courtesy (PAUSA ATÉ USAR)
      should_count_loyalty := (
        fidelity_enabled = true 
        AND cuts_threshold > 0
        AND NEW.total_price >= min_value
        AND (NEW.payment_method IS NULL OR NEW.payment_method NOT IN ('courtesy', 'fidelity_courtesy'))
        AND current_available_courtesies = 0  -- PAUSA se já tem cortesia pendente
      );
      
      IF should_count_loyalty THEN
        -- Check if will complete cycle
        IF (current_loyalty_cuts + 1) >= cuts_threshold THEN
          -- Credit courtesy (max 1, non-accumulative) and reset counter
          UPDATE public.clients
          SET loyalty_cuts = 0, 
              available_courtesies = 1,  -- Always set to 1, not increment (non-accumulative)
              total_courtesies_earned = COALESCE(total_courtesies_earned, 0) + 1,
              updated_at = NOW()
          WHERE id = client_record.id;
        ELSE
          -- Increment loyalty cuts
          UPDATE public.clients
          SET loyalty_cuts = current_loyalty_cuts + 1, updated_at = NOW()
          WHERE id = client_record.id;
        END IF;
      END IF;
    END IF;
      
  END IF;
  
  RETURN NEW;
END;
$function$;