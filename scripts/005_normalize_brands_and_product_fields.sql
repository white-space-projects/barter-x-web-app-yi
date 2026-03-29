-- =====================================================
-- Migration: Normalize Brands and Add Product Field Definitions
-- Schema: application
-- 
-- Changes:
-- 1. Create application.brands table
-- 2. Create application.subcategory_product_fields table
-- 3. Create application.subcategory_product_field_options table
-- 4. Update application.products to use brand_id and product_info
-- 5. Migrate existing brand data
-- =====================================================

-- =====================================================
-- A) CREATE TABLE: application.brands
-- =====================================================

CREATE TABLE IF NOT EXISTS application.brands (
  brand_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Brand info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  logo_image_key VARCHAR(512) NULL,  -- MinIO reference for brand logo
  description TEXT NULL,
  
  -- Status and ordering
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT brands_slug_unique UNIQUE (slug),
  CONSTRAINT brands_name_unique UNIQUE (name)
);

-- Indexes for brands
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON application.brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_sort_order ON application.brands(sort_order);
CREATE INDEX IF NOT EXISTS idx_brands_name_lower ON application.brands(LOWER(name));

-- Comment
COMMENT ON TABLE application.brands IS 'Normalized brand catalog for product references';
COMMENT ON COLUMN application.brands.logo_image_key IS 'MinIO object key/path for brand logo image';

-- =====================================================
-- B) CREATE TABLE: application.subcategory_product_fields
-- =====================================================

CREATE TABLE IF NOT EXISTS application.subcategory_product_fields (
  field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to subcategory
  subcategory_id UUID NOT NULL REFERENCES application.subcategories(subcategory_id) ON DELETE CASCADE,
  
  -- Field definition
  field_key VARCHAR(100) NOT NULL,        -- e.g., "released_year", "processor"
  field_label VARCHAR(255) NOT NULL,      -- e.g., "Released Year", "Processor"
  field_type VARCHAR(50) NOT NULL,        -- text, number, decimal, boolean, select, multiselect
  placeholder VARCHAR(255) NULL,          -- Input placeholder text
  help_text TEXT NULL,                    -- Help/description text
  
  -- Field behavior
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_filterable BOOLEAN NOT NULL DEFAULT false,  -- Can be used for filtering/search
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT subcategory_product_fields_unique UNIQUE (subcategory_id, field_key)
);

-- Indexes for subcategory_product_fields
CREATE INDEX IF NOT EXISTS idx_subcategory_product_fields_subcategory 
  ON application.subcategory_product_fields(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategory_product_fields_is_active 
  ON application.subcategory_product_fields(is_active);
CREATE INDEX IF NOT EXISTS idx_subcategory_product_fields_is_filterable 
  ON application.subcategory_product_fields(is_filterable);
CREATE INDEX IF NOT EXISTS idx_subcategory_product_fields_sort 
  ON application.subcategory_product_fields(subcategory_id, sort_order);

-- Comments
COMMENT ON TABLE application.subcategory_product_fields IS 'Defines product info fields for each subcategory';
COMMENT ON COLUMN application.subcategory_product_fields.field_key IS 'Snake_case key used in product_info JSONB';
COMMENT ON COLUMN application.subcategory_product_fields.field_type IS 'Field type: text, number, decimal, boolean, select, multiselect';

-- =====================================================
-- C) CREATE TABLE: application.subcategory_product_field_options
-- =====================================================
-- This table is useful to include now to:
-- 1. Provide consistent options for select/multiselect fields
-- 2. Enable future filtering by predefined values
-- 3. Avoid storing duplicate option lists in each product

CREATE TABLE IF NOT EXISTS application.subcategory_product_field_options (
  option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to field
  field_id UUID NOT NULL REFERENCES application.subcategory_product_fields(field_id) ON DELETE CASCADE,
  
  -- Option definition
  option_value VARCHAR(255) NOT NULL,     -- Stored value
  option_label VARCHAR(255) NOT NULL,     -- Display label
  
  -- Status and ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT subcategory_product_field_options_unique UNIQUE (field_id, option_value)
);

-- Indexes for field options
CREATE INDEX IF NOT EXISTS idx_field_options_field_id 
  ON application.subcategory_product_field_options(field_id);
CREATE INDEX IF NOT EXISTS idx_field_options_is_active 
  ON application.subcategory_product_field_options(is_active);

-- Comment
COMMENT ON TABLE application.subcategory_product_field_options IS 'Predefined options for select/multiselect product fields';

-- =====================================================
-- D) UPDATE TABLE: application.products
-- =====================================================

-- Step 1: Add new columns
ALTER TABLE application.products 
  ADD COLUMN IF NOT EXISTS brand_id UUID NULL,
  ADD COLUMN IF NOT EXISTS product_info JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Step 2: Migrate existing brand text values to brands table
-- Insert distinct brands from products (if brand column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'application' 
    AND table_name = 'products' 
    AND column_name = 'brand'
    AND data_type IN ('character varying', 'text')
  ) THEN
    -- Insert distinct brands that don't already exist
    INSERT INTO application.brands (name, slug)
    SELECT DISTINCT 
      brand,
      LOWER(REGEXP_REPLACE(brand, '[^a-zA-Z0-9]+', '-', 'g'))
    FROM application.products
    WHERE brand IS NOT NULL 
      AND brand != ''
      AND NOT EXISTS (
        SELECT 1 FROM application.brands b WHERE LOWER(b.name) = LOWER(application.products.brand)
      );
    
    -- Update products with brand_id
    UPDATE application.products p
    SET brand_id = b.brand_id
    FROM application.brands b
    WHERE LOWER(p.brand) = LOWER(b.name);
    
    RAISE NOTICE 'Brand migration completed. Existing brand values migrated to application.brands.';
  ELSE
    RAISE NOTICE 'No text brand column found or already migrated.';
  END IF;
END $$;

-- Step 3: Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_brand_id_fkey' 
    AND table_schema = 'application'
  ) THEN
    ALTER TABLE application.products 
      ADD CONSTRAINT products_brand_id_fkey 
      FOREIGN KEY (brand_id) REFERENCES application.brands(brand_id);
  END IF;
END $$;

-- Step 4: Create new unique index for product definition
-- Drop old unique index if it exists
DROP INDEX IF EXISTS application.idx_products_unique_combo;

-- Create new unique index: category + subcategory + brand_id + model
CREATE UNIQUE INDEX idx_products_unique_combo_v2 
  ON application.products(
    category_id, 
    subcategory_id, 
    brand_id,
    COALESCE(LOWER(model), '')
  );

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON application.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_product_info ON application.products USING GIN(product_info);

-- Comments
COMMENT ON COLUMN application.products.brand_id IS 'Foreign key to application.brands';
COMMENT ON COLUMN application.products.product_info IS 'JSONB storing actual product field values defined by subcategory';

-- Note: The old text 'brand' column is kept for now as deprecated
-- It can be removed in a future migration after confirming all data is migrated
-- To remove: ALTER TABLE application.products DROP COLUMN IF EXISTS brand;

-- =====================================================
-- E) RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE application.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.subcategory_product_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.subcategory_product_field_options ENABLE ROW LEVEL SECURITY;

-- Brands: Public read access
CREATE POLICY brands_read_all ON application.brands
  FOR SELECT
  USING (is_active = true);

-- Subcategory Product Fields: Public read access
CREATE POLICY subcategory_product_fields_read_all ON application.subcategory_product_fields
  FOR SELECT
  USING (is_active = true);

-- Subcategory Product Field Options: Public read access
CREATE POLICY subcategory_product_field_options_read_all ON application.subcategory_product_field_options
  FOR SELECT
  USING (is_active = true);

-- Note: INSERT/UPDATE/DELETE policies are intentionally not created
-- These tables are admin/catalog-managed and should only be modified via service role

-- =====================================================
-- F) TRIGGERS FOR updated_at
-- =====================================================

-- Trigger for brands
DROP TRIGGER IF EXISTS trigger_brands_updated_at ON application.brands;
CREATE TRIGGER trigger_brands_updated_at
  BEFORE UPDATE ON application.brands
  FOR EACH ROW
  EXECUTE FUNCTION application.update_updated_at_column();

-- Trigger for subcategory_product_fields
DROP TRIGGER IF EXISTS trigger_subcategory_product_fields_updated_at ON application.subcategory_product_fields;
CREATE TRIGGER trigger_subcategory_product_fields_updated_at
  BEFORE UPDATE ON application.subcategory_product_fields
  FOR EACH ROW
  EXECUTE FUNCTION application.update_updated_at_column();

-- Trigger for subcategory_product_field_options
DROP TRIGGER IF EXISTS trigger_subcategory_product_field_options_updated_at ON application.subcategory_product_field_options;
CREATE TRIGGER trigger_subcategory_product_field_options_updated_at
  BEFORE UPDATE ON application.subcategory_product_field_options
  FOR EACH ROW
  EXECUTE FUNCTION application.update_updated_at_column();

-- =====================================================
-- G) SEED: Example field definitions for Phones subcategory
-- =====================================================
-- This is optional seed data - run separately if subcategory exists

DO $$
DECLARE
  v_phones_subcategory_id UUID;
  v_field_id UUID;
BEGIN
  -- Find the Phones subcategory
  SELECT subcategory_id INTO v_phones_subcategory_id
  FROM application.subcategories
  WHERE LOWER(slug) = 'phones' OR LOWER(name) = 'phones'
  LIMIT 1;
  
  IF v_phones_subcategory_id IS NULL THEN
    RAISE NOTICE 'Phones subcategory not found. Skipping field definitions seed.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Seeding field definitions for Phones subcategory: %', v_phones_subcategory_id;
  
  -- Insert field definitions for Phones
  INSERT INTO application.subcategory_product_fields 
    (subcategory_id, field_key, field_label, field_type, is_required, is_filterable, sort_order)
  VALUES
    (v_phones_subcategory_id, 'released_year', 'Released Year', 'number', true, true, 1),
    (v_phones_subcategory_id, 'processor', 'Processor', 'text', false, true, 2),
    (v_phones_subcategory_id, 'screen_size_inches', 'Screen Size (inches)', 'decimal', false, true, 3),
    (v_phones_subcategory_id, 'rear_cameras', 'Rear Cameras', 'select', false, true, 4),
    (v_phones_subcategory_id, 'camera_layout', 'Camera Layout', 'select', false, true, 5),
    (v_phones_subcategory_id, 'notch_type', 'Notch Type', 'select', false, true, 6),
    (v_phones_subcategory_id, 'edge_type', 'Edge Type', 'select', false, true, 7),
    (v_phones_subcategory_id, 'rear_material', 'Rear Material', 'select', false, true, 8),
    (v_phones_subcategory_id, 'biometric', 'Biometric', 'select', false, true, 9),
    (v_phones_subcategory_id, 'port_type', 'Port Type', 'select', false, true, 10),
    (v_phones_subcategory_id, 'dimensions', 'Dimensions', 'text', false, false, 11),
    (v_phones_subcategory_id, 'weight_grams', 'Weight (grams)', 'number', false, true, 12)
  ON CONFLICT (subcategory_id, field_key) DO NOTHING;
  
  -- Seed options for select fields
  
  -- rear_cameras options
  SELECT field_id INTO v_field_id FROM application.subcategory_product_fields 
  WHERE subcategory_id = v_phones_subcategory_id AND field_key = 'rear_cameras';
  IF v_field_id IS NOT NULL THEN
    INSERT INTO application.subcategory_product_field_options (field_id, option_value, option_label, sort_order)
    VALUES
      (v_field_id, 'single', 'Single', 1),
      (v_field_id, 'dual', 'Dual', 2),
      (v_field_id, 'triple', 'Triple', 3),
      (v_field_id, 'quad', 'Quad', 4)
    ON CONFLICT (field_id, option_value) DO NOTHING;
  END IF;
  
  -- camera_layout options
  SELECT field_id INTO v_field_id FROM application.subcategory_product_fields 
  WHERE subcategory_id = v_phones_subcategory_id AND field_key = 'camera_layout';
  IF v_field_id IS NOT NULL THEN
    INSERT INTO application.subcategory_product_field_options (field_id, option_value, option_label, sort_order)
    VALUES
      (v_field_id, 'vertical', 'Vertical', 1),
      (v_field_id, 'horizontal', 'Horizontal', 2),
      (v_field_id, 'square', 'Square', 3),
      (v_field_id, 'circular', 'Circular', 4),
      (v_field_id, 'island', 'Island', 5)
    ON CONFLICT (field_id, option_value) DO NOTHING;
  END IF;
  
  -- notch_type options
  SELECT field_id INTO v_field_id FROM application.subcategory_product_fields 
  WHERE subcategory_id = v_phones_subcategory_id AND field_key = 'notch_type';
  IF v_field_id IS NOT NULL THEN
    INSERT INTO application.subcategory_product_field_options (field_id, option_value, option_label, sort_order)
    VALUES
      (v_field_id, 'none', 'None', 1),
      (v_field_id, 'notch', 'Notch', 2),
      (v_field_id, 'dynamic_island', 'Dynamic Island', 3),
      (v_field_id, 'teardrop', 'Teardrop', 4),
      (v_field_id, 'punch_hole', 'Punch Hole', 5),
      (v_field_id, 'under_display', 'Under Display', 6)
    ON CONFLICT (field_id, option_value) DO NOTHING;
  END IF;
  
  -- edge_type options
  SELECT field_id INTO v_field_id FROM application.subcategory_product_fields 
  WHERE subcategory_id = v_phones_subcategory_id AND field_key = 'edge_type';
  IF v_field_id IS NOT NULL THEN
    INSERT INTO application.subcategory_product_field_options (field_id, option_value, option_label, sort_order)
    VALUES
      (v_field_id, 'flat', 'Flat', 1),
      (v_field_id, 'curved', 'Curved', 2),
      (v_field_id, 'rounded', 'Rounded', 3)
    ON CONFLICT (field_id, option_value) DO NOTHING;
  END IF;
  
  -- rear_material options
  SELECT field_id INTO v_field_id FROM application.subcategory_product_fields 
  WHERE subcategory_id = v_phones_subcategory_id AND field_key = 'rear_material';
  IF v_field_id IS NOT NULL THEN
    INSERT INTO application.subcategory_product_field_options (field_id, option_value, option_label, sort_order)
    VALUES
      (v_field_id, 'plastic', 'Plastic', 1),
      (v_field_id, 'glass', 'Glass', 2),
      (v_field_id, 'matte_glass', 'Matte Glass', 3),
      (v_field_id, 'ceramic', 'Ceramic', 4),
      (v_field_id, 'metal', 'Metal', 5),
      (v_field_id, 'vegan_leather', 'Vegan Leather', 6)
    ON CONFLICT (field_id, option_value) DO NOTHING;
  END IF;
  
  -- biometric options
  SELECT field_id INTO v_field_id FROM application.subcategory_product_fields 
  WHERE subcategory_id = v_phones_subcategory_id AND field_key = 'biometric';
  IF v_field_id IS NOT NULL THEN
    INSERT INTO application.subcategory_product_field_options (field_id, option_value, option_label, sort_order)
    VALUES
      (v_field_id, 'none', 'None', 1),
      (v_field_id, 'face_id', 'Face ID', 2),
      (v_field_id, 'face_unlock', 'Face Unlock', 3),
      (v_field_id, 'fingerprint_rear', 'Fingerprint (Rear)', 4),
      (v_field_id, 'fingerprint_side', 'Fingerprint (Side)', 5),
      (v_field_id, 'fingerprint_under_display', 'Fingerprint (Under Display)', 6)
    ON CONFLICT (field_id, option_value) DO NOTHING;
  END IF;
  
  -- port_type options
  SELECT field_id INTO v_field_id FROM application.subcategory_product_fields 
  WHERE subcategory_id = v_phones_subcategory_id AND field_key = 'port_type';
  IF v_field_id IS NOT NULL THEN
    INSERT INTO application.subcategory_product_field_options (field_id, option_value, option_label, sort_order)
    VALUES
      (v_field_id, 'usb_c', 'USB-C', 1),
      (v_field_id, 'lightning', 'Lightning', 2),
      (v_field_id, 'micro_usb', 'Micro USB', 3),
      (v_field_id, 'none', 'None (Portless)', 4)
    ON CONFLICT (field_id, option_value) DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Phones field definitions and options seeded successfully.';
END $$;

-- =====================================================
-- H) SEED: Common brands
-- =====================================================

INSERT INTO application.brands (name, slug, sort_order)
VALUES
  -- Electronics / Phones
  ('Apple', 'apple', 1),
  ('Samsung', 'samsung', 2),
  ('Google', 'google', 3),
  ('OnePlus', 'oneplus', 4),
  ('Xiaomi', 'xiaomi', 5),
  ('Sony', 'sony', 6),
  ('LG', 'lg', 7),
  ('Motorola', 'motorola', 8),
  ('Nokia', 'nokia', 9),
  ('Huawei', 'huawei', 10),
  -- Laptops
  ('Dell', 'dell', 11),
  ('HP', 'hp', 12),
  ('Lenovo', 'lenovo', 13),
  ('ASUS', 'asus', 14),
  ('Acer', 'acer', 15),
  ('Microsoft', 'microsoft', 16),
  ('Razer', 'razer', 17),
  -- Audio
  ('Bose', 'bose', 18),
  ('Sennheiser', 'sennheiser', 19),
  ('JBL', 'jbl', 20),
  ('Bang & Olufsen', 'bang-olufsen', 21),
  -- Cameras
  ('Canon', 'canon', 22),
  ('Nikon', 'nikon', 23),
  ('Fujifilm', 'fujifilm', 24),
  -- Gaming
  ('Nintendo', 'nintendo', 25),
  ('PlayStation', 'playstation', 26),
  ('Xbox', 'xbox', 27),
  -- Home / Furniture
  ('IKEA', 'ikea', 28),
  ('Herman Miller', 'herman-miller', 29),
  -- Fashion
  ('Nike', 'nike', 30),
  ('Adidas', 'adidas', 31),
  ('Levi''s', 'levis', 32),
  -- Appliances
  ('Dyson', 'dyson', 33),
  ('Bosch', 'bosch', 34),
  ('Whirlpool', 'whirlpool', 35),
  -- Tools
  ('DeWalt', 'dewalt', 36),
  ('Makita', 'makita', 37),
  ('Milwaukee', 'milwaukee', 38),
  -- Generic
  ('Other', 'other', 999)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SUMMARY
-- =====================================================
-- 
-- Tables created:
-- 1. application.brands - Normalized brand catalog with logo support
-- 2. application.subcategory_product_fields - Field definitions per subcategory
-- 3. application.subcategory_product_field_options - Options for select/multiselect fields
--
-- Tables updated:
-- 1. application.products - Added brand_id (FK), product_info (JSONB)
--    - Old text 'brand' column kept as deprecated for migration safety
--    - New unique index on (category_id, subcategory_id, brand_id, model)
--
-- Indexes added:
-- - idx_brands_is_active, idx_brands_sort_order, idx_brands_name_lower
-- - idx_subcategory_product_fields_subcategory, _is_active, _is_filterable, _sort
-- - idx_field_options_field_id, _is_active
-- - idx_products_brand_id, idx_products_product_info (GIN)
--
-- RLS:
-- - All new tables have RLS enabled with public SELECT for active records
-- - No public INSERT/UPDATE/DELETE (admin/service role only)
--
-- Usage:
-- - Define fields in subcategory_product_fields for each subcategory
-- - Store actual values in products.product_info as JSONB
-- - Example: {"released_year": 2022, "processor": "A15 Bionic", ...}
-- =====================================================
