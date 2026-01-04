-- Add WhatsApp profile columns to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS whatsapp_name TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS whatsapp_picture_url TEXT;