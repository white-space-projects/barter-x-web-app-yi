-- Migration: Alter brands logo_image_key column to TEXT
-- This allows storing base64 WebP image data directly in the column
-- ================================================================

-- Change logo_image_key from VARCHAR(512) to TEXT to accommodate base64 image data
ALTER TABLE application.brands 
ALTER COLUMN logo_image_key TYPE TEXT;

-- Add a comment explaining the column usage
COMMENT ON COLUMN application.brands.logo_image_key IS 'Stores either a MinIO path or base64-encoded WebP image data for brand logos';
