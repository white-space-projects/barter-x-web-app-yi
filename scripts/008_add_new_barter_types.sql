-- ============================================================================
-- BARTER-X: ADD NEW BARTER TYPES (Rentals, Mini Jobs, Ownership)
-- ============================================================================
-- This migration:
-- 1. Adds is_offer_creation_enabled and availability_note columns to barter_types
-- 2. Deactivates old barter types (Automobile, Homes & Spaces)
-- 3. Adds new barter types (Rentals, Mini Jobs, Ownership)
-- 4. Adds categories and subcategories for the new types
-- 5. Adds sample products for the new barter types
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new columns to barter_types table
-- ============================================================================

ALTER TABLE application.barter_types 
ADD COLUMN IF NOT EXISTS is_offer_creation_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE application.barter_types 
ADD COLUMN IF NOT EXISTS availability_note TEXT NULL;

COMMENT ON COLUMN application.barter_types.is_offer_creation_enabled IS 'Whether offer creation is enabled for this barter type';
COMMENT ON COLUMN application.barter_types.availability_note IS 'Note shown when offer creation is disabled (e.g., "Launching soon")';

-- ============================================================================
-- STEP 2: Deactivate old barter types (keep data, just mark inactive)
-- ============================================================================

UPDATE application.barter_types 
SET is_active = FALSE 
WHERE slug IN ('automobile', 'home-spaces');

-- ============================================================================
-- STEP 3: Insert new barter types
-- ============================================================================

INSERT INTO application.barter_types (barter_type_id, name, slug, description, icon, color, sort_order, is_offer_creation_enabled, availability_note) VALUES
  (gen_random_uuid(), 'Rentals', 'rentals', 'Find and list rental properties and spaces', 'Building2', 'text-green-500', 2, FALSE, 'Launching soon'),
  (gen_random_uuid(), 'Mini Jobs', 'mini-jobs', 'Short-term and temporary work opportunities', 'Briefcase', 'text-purple-500', 3, FALSE, 'Launching soon'),
  (gen_random_uuid(), 'Ownership', 'ownership', 'Exchange real estate, vehicles, and property ownership', 'Key', 'text-amber-500', 4, FALSE, 'Launching soon')
ON CONFLICT (slug) DO UPDATE SET
  is_active = TRUE,
  is_offer_creation_enabled = EXCLUDED.is_offer_creation_enabled,
  availability_note = EXCLUDED.availability_note;

-- ============================================================================
-- STEP 4: Add categories and subcategories for RENTALS
-- ============================================================================

DO $$
DECLARE
  v_rentals_barter_type_id UUID;
  v_category_id UUID;
BEGIN
  -- Get the Rentals barter type ID
  SELECT barter_type_id INTO v_rentals_barter_type_id 
  FROM application.barter_types WHERE slug = 'rentals';

  -- Skip if barter type not found
  IF v_rentals_barter_type_id IS NULL THEN
    RAISE NOTICE 'Rentals barter type not found, skipping category creation';
    RETURN;
  END IF;

  -- Apartments
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_rentals_barter_type_id, 'Apartments', 'apartments', 'Building2', 1)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Studio', 'studio', 1),
      (v_category_id, '1 Bedroom', '1-bedroom', 2),
      (v_category_id, '2 Bedroom', '2-bedroom', 3),
      (v_category_id, '3+ Bedroom', '3-plus-bedroom', 4)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Houses
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_rentals_barter_type_id, 'Houses', 'houses', 'Home', 2)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Single Family', 'single-family', 1),
      (v_category_id, 'Townhouse', 'townhouse', 2),
      (v_category_id, 'Duplex', 'duplex', 3),
      (v_category_id, 'Villa', 'villa', 4)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Rooms / Co-living
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_rentals_barter_type_id, 'Rooms / Co-living', 'rooms-co-living', 'BedDouble', 3)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Private Room', 'private-room', 1),
      (v_category_id, 'Shared Room', 'shared-room', 2),
      (v_category_id, 'Co-living Space', 'co-living-space', 3),
      (v_category_id, 'PG/Hostel', 'pg-hostel', 4)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Parking Spaces
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_rentals_barter_type_id, 'Parking Spaces', 'parking-spaces', 'ParkingSquare', 4)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Covered Parking', 'covered-parking', 1),
      (v_category_id, 'Open Parking', 'open-parking', 2),
      (v_category_id, 'Garage', 'garage', 3)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Storage Spaces
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_rentals_barter_type_id, 'Storage Spaces', 'storage-spaces', 'Warehouse', 5)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Small Unit', 'small-unit', 1),
      (v_category_id, 'Medium Unit', 'medium-unit', 2),
      (v_category_id, 'Large Unit', 'large-unit', 3),
      (v_category_id, 'Climate Controlled', 'climate-controlled', 4)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

END $$;

-- ============================================================================
-- STEP 5: Add categories and subcategories for MINI JOBS
-- ============================================================================

DO $$
DECLARE
  v_minijobs_barter_type_id UUID;
  v_category_id UUID;
BEGIN
  -- Get the Mini Jobs barter type ID
  SELECT barter_type_id INTO v_minijobs_barter_type_id 
  FROM application.barter_types WHERE slug = 'mini-jobs';

  -- Skip if barter type not found
  IF v_minijobs_barter_type_id IS NULL THEN
    RAISE NOTICE 'Mini Jobs barter type not found, skipping category creation';
    RETURN;
  END IF;

  -- Retail & Store Help
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_minijobs_barter_type_id, 'Retail & Store Help', 'retail-store-help', 'ShoppingBag', 1)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Cashier', 'cashier', 1),
      (v_category_id, 'Stock Clerk', 'stock-clerk', 2),
      (v_category_id, 'Sales Assistant', 'sales-assistant', 3)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Food & Café Work
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_minijobs_barter_type_id, 'Food & Café Work', 'food-cafe-work', 'Coffee', 2)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Server/Waiter', 'server-waiter', 1),
      (v_category_id, 'Barista', 'barista', 2),
      (v_category_id, 'Kitchen Helper', 'kitchen-helper', 3)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Delivery & Runner Jobs
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_minijobs_barter_type_id, 'Delivery & Runner Jobs', 'delivery-runner-jobs', 'Bike', 3)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Food Delivery', 'food-delivery', 1),
      (v_category_id, 'Package Delivery', 'package-delivery', 2),
      (v_category_id, 'Errands/Runner', 'errands-runner', 3)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Cleaning & Housekeeping
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_minijobs_barter_type_id, 'Cleaning & Housekeeping', 'cleaning-housekeeping', 'Sparkles', 4)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'House Cleaning', 'house-cleaning', 1),
      (v_category_id, 'Office Cleaning', 'office-cleaning', 2),
      (v_category_id, 'Laundry Service', 'laundry-service', 3)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Warehouse & Packing
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_minijobs_barter_type_id, 'Warehouse & Packing', 'warehouse-packing', 'Package', 5)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Packer', 'packer', 1),
      (v_category_id, 'Loader/Unloader', 'loader-unloader', 2),
      (v_category_id, 'Inventory Clerk', 'inventory-clerk', 3)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Admin & Office Support
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_minijobs_barter_type_id, 'Admin & Office Support', 'admin-office-support', 'FileText', 6)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Data Entry', 'data-entry', 1),
      (v_category_id, 'Reception', 'reception', 2),
      (v_category_id, 'Filing/Organizing', 'filing-organizing', 3)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Events & Temporary Help
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_minijobs_barter_type_id, 'Events & Temporary Help', 'events-temporary-help', 'Calendar', 7)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Event Staff', 'event-staff', 1),
      (v_category_id, 'Catering Help', 'catering-help', 2),
      (v_category_id, 'Setup/Breakdown', 'setup-breakdown', 3)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

END $$;

-- ============================================================================
-- STEP 6: Add categories and subcategories for OWNERSHIP
-- ============================================================================

DO $$
DECLARE
  v_ownership_barter_type_id UUID;
  v_category_id UUID;
BEGIN
  -- Get the Ownership barter type ID
  SELECT barter_type_id INTO v_ownership_barter_type_id 
  FROM application.barter_types WHERE slug = 'ownership';

  -- Skip if barter type not found
  IF v_ownership_barter_type_id IS NULL THEN
    RAISE NOTICE 'Ownership barter type not found, skipping category creation';
    RETURN;
  END IF;

  -- Real Estate
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_ownership_barter_type_id, 'Real Estate', 'real-estate', 'Home', 1)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Apartment', 'apartment', 1),
      (v_category_id, 'House', 'house', 2),
      (v_category_id, 'Land/Plot', 'land-plot', 3),
      (v_category_id, 'Vacation Property', 'vacation-property', 4)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Vehicles
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_ownership_barter_type_id, 'Vehicles', 'vehicles', 'Car', 2)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Car', 'car', 1),
      (v_category_id, 'Motorcycle', 'motorcycle', 2),
      (v_category_id, 'Boat', 'boat', 3),
      (v_category_id, 'RV/Camper', 'rv-camper', 4)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

  -- Commercial Property
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_ownership_barter_type_id, 'Commercial Property', 'commercial-property', 'Building', 3)
  ON CONFLICT (barter_type_id, slug) DO NOTHING
  RETURNING category_id INTO v_category_id;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
      (v_category_id, 'Office Space', 'office-space', 1),
      (v_category_id, 'Retail Space', 'retail-space', 2),
      (v_category_id, 'Warehouse', 'warehouse', 3),
      (v_category_id, 'Industrial', 'industrial', 4)
    ON CONFLICT (category_id, slug) DO NOTHING;
  END IF;

END $$;

-- ============================================================================
-- STEP 7: Add sample products for new barter types
-- ============================================================================

-- Sample Rentals Products
DO $$
DECLARE
  v_rentals_barter_type_id UUID;
  v_category_id UUID;
  v_subcategory_id UUID;
BEGIN
  SELECT barter_type_id INTO v_rentals_barter_type_id 
  FROM application.barter_types WHERE slug = 'rentals';

  IF v_rentals_barter_type_id IS NULL THEN RETURN; END IF;

  -- Get Apartments category
  SELECT c.category_id INTO v_category_id 
  FROM application.categories c 
  WHERE c.barter_type_id = v_rentals_barter_type_id AND c.slug = 'apartments';

  IF v_category_id IS NOT NULL THEN
    SELECT subcategory_id INTO v_subcategory_id 
    FROM application.subcategories WHERE category_id = v_category_id AND slug = '2-bedroom';
    
    IF v_subcategory_id IS NOT NULL THEN
      INSERT INTO application.products (product_id, barter_type_id, category_id, subcategory_id, title, description, is_active)
      VALUES (gen_random_uuid(), v_rentals_barter_type_id, v_category_id, v_subcategory_id, 
              '2 Bedroom Apartment - City Center', 'Modern 2BR apartment in prime location', TRUE)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Get Parking Spaces category
  SELECT c.category_id INTO v_category_id 
  FROM application.categories c 
  WHERE c.barter_type_id = v_rentals_barter_type_id AND c.slug = 'parking-spaces';

  IF v_category_id IS NOT NULL THEN
    SELECT subcategory_id INTO v_subcategory_id 
    FROM application.subcategories WHERE category_id = v_category_id AND slug = 'covered-parking';
    
    IF v_subcategory_id IS NOT NULL THEN
      INSERT INTO application.products (product_id, barter_type_id, category_id, subcategory_id, title, description, is_active)
      VALUES (gen_random_uuid(), v_rentals_barter_type_id, v_category_id, v_subcategory_id, 
              'Covered Parking Space - Downtown', 'Secure covered parking near business district', TRUE)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

END $$;

-- Sample Mini Jobs Products
DO $$
DECLARE
  v_minijobs_barter_type_id UUID;
  v_category_id UUID;
  v_subcategory_id UUID;
BEGIN
  SELECT barter_type_id INTO v_minijobs_barter_type_id 
  FROM application.barter_types WHERE slug = 'mini-jobs';

  IF v_minijobs_barter_type_id IS NULL THEN RETURN; END IF;

  -- Get Food & Café Work category
  SELECT c.category_id INTO v_category_id 
  FROM application.categories c 
  WHERE c.barter_type_id = v_minijobs_barter_type_id AND c.slug = 'food-cafe-work';

  IF v_category_id IS NOT NULL THEN
    SELECT subcategory_id INTO v_subcategory_id 
    FROM application.subcategories WHERE category_id = v_category_id AND slug = 'barista';
    
    IF v_subcategory_id IS NOT NULL THEN
      INSERT INTO application.products (product_id, barter_type_id, category_id, subcategory_id, title, description, is_active)
      VALUES (gen_random_uuid(), v_minijobs_barter_type_id, v_category_id, v_subcategory_id, 
              'Weekend Barista Position', 'Part-time barista needed for busy coffee shop', TRUE)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Get Delivery & Runner Jobs category
  SELECT c.category_id INTO v_category_id 
  FROM application.categories c 
  WHERE c.barter_type_id = v_minijobs_barter_type_id AND c.slug = 'delivery-runner-jobs';

  IF v_category_id IS NOT NULL THEN
    SELECT subcategory_id INTO v_subcategory_id 
    FROM application.subcategories WHERE category_id = v_category_id AND slug = 'food-delivery';
    
    IF v_subcategory_id IS NOT NULL THEN
      INSERT INTO application.products (product_id, barter_type_id, category_id, subcategory_id, title, description, is_active)
      VALUES (gen_random_uuid(), v_minijobs_barter_type_id, v_category_id, v_subcategory_id, 
              'Food Delivery Driver', 'Flexible hours, own vehicle preferred', TRUE)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

END $$;

-- Sample Ownership Products
DO $$
DECLARE
  v_ownership_barter_type_id UUID;
  v_category_id UUID;
  v_subcategory_id UUID;
BEGIN
  SELECT barter_type_id INTO v_ownership_barter_type_id 
  FROM application.barter_types WHERE slug = 'ownership';

  IF v_ownership_barter_type_id IS NULL THEN RETURN; END IF;

  -- Get Vehicles category
  SELECT c.category_id INTO v_category_id 
  FROM application.categories c 
  WHERE c.barter_type_id = v_ownership_barter_type_id AND c.slug = 'vehicles';

  IF v_category_id IS NOT NULL THEN
    SELECT subcategory_id INTO v_subcategory_id 
    FROM application.subcategories WHERE category_id = v_category_id AND slug = 'car';
    
    IF v_subcategory_id IS NOT NULL THEN
      INSERT INTO application.products (product_id, barter_type_id, category_id, subcategory_id, title, description, is_active)
      VALUES (gen_random_uuid(), v_ownership_barter_type_id, v_category_id, v_subcategory_id, 
              'Tesla Model 3 - 2023', 'Low mileage, excellent condition', TRUE)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Get Real Estate category
  SELECT c.category_id INTO v_category_id 
  FROM application.categories c 
  WHERE c.barter_type_id = v_ownership_barter_type_id AND c.slug = 'real-estate';

  IF v_category_id IS NOT NULL THEN
    SELECT subcategory_id INTO v_subcategory_id 
    FROM application.subcategories WHERE category_id = v_category_id AND slug = 'house';
    
    IF v_subcategory_id IS NOT NULL THEN
      INSERT INTO application.products (product_id, barter_type_id, category_id, subcategory_id, title, description, is_active)
      VALUES (gen_random_uuid(), v_ownership_barter_type_id, v_category_id, v_subcategory_id, 
              '3 Bedroom House - Suburban', 'Spacious family home with garden', TRUE)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
DECLARE
  v_barter_types_count INTEGER;
  v_active_barter_types_count INTEGER;
  v_categories_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_barter_types_count FROM application.barter_types;
  SELECT COUNT(*) INTO v_active_barter_types_count FROM application.barter_types WHERE is_active = TRUE;
  SELECT COUNT(*) INTO v_categories_count FROM application.categories c 
    JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id 
    WHERE bt.is_active = TRUE;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'BARTER-X NEW BARTER TYPES MIGRATION COMPLETE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Total Barter Types: % (Active: %)', v_barter_types_count, v_active_barter_types_count;
  RAISE NOTICE 'Active Categories: %', v_categories_count;
  RAISE NOTICE '============================================================';
END $$;
