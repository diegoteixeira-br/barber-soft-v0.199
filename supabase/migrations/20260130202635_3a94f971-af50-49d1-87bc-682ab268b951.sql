-- Add length constraints to page_visits table to prevent data pollution
-- This prevents attackers from flooding the database with excessively large tracking data

-- Add constraints to limit text field sizes
ALTER TABLE public.page_visits 
  ALTER COLUMN page_path TYPE VARCHAR(500),
  ALTER COLUMN referrer TYPE VARCHAR(2000),
  ALTER COLUMN user_agent TYPE VARCHAR(1000),
  ALTER COLUMN session_id TYPE VARCHAR(100);

-- Add a check constraint to ensure page_path is not empty
ALTER TABLE public.page_visits 
  ADD CONSTRAINT page_visits_page_path_not_empty CHECK (page_path IS NOT NULL AND length(page_path) > 0);

-- Update the RLS policy to be more restrictive - only allow inserts with valid data
DROP POLICY IF EXISTS "Anyone can insert page visits" ON public.page_visits;

CREATE POLICY "Insert page visits with validation" 
ON public.page_visits 
FOR INSERT 
WITH CHECK (
  page_path IS NOT NULL 
  AND length(page_path) > 0 
  AND length(page_path) <= 500
  AND (referrer IS NULL OR length(referrer) <= 2000)
  AND (user_agent IS NULL OR length(user_agent) <= 1000)
  AND (session_id IS NULL OR length(session_id) <= 100)
);