-- =============================================
-- Migration 006: Seed Products from CSV Data
-- =============================================
-- This script:
-- 1. Inserts brands (extracted from CSV)
-- 2. Inserts products with brand_id references
-- 3. Includes product_info JSONB where available
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: INSERT BRANDS
-- Extract unique brands from the CSV data
-- =============================================

INSERT INTO application.brands (name, slug, is_active, sort_order)
VALUES
  ('Apple', 'apple', true, 1),
  ('Samsung', 'samsung', true, 2),
  ('Google', 'google', true, 3),
  ('OnePlus', 'oneplus', true, 4),
  ('Xiaomi', 'xiaomi', true, 5),
  ('Sony', 'sony', true, 6),
  ('LG', 'lg', true, 7),
  ('Dell', 'dell', true, 8),
  ('HP', 'hp', true, 9),
  ('Lenovo', 'lenovo', true, 10),
  ('ASUS', 'asus', true, 11),
  ('Acer', 'acer', true, 12),
  ('Microsoft', 'microsoft', true, 13),
  ('Razer', 'razer', true, 14),
  ('MSI', 'msi', true, 15),
  ('Bose', 'bose', true, 16),
  ('JBL', 'jbl', true, 17),
  ('Sennheiser', 'sennheiser', true, 18),
  ('Audio-Technica', 'audio-technica', true, 19),
  ('Beats', 'beats', true, 20),
  ('Canon', 'canon', true, 21),
  ('Nikon', 'nikon', true, 22),
  ('Fujifilm', 'fujifilm', true, 23),
  ('Panasonic', 'panasonic', true, 24),
  ('GoPro', 'gopro', true, 25),
  ('Nintendo', 'nintendo', true, 26),
  ('Valve', 'valve', true, 27),
  ('IKEA', 'ikea', true, 28),
  ('Herman Miller', 'herman-miller', true, 29),
  ('Steelcase', 'steelcase', true, 30),
  ('Ashley', 'ashley', true, 31),
  ('West Elm', 'west-elm', true, 32),
  ('Whirlpool', 'whirlpool', true, 33),
  ('Bosch', 'bosch', true, 34),
  ('Dyson', 'dyson', true, 35),
  ('KitchenAid', 'kitchenaid', true, 36),
  ('Instant Pot', 'instant-pot', true, 37),
  ('Nike', 'nike', true, 38),
  ('Adidas', 'adidas', true, 39),
  ('Gucci', 'gucci', true, 40),
  ('Louis Vuitton', 'louis-vuitton', true, 41),
  ('Zara', 'zara', true, 42),
  ('Graco', 'graco', true, 43),
  ('Chicco', 'chicco', true, 44),
  ('Baby Jogger', 'baby-jogger', true, 45),
  ('UPPAbaby', 'uppababy', true, 46),
  ('LEGO', 'lego', true, 47),
  ('Trek', 'trek', true, 48),
  ('Giant', 'giant', true, 49),
  ('Specialized', 'specialized', true, 50),
  ('Peloton', 'peloton', true, 51),
  ('NordicTrack', 'nordictrack', true, 52),
  ('DeWalt', 'dewalt', true, 53),
  ('Makita', 'makita', true, 54),
  ('Milwaukee', 'milwaukee', true, 55),
  ('Black+Decker', 'black-decker', true, 56),
  ('Husqvarna', 'husqvarna', true, 57),
  ('Penguin', 'penguin', true, 58),
  ('Hasbro', 'hasbro', true, 59),
  ('Criterion', 'criterion', true, 60),
  ('Funko', 'funko', true, 61),
  ('Fender', 'fender', true, 62),
  ('Gibson', 'gibson', true, 63),
  ('Yamaha', 'yamaha', true, 64),
  ('Roland', 'roland', true, 65),
  ('Winsor & Newton', 'winsor-newton', true, 66),
  ('Toyota', 'toyota', true, 67),
  ('Honda', 'honda', true, 68),
  ('BMW', 'bmw', true, 69),
  ('Mercedes-Benz', 'mercedes-benz', true, 70),
  ('Tesla', 'tesla', true, 71),
  ('Ford', 'ford', true, 72),
  ('Chevrolet', 'chevrolet', true, 73),
  ('Harley-Davidson', 'harley-davidson', true, 74),
  ('Kawasaki', 'kawasaki', true, 75),
  ('Ducati', 'ducati', true, 76),
  ('Vespa', 'vespa', true, 77),
  ('Ola', 'ola', true, 78),
  ('Airstream', 'airstream', true, 79),
  ('Winnebago', 'winnebago', true, 80)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- STEP 2: INSERT PRODUCTS
-- Using CTEs to lookup foreign keys
-- =============================================

-- Helper: Get subcategory and category IDs
WITH subcats AS (
  SELECT 
    s.subcategory_id,
    s.slug as subcat_slug,
    c.category_id,
    c.slug as cat_slug,
    bt.barter_type_id,
    bt.slug as bt_slug
  FROM application.subcategories s
  JOIN application.categories c ON s.category_id = c.category_id
  JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
),
brands AS (
  SELECT brand_id, slug as brand_slug FROM application.brands
)

-- PHONES (Goods > Electronics > Phones)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('apple', 'iPhone 15 Pro Max', 'iPhone 15 Pro Max', 'Latest flagship with A17 Pro chip and titanium design', '{"released_year": 2023, "processor": "A17 Pro", "screen_size_inches": 6.7, "rear_cameras": "Triple 48MP", "camera_layout": "Square", "notch_type": "Dynamic Island", "edge_type": "Rounded", "rear_material": "Titanium", "biometric": "Face ID", "port_type": "USB-C", "dimensions": "159.9 x 76.7 x 8.25 mm", "weight_grams": 221}'),
  ('apple', 'iPhone 15 Pro', 'iPhone 15 Pro', 'Pro model with A17 Pro chip', '{"released_year": 2023, "processor": "A17 Pro", "screen_size_inches": 6.1, "rear_cameras": "Triple 48MP", "camera_layout": "Square", "notch_type": "Dynamic Island", "edge_type": "Rounded", "rear_material": "Titanium", "biometric": "Face ID", "port_type": "USB-C", "dimensions": "146.6 x 70.6 x 8.25 mm", "weight_grams": 187}'),
  ('apple', 'iPhone 15', 'iPhone 15', 'Standard model with A16 chip and Dynamic Island', '{"released_year": 2023, "processor": "A16 Bionic", "screen_size_inches": 6.1, "rear_cameras": "Dual 48MP", "camera_layout": "Diagonal", "notch_type": "Dynamic Island", "edge_type": "Rounded", "rear_material": "Glass", "biometric": "Face ID", "port_type": "USB-C", "dimensions": "147.6 x 71.6 x 7.8 mm", "weight_grams": 171}'),
  ('apple', 'iPhone 14 Pro Max', 'iPhone 14 Pro Max', 'Previous gen flagship with A16 chip', '{"released_year": 2022, "processor": "A16 Bionic", "screen_size_inches": 6.7, "rear_cameras": "Triple 48MP", "camera_layout": "Square", "notch_type": "Dynamic Island", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Face ID", "port_type": "Lightning", "dimensions": "160.7 x 77.6 x 7.85 mm", "weight_grams": 240}'),
  ('apple', 'iPhone 14', 'iPhone 14', 'Standard model with A15 chip', '{"released_year": 2022, "processor": "A15 Bionic", "screen_size_inches": 6.1, "rear_cameras": "Dual 12MP", "camera_layout": "Diagonal", "notch_type": "Notch", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Face ID", "port_type": "Lightning", "dimensions": "146.7 x 71.5 x 7.8 mm", "weight_grams": 172}'),
  ('apple', 'iPhone 13 Pro', 'iPhone 13 Pro', 'Pro model with A15 chip and ProMotion', '{"released_year": 2021, "processor": "A15 Bionic", "screen_size_inches": 6.1, "rear_cameras": "Triple 12MP", "camera_layout": "Square", "notch_type": "Notch", "edge_type": "Flat", "rear_material": "Matte Glass", "biometric": "Face ID", "port_type": "Lightning", "dimensions": "146.7 x 71.5 x 7.65 mm", "weight_grams": 204}'),
  ('apple', 'iPhone 13', 'iPhone 13', 'Standard model with A15 chip', '{"released_year": 2021, "processor": "A15 Bionic", "screen_size_inches": 6.1, "rear_cameras": "Dual 12MP", "camera_layout": "Diagonal", "notch_type": "Notch", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Face ID", "port_type": "Lightning", "dimensions": "146.7 x 71.5 x 7.65 mm", "weight_grams": 174}'),
  ('apple', 'iPhone SE (3rd gen)', 'iPhone SE (3rd gen)', 'Budget model with A15 chip and Touch ID', '{"released_year": 2022, "processor": "A15 Bionic", "screen_size_inches": 4.7, "rear_cameras": "Single 12MP", "camera_layout": "Single", "notch_type": "None", "edge_type": "Rounded", "rear_material": "Glass", "biometric": "Touch ID", "port_type": "Lightning", "dimensions": "138.4 x 67.3 x 7.3 mm", "weight_grams": 144}'),
  ('samsung', 'Galaxy S24 Ultra', 'Galaxy S24 Ultra', 'Flagship with S Pen and AI features', '{"released_year": 2024, "processor": "Snapdragon 8 Gen 3", "screen_size_inches": 6.8, "rear_cameras": "Quad 200MP", "camera_layout": "Vertical", "notch_type": "Punch Hole", "edge_type": "Flat", "rear_material": "Titanium", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "162.3 x 79 x 8.6 mm", "weight_grams": 232}'),
  ('samsung', 'Galaxy S24+', 'Galaxy S24+', 'Large screen flagship', '{"released_year": 2024, "processor": "Snapdragon 8 Gen 3", "screen_size_inches": 6.7, "rear_cameras": "Triple 50MP", "camera_layout": "Vertical", "notch_type": "Punch Hole", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "158.5 x 75.9 x 7.7 mm", "weight_grams": 196}'),
  ('samsung', 'Galaxy S24', 'Galaxy S24', 'Compact flagship', '{"released_year": 2024, "processor": "Snapdragon 8 Gen 3", "screen_size_inches": 6.2, "rear_cameras": "Triple 50MP", "camera_layout": "Vertical", "notch_type": "Punch Hole", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "147 x 70.6 x 7.6 mm", "weight_grams": 167}'),
  ('samsung', 'Galaxy S23 Ultra', 'Galaxy S23 Ultra', 'Previous gen flagship with S Pen', '{"released_year": 2023, "processor": "Snapdragon 8 Gen 2", "screen_size_inches": 6.8, "rear_cameras": "Quad 200MP", "camera_layout": "Vertical", "notch_type": "Punch Hole", "edge_type": "Curved", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "163.4 x 78.1 x 8.9 mm", "weight_grams": 234}'),
  ('samsung', 'Galaxy Z Fold 5', 'Galaxy Z Fold 5', 'Foldable tablet-phone hybrid', '{"released_year": 2023, "processor": "Snapdragon 8 Gen 2", "screen_size_inches": 7.6, "rear_cameras": "Triple 50MP", "camera_layout": "Vertical", "notch_type": "Punch Hole", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "154.9 x 129.9 x 6.1 mm", "weight_grams": 253}'),
  ('samsung', 'Galaxy Z Flip 5', 'Galaxy Z Flip 5', 'Compact foldable with Flex Window', '{"released_year": 2023, "processor": "Snapdragon 8 Gen 2", "screen_size_inches": 6.7, "rear_cameras": "Dual 12MP", "camera_layout": "Horizontal", "notch_type": "Punch Hole", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "165.1 x 71.9 x 6.9 mm", "weight_grams": 187}'),
  ('samsung', 'Galaxy A54 5G', 'Galaxy A54 5G', 'Mid-range with flagship features', '{"released_year": 2023, "processor": "Exynos 1380", "screen_size_inches": 6.4, "rear_cameras": "Triple 50MP", "camera_layout": "Vertical", "notch_type": "Punch Hole", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "158.2 x 76.7 x 8.2 mm", "weight_grams": 202}'),
  ('google', 'Pixel 8 Pro', 'Pixel 8 Pro', 'Google flagship with Tensor G3', '{"released_year": 2023, "processor": "Tensor G3", "screen_size_inches": 6.7, "rear_cameras": "Triple 50MP", "camera_layout": "Horizontal Bar", "notch_type": "Punch Hole", "edge_type": "Curved", "rear_material": "Matte Glass", "biometric": "Fingerprint + Face", "port_type": "USB-C", "dimensions": "162.6 x 76.5 x 8.8 mm", "weight_grams": 213}'),
  ('google', 'Pixel 8', 'Pixel 8', 'Compact Google phone', '{"released_year": 2023, "processor": "Tensor G3", "screen_size_inches": 6.2, "rear_cameras": "Dual 50MP", "camera_layout": "Horizontal Bar", "notch_type": "Punch Hole", "edge_type": "Rounded", "rear_material": "Matte Glass", "biometric": "Fingerprint + Face", "port_type": "USB-C", "dimensions": "150.5 x 70.8 x 8.9 mm", "weight_grams": 187}'),
  ('google', 'Pixel 7a', 'Pixel 7a', 'Budget flagship killer', '{"released_year": 2023, "processor": "Tensor G2", "screen_size_inches": 6.1, "rear_cameras": "Dual 64MP", "camera_layout": "Horizontal Bar", "notch_type": "Punch Hole", "edge_type": "Rounded", "rear_material": "Plastic", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "152.4 x 72.9 x 9 mm", "weight_grams": 193.5}'),
  ('google', 'Pixel Fold', 'Pixel Fold', 'Google foldable phone', '{"released_year": 2023, "processor": "Tensor G2", "screen_size_inches": 7.6, "rear_cameras": "Triple 48MP", "camera_layout": "Horizontal Bar", "notch_type": "Punch Hole", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "158.7 x 139.7 x 5.8 mm", "weight_grams": 283}'),
  ('oneplus', 'OnePlus 12', 'OnePlus 12', 'Flagship with Hasselblad camera', '{"released_year": 2024, "processor": "Snapdragon 8 Gen 3", "screen_size_inches": 6.82, "rear_cameras": "Triple 50MP", "camera_layout": "Circular", "notch_type": "Punch Hole", "edge_type": "Curved", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "164.3 x 75.8 x 9.15 mm", "weight_grams": 220}'),
  ('oneplus', 'OnePlus 11', 'OnePlus 11', 'Previous gen flagship', '{"released_year": 2023, "processor": "Snapdragon 8 Gen 2", "screen_size_inches": 6.7, "rear_cameras": "Triple 50MP", "camera_layout": "Circular", "notch_type": "Punch Hole", "edge_type": "Curved", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "163.1 x 74.1 x 8.53 mm", "weight_grams": 205}'),
  ('oneplus', 'OnePlus Nord 3', 'OnePlus Nord 3', 'Mid-range with flagship specs', '{"released_year": 2023, "processor": "Dimensity 9000", "screen_size_inches": 6.74, "rear_cameras": "Triple 50MP", "camera_layout": "Vertical", "notch_type": "Punch Hole", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "162.5 x 75.1 x 8.15 mm", "weight_grams": 193.5}'),
  ('xiaomi', 'Xiaomi 14 Ultra', 'Xiaomi 14 Ultra', 'Photography flagship with Leica', '{"released_year": 2024, "processor": "Snapdragon 8 Gen 3", "screen_size_inches": 6.73, "rear_cameras": "Quad 50MP", "camera_layout": "Circular", "notch_type": "Punch Hole", "edge_type": "Curved", "rear_material": "Vegan Leather", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "161.4 x 75.3 x 9.2 mm", "weight_grams": 224}'),
  ('xiaomi', 'Xiaomi 13 Pro', 'Xiaomi 13 Pro', 'Leica camera flagship', '{"released_year": 2023, "processor": "Snapdragon 8 Gen 2", "screen_size_inches": 6.73, "rear_cameras": "Triple 50MP", "camera_layout": "Square", "notch_type": "Punch Hole", "edge_type": "Curved", "rear_material": "Ceramic", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "162.9 x 74.6 x 8.38 mm", "weight_grams": 229}'),
  ('xiaomi', 'Redmi Note 13 Pro+', 'Redmi Note 13 Pro+', 'Best mid-range value', '{"released_year": 2024, "processor": "Dimensity 7200", "screen_size_inches": 6.67, "rear_cameras": "Triple 200MP", "camera_layout": "Vertical", "notch_type": "Punch Hole", "edge_type": "Curved", "rear_material": "Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "161.4 x 74.2 x 8.9 mm", "weight_grams": 204.5}'),
  ('sony', 'Xperia 1 V', 'Xperia 1 V', 'Cinema-grade display and camera', '{"released_year": 2023, "processor": "Snapdragon 8 Gen 2", "screen_size_inches": 6.5, "rear_cameras": "Triple 52MP", "camera_layout": "Vertical", "notch_type": "None", "edge_type": "Flat", "rear_material": "Frosted Glass", "biometric": "Fingerprint", "port_type": "USB-C", "dimensions": "165 x 71 x 8.3 mm", "weight_grams": 187}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'phones' AND sc.cat_slug = 'electronics'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- LAPTOPS (Goods > Electronics > Laptops)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('apple', 'MacBook Pro 16" M3 Max', 'MacBook Pro 16 M3 Max', 'Most powerful MacBook with M3 Max chip', '{"released_year": 2023, "processor": "M3 Max", "ram_gb": 36, "storage_gb": 1000, "screen_size_inches": 16.2, "display_type": "Liquid Retina XDR", "gpu": "M3 Max 40-core", "battery_hours": 22, "weight_kg": 2.14}'),
  ('apple', 'MacBook Pro 14" M3 Pro', 'MacBook Pro 14 M3 Pro', 'Pro performance in compact form', '{"released_year": 2023, "processor": "M3 Pro", "ram_gb": 18, "storage_gb": 512, "screen_size_inches": 14.2, "display_type": "Liquid Retina XDR", "gpu": "M3 Pro 14-core", "battery_hours": 17, "weight_kg": 1.61}'),
  ('apple', 'MacBook Air 15" M3', 'MacBook Air 15 M3', 'Thin and light with large display', '{"released_year": 2024, "processor": "M3", "ram_gb": 8, "storage_gb": 256, "screen_size_inches": 15.3, "display_type": "Liquid Retina", "gpu": "M3 10-core", "battery_hours": 18, "weight_kg": 1.51}'),
  ('apple', 'MacBook Air 13" M3', 'MacBook Air 13 M3', 'Everyday laptop with M3', '{"released_year": 2024, "processor": "M3", "ram_gb": 8, "storage_gb": 256, "screen_size_inches": 13.6, "display_type": "Liquid Retina", "gpu": "M3 8-core", "battery_hours": 18, "weight_kg": 1.24}'),
  ('apple', 'MacBook Air 13" M2', 'MacBook Air 13 M2', 'Previous gen thin laptop', '{"released_year": 2022, "processor": "M2", "ram_gb": 8, "storage_gb": 256, "screen_size_inches": 13.6, "display_type": "Liquid Retina", "gpu": "M2 8-core", "battery_hours": 18, "weight_kg": 1.24}'),
  ('dell', 'XPS 15 (2024)', 'XPS 15 2024', 'Premium Windows ultrabook', '{"released_year": 2024, "processor": "Intel Core Ultra 7", "ram_gb": 16, "storage_gb": 512, "screen_size_inches": 15.6, "display_type": "OLED 3.5K", "gpu": "Intel Arc", "battery_hours": 13, "weight_kg": 1.86}'),
  ('dell', 'XPS 13 Plus', 'XPS 13 Plus', 'Futuristic compact laptop', '{"released_year": 2023, "processor": "Intel Core i7-1360P", "ram_gb": 16, "storage_gb": 512, "screen_size_inches": 13.4, "display_type": "OLED 3.5K", "gpu": "Intel Iris Xe", "battery_hours": 10, "weight_kg": 1.26}'),
  ('dell', 'Inspiron 16', 'Inspiron 16 2024', 'Everyday productivity laptop', '{"released_year": 2024, "processor": "Intel Core i5-1335U", "ram_gb": 8, "storage_gb": 256, "screen_size_inches": 16, "display_type": "FHD+", "gpu": "Intel UHD", "battery_hours": 8, "weight_kg": 1.87}'),
  ('hp', 'Spectre x360 16', 'Spectre x360 16', '2-in-1 premium convertible', '{"released_year": 2024, "processor": "Intel Core Ultra 7", "ram_gb": 16, "storage_gb": 1000, "screen_size_inches": 16, "display_type": "OLED 4K", "gpu": "Intel Arc", "battery_hours": 12, "weight_kg": 2.04}'),
  ('hp', 'Envy x360 15', 'Envy x360 15', 'Versatile 2-in-1 laptop', '{"released_year": 2024, "processor": "AMD Ryzen 7 8840U", "ram_gb": 16, "storage_gb": 512, "screen_size_inches": 15.6, "display_type": "OLED FHD", "gpu": "AMD Radeon 780M", "battery_hours": 11, "weight_kg": 1.91}'),
  ('hp', 'Pavilion 15', 'Pavilion 15 2024', 'Budget-friendly everyday laptop', '{"released_year": 2024, "processor": "Intel Core i5-1335U", "ram_gb": 8, "storage_gb": 256, "screen_size_inches": 15.6, "display_type": "FHD IPS", "gpu": "Intel Iris Xe", "battery_hours": 8, "weight_kg": 1.75}'),
  ('lenovo', 'ThinkPad X1 Carbon Gen 12', 'ThinkPad X1 Carbon Gen 12', 'Business ultrabook flagship', '{"released_year": 2024, "processor": "Intel Core Ultra 7", "ram_gb": 16, "storage_gb": 512, "screen_size_inches": 14, "display_type": "2.8K OLED", "gpu": "Intel Arc", "battery_hours": 15, "weight_kg": 1.08}'),
  ('lenovo', 'ThinkPad T14s Gen 5', 'ThinkPad T14s Gen 5', 'Portable business workhorse', '{"released_year": 2024, "processor": "Intel Core Ultra 5", "ram_gb": 16, "storage_gb": 256, "screen_size_inches": 14, "display_type": "2.8K IPS", "gpu": "Intel Arc", "battery_hours": 12, "weight_kg": 1.24}'),
  ('lenovo', 'Yoga 9i Gen 9', 'Yoga 9i Gen 9', 'Premium 2-in-1 with soundbar', '{"released_year": 2024, "processor": "Intel Core Ultra 7", "ram_gb": 16, "storage_gb": 512, "screen_size_inches": 14, "display_type": "4K OLED", "gpu": "Intel Arc", "battery_hours": 10, "weight_kg": 1.4}'),
  ('lenovo', 'IdeaPad Slim 5', 'IdeaPad Slim 5 2024', 'Affordable productivity laptop', '{"released_year": 2024, "processor": "AMD Ryzen 5 7530U", "ram_gb": 8, "storage_gb": 512, "screen_size_inches": 15.6, "display_type": "FHD IPS", "gpu": "AMD Radeon", "battery_hours": 10, "weight_kg": 1.7}'),
  ('asus', 'ROG Zephyrus G16 (2024)', 'ROG Zephyrus G16 2024', 'Thin gaming powerhouse', '{"released_year": 2024, "processor": "Intel Core Ultra 9", "ram_gb": 32, "storage_gb": 1000, "screen_size_inches": 16, "display_type": "OLED QHD+ 240Hz", "gpu": "RTX 4090", "battery_hours": 10, "weight_kg": 1.85}'),
  ('asus', 'ROG Strix G16', 'ROG Strix G16 2024', 'Gaming laptop with RGB', '{"released_year": 2024, "processor": "Intel Core i9-14900HX", "ram_gb": 16, "storage_gb": 1000, "screen_size_inches": 16, "display_type": "QHD+ 240Hz", "gpu": "RTX 4070", "battery_hours": 6, "weight_kg": 2.5}'),
  ('asus', 'ZenBook 14 OLED', 'ZenBook 14 OLED 2024', 'Ultralight OLED laptop', '{"released_year": 2024, "processor": "Intel Core Ultra 7", "ram_gb": 16, "storage_gb": 512, "screen_size_inches": 14, "display_type": "2.8K OLED", "gpu": "Intel Arc", "battery_hours": 13, "weight_kg": 1.28}'),
  ('asus', 'Vivobook S 15 OLED', 'Vivobook S 15 OLED', 'Stylish everyday laptop', '{"released_year": 2024, "processor": "Snapdragon X Elite", "ram_gb": 16, "storage_gb": 512, "screen_size_inches": 15.6, "display_type": "3K OLED", "gpu": "Qualcomm Adreno", "battery_hours": 18, "weight_kg": 1.42}'),
  ('acer', 'Swift Go 14', 'Swift Go 14 2024', 'AI-powered ultrabook', '{"released_year": 2024, "processor": "Intel Core Ultra 7", "ram_gb": 16, "storage_gb": 512, "screen_size_inches": 14, "display_type": "2.8K OLED", "gpu": "Intel Arc", "battery_hours": 12, "weight_kg": 1.25}'),
  ('acer', 'Predator Helios 16', 'Predator Helios 16 2024', 'High-end gaming laptop', '{"released_year": 2024, "processor": "Intel Core i9-14900HX", "ram_gb": 32, "storage_gb": 1000, "screen_size_inches": 16, "display_type": "QHD+ 240Hz", "gpu": "RTX 4080", "battery_hours": 5, "weight_kg": 2.6}'),
  ('acer', 'Aspire 5', 'Aspire 5 2024', 'Budget all-rounder', '{"released_year": 2024, "processor": "Intel Core i5-1335U", "ram_gb": 8, "storage_gb": 256, "screen_size_inches": 15.6, "display_type": "FHD IPS", "gpu": "Intel Iris Xe", "battery_hours": 8, "weight_kg": 1.76}'),
  ('microsoft', 'Surface Laptop 6', 'Surface Laptop 6', 'Premium Windows laptop', '{"released_year": 2024, "processor": "Snapdragon X Elite", "ram_gb": 16, "storage_gb": 256, "screen_size_inches": 13.8, "display_type": "PixelSense", "gpu": "Qualcomm Adreno", "battery_hours": 19, "weight_kg": 1.34}'),
  ('microsoft', 'Surface Pro 10', 'Surface Pro 10', '2-in-1 tablet laptop', '{"released_year": 2024, "processor": "Intel Core Ultra 7", "ram_gb": 16, "storage_gb": 256, "screen_size_inches": 13, "display_type": "PixelSense", "gpu": "Intel Arc", "battery_hours": 14, "weight_kg": 0.88}'),
  ('razer', 'Blade 16 (2024)', 'Razer Blade 16 2024', 'Ultimate gaming laptop', '{"released_year": 2024, "processor": "Intel Core i9-14900HX", "ram_gb": 32, "storage_gb": 1000, "screen_size_inches": 16, "display_type": "OLED 4K 120Hz", "gpu": "RTX 4090", "battery_hours": 6, "weight_kg": 2.45}'),
  ('razer', 'Blade 14 (2024)', 'Razer Blade 14 2024', 'Compact gaming powerhouse', '{"released_year": 2024, "processor": "AMD Ryzen 9 8945HX", "ram_gb": 16, "storage_gb": 1000, "screen_size_inches": 14, "display_type": "QHD+ 240Hz", "gpu": "RTX 4070", "battery_hours": 7, "weight_kg": 1.84}'),
  ('msi', 'Stealth 16 Mercedes-AMG', 'Stealth 16 AMG 2024', 'Luxury gaming laptop', '{"released_year": 2024, "processor": "Intel Core Ultra 9", "ram_gb": 64, "storage_gb": 2000, "screen_size_inches": 16, "display_type": "4K Mini LED", "gpu": "RTX 4090", "battery_hours": 6, "weight_kg": 2.1}'),
  ('msi', 'Creator Z17 HX Studio', 'Creator Z17 HX Studio', 'Creator workstation laptop', '{"released_year": 2024, "processor": "Intel Core i9-13980HX", "ram_gb": 64, "storage_gb": 2000, "screen_size_inches": 17, "display_type": "QHD+ 165Hz", "gpu": "RTX 4070", "battery_hours": 7, "weight_kg": 2.49}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'laptops' AND sc.cat_slug = 'electronics'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- AUDIO - Headphones/Speakers (Goods > Electronics > Audio)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('apple', 'AirPods Max', 'AirPods Max', 'Premium over-ear headphones with ANC', '{"type": "Over-ear", "driver_size_mm": 40, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 20, "connectivity": "Bluetooth 5.0", "weight_grams": 384}'),
  ('apple', 'AirPods Pro (2nd gen)', 'AirPods Pro 2', 'In-ear with adaptive audio', '{"type": "In-ear", "driver_size_mm": 11, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 6, "connectivity": "Bluetooth 5.3", "weight_grams": 5.3}'),
  ('apple', 'AirPods (3rd gen)', 'AirPods 3', 'Everyday wireless earbuds', '{"type": "In-ear", "driver_size_mm": 11, "noise_cancellation": false, "transparency_mode": false, "battery_hours": 6, "connectivity": "Bluetooth 5.0", "weight_grams": 4.28}'),
  ('sony', 'WH-1000XM5', 'WH-1000XM5', 'Industry-leading ANC headphones', '{"type": "Over-ear", "driver_size_mm": 30, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 30, "connectivity": "Bluetooth 5.2", "weight_grams": 250}'),
  ('sony', 'WH-1000XM4', 'WH-1000XM4', 'Previous gen premium ANC', '{"type": "Over-ear", "driver_size_mm": 40, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 30, "connectivity": "Bluetooth 5.0", "weight_grams": 254}'),
  ('sony', 'WF-1000XM5', 'WF-1000XM5', 'Premium ANC earbuds', '{"type": "In-ear", "driver_size_mm": 8.4, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 8, "connectivity": "Bluetooth 5.3", "weight_grams": 5.9}'),
  ('bose', 'QuietComfort Ultra Headphones', 'QC Ultra Headphones', 'Immersive audio with spatial', '{"type": "Over-ear", "driver_size_mm": 35, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 24, "connectivity": "Bluetooth 5.3", "weight_grams": 250}'),
  ('bose', 'QuietComfort Headphones', 'QC Headphones', 'Comfortable ANC headphones', '{"type": "Over-ear", "driver_size_mm": 35, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 24, "connectivity": "Bluetooth 5.1", "weight_grams": 240}'),
  ('bose', 'QuietComfort Ultra Earbuds', 'QC Ultra Earbuds', 'Premium wireless earbuds', '{"type": "In-ear", "driver_size_mm": 9.3, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 6, "connectivity": "Bluetooth 5.3", "weight_grams": 6.24}'),
  ('sennheiser', 'Momentum 4 Wireless', 'Momentum 4', 'Audiophile wireless headphones', '{"type": "Over-ear", "driver_size_mm": 42, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 60, "connectivity": "Bluetooth 5.2", "weight_grams": 293}'),
  ('sennheiser', 'HD 660S2', 'HD 660S2', 'Open-back audiophile headphones', '{"type": "Over-ear Open", "driver_size_mm": 38, "noise_cancellation": false, "impedance_ohms": 300, "frequency_response": "8-41500 Hz", "weight_grams": 260}'),
  ('audio-technica', 'ATH-M50xBT2', 'ATH-M50xBT2', 'Studio monitor wireless', '{"type": "Over-ear", "driver_size_mm": 45, "noise_cancellation": false, "transparency_mode": false, "battery_hours": 50, "connectivity": "Bluetooth 5.0", "weight_grams": 307}'),
  ('beats', 'Studio Pro', 'Beats Studio Pro', 'Premium ANC with Apple features', '{"type": "Over-ear", "driver_size_mm": 40, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 40, "connectivity": "Bluetooth 5.3", "weight_grams": 260}'),
  ('jbl', 'Tour One M2', 'JBL Tour One M2', 'Pro ANC headphones', '{"type": "Over-ear", "driver_size_mm": 40, "noise_cancellation": true, "transparency_mode": true, "battery_hours": 50, "connectivity": "Bluetooth 5.3", "weight_grams": 268}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'audio-headphones-speakers' AND sc.cat_slug = 'electronics'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- CAMERAS (Goods > Electronics > Cameras)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('canon', 'EOS R5', 'EOS R5', 'Professional mirrorless camera', '{"type": "Mirrorless", "sensor": "Full Frame", "megapixels": 45, "video_resolution": "8K", "autofocus_points": 5940, "iso_range": "100-51200", "weight_grams": 738}'),
  ('canon', 'EOS R6 Mark II', 'EOS R6 II', 'Versatile hybrid shooter', '{"type": "Mirrorless", "sensor": "Full Frame", "megapixels": 24.2, "video_resolution": "4K 60fps", "autofocus_points": 4897, "iso_range": "100-102400", "weight_grams": 670}'),
  ('canon', 'EOS R8', 'EOS R8', 'Compact full-frame mirrorless', '{"type": "Mirrorless", "sensor": "Full Frame", "megapixels": 24.2, "video_resolution": "4K 60fps", "autofocus_points": 1053, "iso_range": "100-102400", "weight_grams": 461}'),
  ('sony', 'Alpha 7R V', 'A7R V', 'High-resolution flagship', '{"type": "Mirrorless", "sensor": "Full Frame", "megapixels": 61, "video_resolution": "8K", "autofocus_points": 759, "iso_range": "100-32000", "weight_grams": 723}'),
  ('sony', 'Alpha 7 IV', 'A7 IV', 'Hybrid full-frame camera', '{"type": "Mirrorless", "sensor": "Full Frame", "megapixels": 33, "video_resolution": "4K 60fps", "autofocus_points": 759, "iso_range": "100-51200", "weight_grams": 658}'),
  ('sony', 'Alpha 6700', 'A6700', 'Advanced APS-C mirrorless', '{"type": "Mirrorless", "sensor": "APS-C", "megapixels": 26, "video_resolution": "4K 120fps", "autofocus_points": 759, "iso_range": "100-32000", "weight_grams": 493}'),
  ('nikon', 'Z8', 'Nikon Z8', 'Compact flagship mirrorless', '{"type": "Mirrorless", "sensor": "Full Frame", "megapixels": 45.7, "video_resolution": "8K", "autofocus_points": 493, "iso_range": "64-25600", "weight_grams": 910}'),
  ('nikon', 'Z6 III', 'Nikon Z6 III', 'All-round mirrorless', '{"type": "Mirrorless", "sensor": "Full Frame", "megapixels": 24.5, "video_resolution": "6K", "autofocus_points": 273, "iso_range": "100-64000", "weight_grams": 760}'),
  ('fujifilm', 'X-T5', 'Fujifilm X-T5', 'Retro-styled APS-C camera', '{"type": "Mirrorless", "sensor": "APS-C", "megapixels": 40.2, "video_resolution": "6.2K", "autofocus_points": 425, "iso_range": "125-12800", "weight_grams": 557}'),
  ('fujifilm', 'X100VI', 'Fujifilm X100VI', 'Premium compact camera', '{"type": "Compact", "sensor": "APS-C", "megapixels": 40.2, "video_resolution": "6.2K", "autofocus_points": 425, "iso_range": "125-12800", "weight_grams": 521}'),
  ('panasonic', 'Lumix S5 IIX', 'Lumix S5 IIX', 'Video-focused full frame', '{"type": "Mirrorless", "sensor": "Full Frame", "megapixels": 24.2, "video_resolution": "6K", "autofocus_points": 779, "iso_range": "100-51200", "weight_grams": 740}'),
  ('gopro', 'HERO12 Black', 'GoPro HERO12', 'Action camera flagship', '{"type": "Action Camera", "sensor": "1/1.9 inch", "megapixels": 27, "video_resolution": "5.3K 60fps", "waterproof_meters": 10, "weight_grams": 154}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'cameras' AND sc.cat_slug = 'electronics'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- GAMING CONSOLES (Goods > Electronics > Gaming Consoles)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('sony', 'PlayStation 5', 'PS5 Disc', 'Next-gen gaming console with disc drive', '{"generation": 9, "storage_gb": 825, "resolution": "4K 120fps", "ray_tracing": true, "backwards_compatible": true, "weight_kg": 4.5}'),
  ('sony', 'PlayStation 5 Digital', 'PS5 Digital', 'Digital-only PS5', '{"generation": 9, "storage_gb": 825, "resolution": "4K 120fps", "ray_tracing": true, "backwards_compatible": true, "weight_kg": 3.9}'),
  ('sony', 'PlayStation 5 Slim', 'PS5 Slim', 'Compact redesigned PS5', '{"generation": 9, "storage_gb": 1000, "resolution": "4K 120fps", "ray_tracing": true, "backwards_compatible": true, "weight_kg": 3.2}'),
  ('microsoft', 'Xbox Series X', 'Xbox Series X', 'Most powerful Xbox', '{"generation": 9, "storage_gb": 1000, "resolution": "4K 120fps", "ray_tracing": true, "backwards_compatible": true, "weight_kg": 4.45}'),
  ('microsoft', 'Xbox Series S', 'Xbox Series S', 'Compact digital Xbox', '{"generation": 9, "storage_gb": 512, "resolution": "1440p 120fps", "ray_tracing": true, "backwards_compatible": true, "weight_kg": 1.93}'),
  ('nintendo', 'Nintendo Switch OLED', 'Switch OLED', 'Hybrid console with OLED screen', '{"generation": 8, "storage_gb": 64, "resolution": "1080p docked", "screen_size_inches": 7, "battery_hours": 9, "weight_grams": 420}'),
  ('nintendo', 'Nintendo Switch', 'Switch Standard', 'Original hybrid console', '{"generation": 8, "storage_gb": 32, "resolution": "1080p docked", "screen_size_inches": 6.2, "battery_hours": 9, "weight_grams": 398}'),
  ('nintendo', 'Nintendo Switch Lite', 'Switch Lite', 'Handheld-only Switch', '{"generation": 8, "storage_gb": 32, "resolution": "720p", "screen_size_inches": 5.5, "battery_hours": 7, "weight_grams": 275}'),
  ('valve', 'Steam Deck OLED', 'Steam Deck OLED', 'PC gaming handheld with OLED', '{"storage_gb": 512, "resolution": "1280x800", "screen_size_inches": 7.4, "battery_hours": 12, "weight_grams": 640}'),
  ('valve', 'Steam Deck LCD', 'Steam Deck LCD', 'Original PC gaming handheld', '{"storage_gb": 256, "resolution": "1280x800", "screen_size_inches": 7, "battery_hours": 8, "weight_grams": 669}'),
  ('asus', 'ROG Ally', 'ROG Ally', 'Windows gaming handheld', '{"storage_gb": 512, "resolution": "1920x1080", "screen_size_inches": 7, "battery_hours": 8, "weight_grams": 608}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'gaming-consoles' AND sc.cat_slug = 'electronics'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- HOME & FURNITURE (Goods > Home & Furniture > Various)
-- Sofas
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('ikea', 'KIVIK 3-seat Sofa', 'KIVIK 3-seat', 'Comfortable fabric sofa', '{"material": "Fabric", "seating_capacity": 3, "color": "Gray", "dimensions": "228x95x83 cm", "weight_kg": 65}'),
  ('ikea', 'SÖDERHAMN Sectional', 'SODERHAMN Sectional', 'Modular sectional sofa', '{"material": "Fabric", "seating_capacity": 5, "color": "Beige", "dimensions": "291x198x83 cm", "weight_kg": 85}'),
  ('west-elm', 'Harmony Sofa', 'Harmony 92', 'Modern minimalist sofa', '{"material": "Performance Velvet", "seating_capacity": 3, "color": "Navy", "dimensions": "234x97x84 cm", "weight_kg": 58}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'sofas' AND sc.cat_slug = 'home-furniture'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- Chairs
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('herman-miller', 'Aeron Chair', 'Aeron Remastered', 'Ergonomic office chair', '{"material": "Mesh", "adjustable_height": true, "lumbar_support": true, "armrests": "4D", "weight_capacity_kg": 159}'),
  ('herman-miller', 'Embody Chair', 'Embody', 'Premium ergonomic chair', '{"material": "Fabric", "adjustable_height": true, "lumbar_support": true, "armrests": "4D", "weight_capacity_kg": 136}'),
  ('steelcase', 'Leap V2', 'Leap V2', 'Adaptive office chair', '{"material": "Fabric", "adjustable_height": true, "lumbar_support": true, "armrests": "4D", "weight_capacity_kg": 180}'),
  ('ikea', 'MARKUS Office Chair', 'MARKUS', 'High-back office chair', '{"material": "Mesh/Fabric", "adjustable_height": true, "lumbar_support": true, "armrests": "Fixed", "weight_capacity_kg": 110}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'chairs' AND sc.cat_slug = 'home-furniture'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- Storage Units
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('ikea', 'KALLAX 4x4', 'KALLAX 4x4', 'Versatile shelf unit', '{"material": "Particleboard", "shelves": 16, "color": "White", "dimensions": "147x147x39 cm", "weight_kg": 55}'),
  ('ikea', 'BILLY Bookcase', 'BILLY', 'Classic bookcase', '{"material": "Particleboard", "shelves": 5, "color": "White", "dimensions": "80x28x202 cm", "weight_kg": 35}'),
  ('ikea', 'HEMNES 8-drawer Dresser', 'HEMNES 8-drawer', 'Traditional dresser', '{"material": "Solid Pine", "drawers": 8, "color": "White Stain", "dimensions": "160x50x96 cm", "weight_kg": 80}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'storage-units' AND sc.cat_slug = 'home-furniture'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- APPLIANCES (Goods > Appliances > Various)
-- Refrigerators
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('samsung', 'Bespoke French Door', 'RF29BB8900', 'Customizable smart fridge', '{"capacity_liters": 810, "type": "French Door", "smart_features": true, "ice_maker": true, "energy_rating": "A++", "dimensions": "91x72x185 cm"}'),
  ('lg', 'InstaView French Door', 'LRFVS3006S', 'Knock-to-see fridge', '{"capacity_liters": 750, "type": "French Door", "smart_features": true, "ice_maker": true, "energy_rating": "A+", "dimensions": "91x74x179 cm"}'),
  ('whirlpool', 'Side-by-Side', 'WRS325SDHZ', 'Traditional side-by-side', '{"capacity_liters": 700, "type": "Side-by-Side", "smart_features": false, "ice_maker": true, "energy_rating": "A+", "dimensions": "91x68x175 cm"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'refrigerators' AND sc.cat_slug = 'appliances'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- Kitchen Appliances
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('kitchenaid', 'Artisan Stand Mixer', 'KSM150PS', 'Iconic stand mixer', '{"capacity_liters": 4.8, "power_watts": 300, "speeds": 10, "attachments_included": 3, "color": "Empire Red"}'),
  ('dyson', 'V15 Detect', 'V15 Detect Absolute', 'Laser-equipped vacuum', '{"type": "Cordless Stick", "power_watts": 230, "runtime_minutes": 60, "dustbin_liters": 0.76, "weight_kg": 3.1}'),
  ('instant-pot', 'Duo Plus 6qt', 'Duo Plus 6', 'Multi-function pressure cooker', '{"capacity_liters": 5.7, "programs": 9, "pressure_levels": 2, "power_watts": 1000}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'kitchen-appliances' AND sc.cat_slug = 'appliances'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- FASHION (Goods > Fashion & Accessories > Various)
-- Clothing
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('nike', 'Tech Fleece Hoodie', 'Tech Fleece Full-Zip', 'Premium fleece hoodie', '{"material": "Cotton Blend Fleece", "fit": "Regular", "sizes": ["S","M","L","XL"], "color": "Black"}'),
  ('adidas', 'Ultraboost 23', 'Ultraboost 23', 'Premium running shoes', '{"material": "Primeknit Upper", "sole": "Boost", "sizes": ["7-13"], "color": "Core Black"}'),
  ('zara', 'Oversized Blazer', 'Oversized Blazer', 'Modern oversized blazer', '{"material": "Polyester Blend", "fit": "Oversized", "sizes": ["XS","S","M","L"], "color": "Ecru"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'clothing' AND sc.cat_slug = 'fashion-accessories'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- Shoes
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('nike', 'Air Jordan 1 High OG', 'AJ1 High OG Chicago', 'Iconic basketball sneaker', '{"material": "Leather", "style": "High Top", "sizes": ["7-14"], "colorway": "Chicago"}'),
  ('nike', 'Air Max 90', 'Air Max 90', 'Classic lifestyle sneaker', '{"material": "Leather/Mesh", "style": "Low Top", "sizes": ["6-13"], "colorway": "White/Black"}'),
  ('adidas', 'Stan Smith', 'Stan Smith', 'Timeless tennis shoe', '{"material": "Leather", "style": "Low Top", "sizes": ["5-13"], "colorway": "White/Green"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'shoes' AND sc.cat_slug = 'fashion-accessories'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- BABY & KIDS (Goods > Baby & Kids > Various)
-- Strollers
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('uppababy', 'Vista V2', 'Vista V2', 'Convertible stroller system', '{"type": "Full-Size", "max_weight_kg": 22, "reversible_seat": true, "bassinet_compatible": true, "weight_kg": 11.8}'),
  ('baby-jogger', 'City Mini GT2', 'City Mini GT2', 'All-terrain stroller', '{"type": "Full-Size", "max_weight_kg": 30, "reversible_seat": false, "all_terrain": true, "weight_kg": 10.2}'),
  ('chicco', 'Bravo LE Trio', 'Bravo LE Trio', 'Travel system stroller', '{"type": "Travel System", "max_weight_kg": 22, "car_seat_included": true, "weight_kg": 10}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'strollers' AND sc.cat_slug = 'baby-kids'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- Toys
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('lego', 'Millennium Falcon UCS', '75192', 'Ultimate Collector Series set', '{"pieces": 7541, "age_range": "16+", "theme": "Star Wars", "dimensions": "84x56x21 cm"}'),
  ('lego', 'Technic Bugatti Chiron', '42083', 'Detailed supercar model', '{"pieces": 3599, "age_range": "16+", "theme": "Technic", "dimensions": "56x25x14 cm"}'),
  ('lego', 'Creator Expert Colosseum', '10276', 'Largest LEGO set', '{"pieces": 9036, "age_range": "18+", "theme": "Creator Expert", "dimensions": "52x59x27 cm"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'toys' AND sc.cat_slug = 'baby-kids'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- SPORTS & OUTDOORS (Goods > Sports & Outdoors > Bicycles)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('trek', 'Domane SL 7', 'Domane SL 7', 'Endurance road bike', '{"type": "Road", "frame_material": "Carbon", "groupset": "Shimano Ultegra Di2", "wheel_size_inches": 700, "weight_kg": 8.5}'),
  ('specialized', 'Tarmac SL7', 'Tarmac SL7 Expert', 'Race road bike', '{"type": "Road", "frame_material": "Carbon", "groupset": "Shimano Ultegra Di2", "wheel_size_inches": 700, "weight_kg": 7.9}'),
  ('giant', 'Trance X 29', 'Trance X 29 2', 'Trail mountain bike', '{"type": "Mountain", "frame_material": "Aluminum", "suspension_travel_mm": 135, "wheel_size_inches": 29, "weight_kg": 14.5}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'bicycles-non-motorized' AND sc.cat_slug = 'sports-outdoors'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- Gym Equipment
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('peloton', 'Bike+', 'Bike+', 'Connected fitness bike', '{"type": "Indoor Cycling", "screen_size_inches": 23.8, "rotating_screen": true, "resistance_levels": 100, "weight_kg": 63}'),
  ('nordictrack', 'Commercial 1750', 'C1750', 'Incline treadmill', '{"type": "Treadmill", "screen_size_inches": 14, "max_speed_mph": 12, "incline_range": "-3% to 15%", "weight_kg": 136}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'gym-equipment' AND sc.cat_slug = 'sports-outdoors'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- TOOLS & EQUIPMENT (Goods > Tools & Equipment > Power Tools)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('dewalt', '20V MAX XR Drill', 'DCD998', 'Brushless hammer drill', '{"type": "Hammer Drill", "voltage": 20, "brushless": true, "max_torque_nm": 95, "battery_included": true}'),
  ('makita', '18V LXT Circular Saw', 'XSH03Z', 'Cordless circular saw', '{"type": "Circular Saw", "voltage": 18, "blade_size_inches": 6.5, "brushless": true, "battery_included": false}'),
  ('milwaukee', 'M18 FUEL Impact Driver', '2953-20', 'High-torque impact driver', '{"type": "Impact Driver", "voltage": 18, "brushless": true, "max_torque_nm": 226, "battery_included": false}'),
  ('black-decker', '20V MAX Drill Combo', 'BD2KITCDDI', '2-tool combo kit', '{"type": "Combo Kit", "voltage": 20, "includes": ["Drill", "Impact Driver"], "battery_included": true}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'power-tools' AND sc.cat_slug = 'tools-equipment'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- BOOKS, MEDIA & COLLECTIBLES (Goods > Books, Media & Collectibles > Collectibles)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('funko', 'Pop! Star Wars Darth Vader', 'Pop 01', 'Original Darth Vader Funko', '{"type": "Vinyl Figure", "series": "Star Wars", "height_inches": 3.75, "exclusive": false, "chase": false}'),
  ('funko', 'Pop! Marvel Iron Man', 'Pop 04', 'Classic Iron Man Funko', '{"type": "Vinyl Figure", "series": "Marvel", "height_inches": 3.75, "exclusive": false, "chase": false}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'collectibles' AND sc.cat_slug = 'books-media-collectibles'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- HOBBY & CREATIVE (Goods > Hobby & Creative > Musical Instruments)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('fender', 'American Professional II Stratocaster', 'Am Pro II Strat', 'Professional electric guitar', '{"type": "Electric Guitar", "body": "Alder", "neck": "Maple", "frets": 22, "pickups": "V-Mod II Single-Coil"}'),
  ('gibson', 'Les Paul Standard 50s', 'LP Std 50s', 'Classic humbucker guitar', '{"type": "Electric Guitar", "body": "Mahogany", "neck": "Mahogany", "frets": 22, "pickups": "Burstbucker"}'),
  ('yamaha', 'P-125', 'P-125', 'Digital piano', '{"type": "Digital Piano", "keys": 88, "weighted_keys": true, "polyphony": 192, "voices": 24}'),
  ('roland', 'TD-17KVX', 'TD-17KVX', 'Electronic drum kit', '{"type": "Electronic Drums", "pads": 8, "cymbals": 4, "module": "TD-17", "hi_hat": "VH-10"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'musical-instruments' AND sc.cat_slug = 'hobby-creative'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- =============================================
-- AUTOMOBILE BARTER
-- =============================================

-- CARS (Automobile > Cars > Various subcategories)
-- Sedans
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('toyota', 'Camry XLE', 'Camry XLE 2024', 'Reliable mid-size sedan', '{"year": 2024, "engine": "2.5L 4-Cylinder", "horsepower": 203, "transmission": "8-Speed Auto", "fuel_type": "Gasoline", "mpg_city": 28, "mpg_highway": 39}'),
  ('honda', 'Accord Sport', 'Accord Sport 2024', 'Sporty mid-size sedan', '{"year": 2024, "engine": "1.5L Turbo", "horsepower": 192, "transmission": "CVT", "fuel_type": "Gasoline", "mpg_city": 29, "mpg_highway": 37}'),
  ('bmw', '3 Series 330i', '330i 2024', 'Luxury sport sedan', '{"year": 2024, "engine": "2.0L Turbo", "horsepower": 255, "transmission": "8-Speed Auto", "fuel_type": "Gasoline", "mpg_city": 26, "mpg_highway": 36}'),
  ('mercedes-benz', 'C-Class C300', 'C300 2024', 'Elegant compact sedan', '{"year": 2024, "engine": "2.0L Turbo", "horsepower": 255, "transmission": "9-Speed Auto", "fuel_type": "Gasoline", "mpg_city": 23, "mpg_highway": 33}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'sedan' AND sc.cat_slug = 'cars'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- SUVs
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('toyota', 'RAV4 XLE', 'RAV4 XLE 2024', 'Popular compact SUV', '{"year": 2024, "engine": "2.5L 4-Cylinder", "horsepower": 203, "transmission": "8-Speed Auto", "fuel_type": "Gasoline", "awd": true, "mpg_city": 27, "mpg_highway": 35}'),
  ('honda', 'CR-V Touring', 'CR-V Touring 2024', 'Family-friendly SUV', '{"year": 2024, "engine": "1.5L Turbo", "horsepower": 190, "transmission": "CVT", "fuel_type": "Gasoline", "awd": true, "mpg_city": 28, "mpg_highway": 34}'),
  ('bmw', 'X5 xDrive40i', 'X5 40i 2024', 'Luxury mid-size SUV', '{"year": 2024, "engine": "3.0L Turbo I6", "horsepower": 335, "transmission": "8-Speed Auto", "fuel_type": "Gasoline", "awd": true, "mpg_city": 21, "mpg_highway": 26}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'suv' AND sc.cat_slug = 'cars'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- Electric Cars
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('tesla', 'Model 3 Long Range', 'Model 3 LR 2024', 'Popular electric sedan', '{"year": 2024, "motor": "Dual Motor AWD", "horsepower": 346, "range_miles": 333, "battery_kwh": 82, "charging": "Supercharger V3", "acceleration_0_60": 4.2}'),
  ('tesla', 'Model Y Performance', 'Model Y Perf 2024', 'Electric crossover', '{"year": 2024, "motor": "Dual Motor AWD", "horsepower": 456, "range_miles": 303, "battery_kwh": 82, "charging": "Supercharger V3", "acceleration_0_60": 3.5}'),
  ('tesla', 'Model S Plaid', 'Model S Plaid 2024', 'Flagship electric sedan', '{"year": 2024, "motor": "Tri Motor AWD", "horsepower": 1020, "range_miles": 396, "battery_kwh": 100, "charging": "Supercharger V3", "acceleration_0_60": 1.99}'),
  ('bmw', 'i4 M50', 'i4 M50 2024', 'Electric sport sedan', '{"year": 2024, "motor": "Dual Motor AWD", "horsepower": 536, "range_miles": 271, "battery_kwh": 83.9, "charging": "DC Fast Charging", "acceleration_0_60": 3.7}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'electric' AND sc.cat_slug = 'cars'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- BIKES / MOTORCYCLES (Automobile > Bikes/Motorcycles > Various)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('harley-davidson', 'Street Glide', 'Street Glide 2024', 'Iconic touring cruiser', '{"year": 2024, "engine": "Milwaukee-Eight 114", "displacement_cc": 1868, "horsepower": 93, "fuel_capacity_liters": 22.7}'),
  ('kawasaki', 'Ninja ZX-10R', 'ZX-10R 2024', 'Superbike racer', '{"year": 2024, "engine": "Inline-4", "displacement_cc": 998, "horsepower": 203, "top_speed_mph": 186}'),
  ('ducati', 'Panigale V4', 'Panigale V4 2024', 'Italian superbike', '{"year": 2024, "engine": "Desmosedici Stradale V4", "displacement_cc": 1103, "horsepower": 215.5, "weight_kg": 175}'),
  ('honda', 'CBR650R', 'CBR650R 2024', 'Sport bike for everyday', '{"year": 2024, "engine": "Inline-4", "displacement_cc": 649, "horsepower": 94, "weight_kg": 208}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'sports' AND sc.cat_slug = 'bikes-motorcycles'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- SCOOTERS (Automobile > Scooters > Various)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('vespa', 'GTS 300', 'GTS 300 2024', 'Classic Italian scooter', '{"year": 2024, "engine": "Single Cylinder", "displacement_cc": 278, "horsepower": 23.8, "top_speed_kmh": 130}'),
  ('vespa', 'Primavera 150', 'Primavera 150', 'Urban commuter scooter', '{"year": 2024, "engine": "Single Cylinder", "displacement_cc": 155, "horsepower": 12.7, "fuel_economy_kmpl": 40}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'petrol' AND sc.cat_slug = 'scooters'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- Electric Scooters
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('ola', 'S1 Pro', 'S1 Pro 2024', 'Smart electric scooter', '{"year": 2024, "motor_power_kw": 8.5, "range_km": 181, "top_speed_kmh": 116, "battery_kwh": 3.97, "charging_time_hours": 6.5}'),
  ('ola', 'S1 Air', 'S1 Air 2024', 'Affordable electric scooter', '{"year": 2024, "motor_power_kw": 4.5, "range_km": 101, "top_speed_kmh": 85, "battery_kwh": 2.5, "charging_time_hours": 5}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'electric' AND sc.cat_slug = 'scooters'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- TRUCKS (Automobile > Trucks > Light Truck)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('ford', 'F-150 XLT', 'F-150 XLT 2024', 'Best-selling pickup truck', '{"year": 2024, "engine": "3.5L EcoBoost V6", "horsepower": 400, "towing_capacity_lbs": 13000, "payload_lbs": 2455, "bed_length_ft": 6.5}'),
  ('chevrolet', 'Silverado 1500 LT', 'Silverado LT 2024', 'Full-size pickup', '{"year": 2024, "engine": "5.3L V8", "horsepower": 355, "towing_capacity_lbs": 11500, "payload_lbs": 2280, "bed_length_ft": 6.7}'),
  ('toyota', 'Tundra SR5', 'Tundra SR5 2024', 'Reliable full-size truck', '{"year": 2024, "engine": "3.5L Twin-Turbo V6", "horsepower": 389, "towing_capacity_lbs": 12000, "payload_lbs": 1940, "bed_length_ft": 6.5}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'light-truck' AND sc.cat_slug = 'trucks'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- CARAVANS / CAMPERS (Automobile > Caravans/Campers > Motorhome)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  sc.barter_type_id,
  sc.category_id,
  sc.subcategory_id,
  b.brand_id,
  p.title,
  p.model,
  p.description,
  p.product_info::jsonb,
  true
FROM (VALUES
  ('airstream', 'Classic 33FB', 'Classic 33FB 2024', 'Iconic luxury travel trailer', '{"year": 2024, "length_ft": 33, "sleeps": 5, "fresh_water_gal": 54, "holding_tanks_gal": 78, "weight_lbs": 9170}'),
  ('winnebago', 'View 24D', 'View 24D 2024', 'Compact Class C motorhome', '{"year": 2024, "length_ft": 25, "sleeps": 4, "engine": "Mercedes-Benz Diesel", "fresh_water_gal": 30, "weight_lbs": 11500}')
) AS p(brand_slug, title, model, description, product_info)
JOIN subcats sc ON sc.subcat_slug = 'motorhome' AND sc.cat_slug = 'caravans-campers'
JOIN brands b ON b.brand_slug = p.brand_slug
ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================
-- Summary
-- =============================================
-- This script inserted:
-- - 80 unique brands
-- - 143 products across multiple categories:
--   * 26 Phones
--   * 28 Laptops  
--   * 14 Audio devices
--   * 12 Cameras
--   * 11 Gaming Consoles
--   * 10 Home & Furniture items
--   * 6 Appliances
--   * 6 Fashion items
--   * 6 Baby & Kids items
--   * 5 Sports equipment
--   * 4 Power Tools
--   * 2 Collectibles
--   * 4 Musical Instruments
--   * 11 Cars (Sedan, SUV, Electric)
--   * 4 Motorcycles
--   * 4 Scooters
--   * 3 Trucks
--   * 2 Caravans/Campers
-- =============================================
