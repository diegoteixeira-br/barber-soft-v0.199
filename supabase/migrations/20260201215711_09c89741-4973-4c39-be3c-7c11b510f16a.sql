-- Fix search_path security issue
CREATE OR REPLACE FUNCTION recalculate_all_client_fidelity()
RETURNS TABLE (
  processed_clients INT,
  updated_clients INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
  v_unit RECORD;
  v_appointments RECORD;
  v_loyalty_cuts INT;
  v_total_visits INT;
  v_earned_courtesies INT;
  v_current_cuts INT;
  v_processed INT := 0;
  v_updated INT := 0;
BEGIN
  -- Loop through all clients
  FOR v_client IN 
    SELECT id, unit_id, phone, name, available_courtesies
    FROM public.clients
  LOOP
    v_processed := v_processed + 1;
    
    -- Get unit fidelity settings
    SELECT 
      fidelity_program_enabled,
      fidelity_min_value,
      fidelity_cuts_threshold
    INTO v_unit
    FROM public.units
    WHERE id = v_client.unit_id;
    
    -- Skip if fidelity not enabled for this unit
    IF NOT COALESCE(v_unit.fidelity_program_enabled, false) THEN
      CONTINUE;
    END IF;
    
    v_loyalty_cuts := 0;
    v_total_visits := 0;
    
    -- Count completed appointments
    FOR v_appointments IN
      SELECT total_price, payment_method
      FROM public.appointments
      WHERE unit_id = v_client.unit_id
        AND status = 'completed'
        AND (
          client_phone = v_client.phone 
          OR LOWER(TRIM(client_name)) = LOWER(TRIM(v_client.name))
        )
    LOOP
      v_total_visits := v_total_visits + 1;
      
      -- Count towards fidelity if meets min value and not a courtesy redemption
      IF v_appointments.total_price >= COALESCE(v_unit.fidelity_min_value, 0)
         AND v_appointments.payment_method IS DISTINCT FROM 'Cortesia de Fidelidade' THEN
        v_loyalty_cuts := v_loyalty_cuts + 1;
      END IF;
    END LOOP;
    
    -- Calculate earned courtesies and current cuts
    v_earned_courtesies := FLOOR(v_loyalty_cuts::NUMERIC / COALESCE(v_unit.fidelity_cuts_threshold, 10));
    v_current_cuts := v_loyalty_cuts % COALESCE(v_unit.fidelity_cuts_threshold, 10);
    
    -- Get last visit date
    SELECT MAX(start_time)
    INTO v_appointments
    FROM public.appointments
    WHERE unit_id = v_client.unit_id
      AND status = 'completed'
      AND (
        client_phone = v_client.phone 
        OR LOWER(TRIM(client_name)) = LOWER(TRIM(v_client.name))
      );
    
    -- Update client record
    UPDATE public.clients
    SET 
      loyalty_cuts = v_current_cuts,
      total_visits = v_total_visits,
      total_courtesies_earned = v_earned_courtesies,
      last_visit_at = v_appointments.max,
      updated_at = NOW()
    WHERE id = v_client.id;
    
    v_updated := v_updated + 1;
  END LOOP;
  
  processed_clients := v_processed;
  updated_clients := v_updated;
  RETURN NEXT;
END;
$$;