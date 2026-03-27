-- ============================================================================
-- BARTER-X CATALOG SEED DATA
-- ============================================================================
-- Seeds the catalog tables with barter types, categories, and subcategories.
-- Run this AFTER 001_create_schemas_and_core_tables.sql
-- ============================================================================

-- ============================================================================
-- BARTER TYPES
-- ============================================================================

INSERT INTO application.barter_types (barter_type_id, name, slug, description, icon, color, sort_order) VALUES
  (gen_random_uuid(), 'General Goods Barter', 'goods', 'Barter any items across different categories', 'ShoppingBag', 'text-blue-500', 1),
  (gen_random_uuid(), 'Automobile Barter', 'automobile', 'Barter vehicles within automobile categories', 'Car', 'text-orange-500', 2),
  (gen_random_uuid(), 'Homes & Spaces Barter', 'home-spaces', 'Barter living spaces and rentals', 'Home', 'text-green-500', 3);

-- ============================================================================
-- GOODS BARTER - CATEGORIES & SUBCATEGORIES
-- ============================================================================

DO $$
DECLARE
  v_goods_barter_type_id UUID;
  v_category_id UUID;
BEGIN
  -- Get the Goods barter type ID
  SELECT barter_type_id INTO v_goods_barter_type_id FROM application.barter_types WHERE slug = 'goods';

  -- Electronics
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Electronics', 'electronics', 'Smartphone', 1)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Phones', 'phones', 1),
    (v_category_id, 'Laptops', 'laptops', 2),
    (v_category_id, 'Tablets', 'tablets', 3),
    (v_category_id, 'Audio (Headphones/Speakers)', 'audio', 4),
    (v_category_id, 'Cameras', 'cameras', 5),
    (v_category_id, 'Gaming Consoles', 'gaming-consoles', 6),
    (v_category_id, 'Smart Devices', 'smart-devices', 7);

  -- Home & Furniture
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Home & Furniture', 'home-furniture', 'Sofa', 2)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Sofas', 'sofas', 1),
    (v_category_id, 'Beds', 'beds', 2),
    (v_category_id, 'Tables', 'tables', 3),
    (v_category_id, 'Chairs', 'chairs', 4),
    (v_category_id, 'Storage Units', 'storage-units', 5),
    (v_category_id, 'Home Decor', 'home-decor', 6);

  -- Appliances
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Appliances', 'appliances', 'Refrigerator', 3)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Refrigerators', 'refrigerators', 1),
    (v_category_id, 'Washing Machines', 'washing-machines', 2),
    (v_category_id, 'Microwaves', 'microwaves', 3),
    (v_category_id, 'Air Conditioners', 'air-conditioners', 4),
    (v_category_id, 'Kitchen Appliances', 'kitchen-appliances', 5);

  -- Fashion & Accessories
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Fashion & Accessories', 'fashion-accessories', 'Shirt', 4)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Clothing', 'clothing', 1),
    (v_category_id, 'Shoes', 'shoes', 2),
    (v_category_id, 'Bags/Handbags', 'bags-handbags', 3),
    (v_category_id, 'Watches', 'watches', 4),
    (v_category_id, 'Jewelry', 'jewelry', 5);

  -- Baby & Kids
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Baby & Kids', 'baby-kids', 'Baby', 5)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Strollers', 'strollers', 1),
    (v_category_id, 'Cribs', 'cribs', 2),
    (v_category_id, 'Toys', 'toys', 3),
    (v_category_id, 'Car Seats', 'car-seats', 4),
    (v_category_id, 'Kids Furniture', 'kids-furniture', 5);

  -- Sports & Outdoors
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Sports & Outdoors', 'sports-outdoors', 'Dumbbell', 6)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Bicycles (Non-motorized)', 'bicycles', 1),
    (v_category_id, 'Gym Equipment', 'gym-equipment', 2),
    (v_category_id, 'Camping Gear', 'camping-gear', 3),
    (v_category_id, 'Sports Equipment', 'sports-equipment', 4);

  -- Tools & Equipment
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Tools & Equipment', 'tools-equipment', 'Wrench', 7)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Power Tools', 'power-tools', 1),
    (v_category_id, 'Gardening Tools', 'gardening-tools', 2),
    (v_category_id, 'DIY Equipment', 'diy-equipment', 3);

  -- Books, Media & Collectibles
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Books, Media & Collectibles', 'books-media-collectibles', 'BookOpen', 8)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Books', 'books', 1),
    (v_category_id, 'Board Games', 'board-games', 2),
    (v_category_id, 'Movies', 'movies', 3),
    (v_category_id, 'Collectibles', 'collectibles', 4);

  -- Office & Work Setup
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Office & Work Setup', 'office-work-setup', 'Monitor', 9)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Office Chairs', 'office-chairs', 1),
    (v_category_id, 'Desks', 'desks', 2),
    (v_category_id, 'Monitors', 'monitors', 3),
    (v_category_id, 'Printers', 'printers', 4);

  -- Hobby & Creative
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Hobby & Creative', 'hobby-creative', 'Palette', 10)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Musical Instruments', 'musical-instruments', 1),
    (v_category_id, 'Art Supplies', 'art-supplies', 2),
    (v_category_id, 'Photography Gear', 'photography-gear', 3);

  -- Miscellaneous
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_goods_barter_type_id, 'Miscellaneous', 'miscellaneous', 'Package', 11)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Other Items', 'other-items', 1);

END $$;

-- ============================================================================
-- AUTOMOBILE BARTER - CATEGORIES & SUBCATEGORIES
-- ============================================================================

DO $$
DECLARE
  v_auto_barter_type_id UUID;
  v_category_id UUID;
BEGIN
  -- Get the Automobile barter type ID
  SELECT barter_type_id INTO v_auto_barter_type_id FROM application.barter_types WHERE slug = 'automobile';

  -- Cars
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_auto_barter_type_id, 'Cars', 'cars', 'Car', 1)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Hatchback', 'hatchback', 1),
    (v_category_id, 'Sedan', 'sedan', 2),
    (v_category_id, 'SUV', 'suv', 3),
    (v_category_id, 'Luxury', 'luxury', 4),
    (v_category_id, 'Electric', 'electric', 5);

  -- Bikes / Motorcycles
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_auto_barter_type_id, 'Bikes / Motorcycles', 'bikes-motorcycles', 'Bike', 2)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Commuter', 'commuter', 1),
    (v_category_id, 'Sports', 'sports', 2),
    (v_category_id, 'Cruiser', 'cruiser', 3),
    (v_category_id, 'Electric', 'electric-bike', 4);

  -- Scooters
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_auto_barter_type_id, 'Scooters', 'scooters', 'Bike', 3)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Petrol', 'petrol', 1),
    (v_category_id, 'Electric', 'electric-scooter', 2);

  -- Vans & Commercial
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_auto_barter_type_id, 'Vans & Commercial', 'vans-commercial', 'Truck', 4)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Passenger Van', 'passenger-van', 1),
    (v_category_id, 'Cargo Van', 'cargo-van', 2);

  -- Trucks
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_auto_barter_type_id, 'Trucks', 'trucks', 'Truck', 5)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Light Truck', 'light-truck', 1),
    (v_category_id, 'Heavy Truck', 'heavy-truck', 2);

  -- Trailers
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_auto_barter_type_id, 'Trailers', 'trailers', 'Container', 6)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Utility Trailer', 'utility-trailer', 1),
    (v_category_id, 'Cargo Trailer', 'cargo-trailer', 2);

  -- Caravans / Campers
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_auto_barter_type_id, 'Caravans / Campers', 'caravans-campers', 'Caravan', 7)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Towable Camper', 'towable-camper', 1),
    (v_category_id, 'Motorhome', 'motorhome', 2);

END $$;

-- ============================================================================
-- HOMES & SPACES BARTER - CATEGORIES & SUBCATEGORIES
-- ============================================================================

DO $$
DECLARE
  v_homes_barter_type_id UUID;
  v_category_id UUID;
BEGIN
  -- Get the Homes & Spaces barter type ID
  SELECT barter_type_id INTO v_homes_barter_type_id FROM application.barter_types WHERE slug = 'home-spaces';

  -- Apartments
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_homes_barter_type_id, 'Apartments', 'apartments', 'Building', 1)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Studio', 'studio', 1),
    (v_category_id, '1 Room', '1-room', 2),
    (v_category_id, '2 Room', '2-room', 3),
    (v_category_id, '3 Room', '3-room', 4),
    (v_category_id, '4+ Room', '4-plus-room', 5);

  -- Houses
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_homes_barter_type_id, 'Houses', 'houses', 'Home', 2)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, '1 Room House', '1-room-house', 1),
    (v_category_id, '2 Room House', '2-room-house', 2),
    (v_category_id, '3 Room House', '3-room-house', 3),
    (v_category_id, '4+ Room House', '4-plus-room-house', 4),
    (v_category_id, 'Villa/Bungalow', 'villa-bungalow', 5),
    (v_category_id, 'Townhouse/Row House', 'townhouse-row-house', 6);

  -- Rooms / Co-living
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_homes_barter_type_id, 'Rooms / Co-living', 'rooms-co-living', 'BedDouble', 3)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Private Room', 'private-room', 1),
    (v_category_id, 'Shared Room (2 Sharing)', 'shared-room-2', 2),
    (v_category_id, 'Shared Room (3+ Sharing)', 'shared-room-3-plus', 3),
    (v_category_id, 'Co-living Space', 'co-living-space', 4),
    (v_category_id, 'PG/Hostel', 'pg-hostel', 5);

  -- Parking Spaces
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_homes_barter_type_id, 'Parking Spaces', 'parking-spaces', 'ParkingCircle', 4)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Car Parking (Covered)', 'car-parking-covered', 1),
    (v_category_id, 'Car Parking (Open)', 'car-parking-open', 2),
    (v_category_id, 'Bike Parking', 'bike-parking', 3),
    (v_category_id, 'EV Charging Spot', 'ev-charging-spot', 4);

  -- Storage Spaces
  INSERT INTO application.categories (category_id, barter_type_id, name, slug, icon, sort_order)
  VALUES (gen_random_uuid(), v_homes_barter_type_id, 'Storage Spaces', 'storage-spaces', 'Warehouse', 5)
  RETURNING category_id INTO v_category_id;
  
  INSERT INTO application.subcategories (category_id, name, slug, sort_order) VALUES
    (v_category_id, 'Small Storage', 'small-storage', 1),
    (v_category_id, 'Medium Storage', 'medium-storage', 2),
    (v_category_id, 'Large Storage', 'large-storage', 3),
    (v_category_id, 'Locker Storage', 'locker-storage', 4);

END $$;

-- ============================================================================
-- ANALYTICS EVENT TYPES (Pre-defined for future use)
-- ============================================================================

INSERT INTO analytics.event_types (event_name, event_category, description) VALUES
  -- Navigation events
  ('page_view', 'navigation', 'User viewed a page/screen'),
  ('tab_change', 'navigation', 'User changed barter type tab'),
  ('filter_applied', 'navigation', 'User applied a filter'),
  ('search_performed', 'navigation', 'User performed a search'),
  
  -- Engagement events
  ('product_viewed', 'engagement', 'User viewed a product'),
  ('offer_viewed', 'engagement', 'User viewed an offer'),
  ('offer_card_expanded', 'engagement', 'User expanded an offer card'),
  
  -- Conversion events
  ('offer_created', 'conversion', 'User created a new offer'),
  ('offer_updated', 'conversion', 'User updated an offer'),
  ('hook_created', 'conversion', 'User created a hook'),
  ('cycle_completed', 'conversion', 'A barter cycle was completed'),
  
  -- User events
  ('user_signed_up', 'user', 'New user signed up'),
  ('user_logged_in', 'user', 'User logged in'),
  ('profile_updated', 'user', 'User updated their profile'),
  
  -- Error events
  ('error_occurred', 'error', 'An error occurred'),
  ('api_error', 'error', 'API request failed');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
DECLARE
  v_barter_types_count INTEGER;
  v_categories_count INTEGER;
  v_subcategories_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_barter_types_count FROM application.barter_types;
  SELECT COUNT(*) INTO v_categories_count FROM application.categories;
  SELECT COUNT(*) INTO v_subcategories_count FROM application.subcategories;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'BARTER-X CATALOG SEED COMPLETE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Barter Types: %', v_barter_types_count;
  RAISE NOTICE 'Categories: %', v_categories_count;
  RAISE NOTICE 'Subcategories: %', v_subcategories_count;
  RAISE NOTICE '============================================================';
END $$;
