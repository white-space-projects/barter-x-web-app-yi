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
-- Each category uses direct JOINs
-- =============================================

-- PHONES (27 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('apple', 'iPhone 15 Pro Max', 'iPhone 15 Pro Max', 'Latest flagship with A17 Pro chip and titanium design', '{"released_year": 2023, "processor": "A17 Pro", "screen_size_inches": 6.7, "rear_cameras": "Triple 48MP", "camera_layout": "Square", "notch_type": "Dynamic Island", "edge_type": "Rounded", "rear_material": "Titanium", "biometric": "Face ID", "port_type": "USB-C", "dimensions": "159.9 x 76.7 x 8.25 mm", "weight_grams": 221}'),
  ('apple', 'iPhone 15 Pro', 'iPhone 15 Pro', 'Pro model with A17 Pro chip', '{"released_year": 2023, "processor": "A17 Pro", "screen_size_inches": 6.1, "rear_cameras": "Triple 48MP", "camera_layout": "Square", "notch_type": "Dynamic Island", "edge_type": "Rounded", "rear_material": "Titanium", "biometric": "Face ID", "port_type": "USB-C", "dimensions": "146.6 x 70.6 x 8.25 mm", "weight_grams": 187}'),
  ('apple', 'iPhone 15', 'iPhone 15', 'Standard model with A16 chip and Dynamic Island', '{"released_year": 2023, "processor": "A16 Bionic", "screen_size_inches": 6.1, "rear_cameras": "Dual 48MP", "camera_layout": "Diagonal", "notch_type": "Dynamic Island", "edge_type": "Rounded", "rear_material": "Glass", "biometric": "Face ID", "port_type": "USB-C", "dimensions": "147.6 x 71.6 x 7.8 mm", "weight_grams": 171}'),
  ('apple', 'iPhone 14 Pro Max', 'iPhone 14 Pro Max', 'Previous gen flagship with A16 chip', '{"released_year": 2022, "processor": "A16 Bionic", "screen_size_inches": 6.7, "rear_cameras": "Triple 48MP", "camera_layout": "Square", "notch_type": "Dynamic Island", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Face ID", "port_type": "Lightning", "dimensions": "160.7 x 77.6 x 7.85 mm", "weight_grams": 240}'),
  ('apple', 'iPhone 14', 'iPhone 14', 'Standard model with A15 chip', '{"released_year": 2022, "processor": "A15 Bionic", "screen_size_inches": 6.1, "rear_cameras": "Dual 12MP", "camera_layout": "Diagonal", "notch_type": "Notch", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Face ID", "port_type": "Lightning", "dimensions": "146.7 x 71.5 x 7.8 mm", "weight_grams": 172}'),
  ('apple', 'iPhone 13 Pro', 'iPhone 13 Pro', 'Pro model with A15 chip and ProMotion', '{"released_year": 2021, "processor": "A15 Bionic", "screen_size_inches": 6.1, "rear_cameras": "Triple 12MP", "camera_layout": "Square", "notch_type": "Notch", "edge_type": "Flat", "rear_material": "Matte Glass", "biometric": "Face ID", "port_type": "Lightning", "dimensions": "146.7 x 71.5 x 7.65 mm", "weight_grams": 204}'),
  ('apple', 'iPhone 13', 'iPhone 13', 'Standard model with A15 chip', '{"released_year": 2021, "processor": "A15 Bionic", "screen_size_inches": 6.1, "rear_cameras": "Dual 12MP", "camera_layout": "Diagonal", "notch_type": "Notch", "edge_type": "Flat", "rear_material": "Glass", "biometric": "Face ID", "port_type": "Lightning", "dimensions": "146.7 x 71.5 x 7.65 mm", "weight_grams": 174}'),
  ('apple', 'iPhone SE (3rd gen)', 'iPhone SE 3rd gen', 'Budget model with A15 chip and Touch ID', '{"released_year": 2022, "processor": "A15 Bionic", "screen_size_inches": 4.7, "rear_cameras": "Single 12MP", "camera_layout": "Single", "notch_type": "None", "edge_type": "Rounded", "rear_material": "Glass", "biometric": "Touch ID", "port_type": "Lightning", "dimensions": "138.4 x 67.3 x 7.3 mm", "weight_grams": 144}'),
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
JOIN application.subcategories s ON s.slug = 'phones'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'electronics'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- LAPTOPS (20 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
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
  ('acer', 'Swift Go 14', 'Swift Go 14 2024', 'AI-powered ultrabook', '{"released_year": 2024, "processor": "Intel Core Ultra 7", "ram_gb": 16, "storage_gb": 512, "screen_size_inches": 14, "display_type": "2.8K OLED", "gpu": "Intel Arc", "battery_hours": 12, "weight_kg": 1.25}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'laptops'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'electronics'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- AUDIO / HEADPHONES (10 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('sony', 'Sony WH-1000XM5', 'WH-1000XM5', 'Industry-leading noise cancellation', '{"released_year": 2022, "type": "Over-Ear", "driver_size_mm": 30, "noise_cancelling": true, "battery_hours": 30, "connectivity": "Bluetooth 5.2", "weight_grams": 250}'),
  ('sony', 'Sony WH-1000XM4', 'WH-1000XM4', 'Previous gen premium ANC', '{"released_year": 2020, "type": "Over-Ear", "driver_size_mm": 40, "noise_cancelling": true, "battery_hours": 30, "connectivity": "Bluetooth 5.0", "weight_grams": 254}'),
  ('apple', 'AirPods Max', 'AirPods Max', 'Premium Apple over-ear headphones', '{"released_year": 2020, "type": "Over-Ear", "driver_size_mm": 40, "noise_cancelling": true, "battery_hours": 20, "connectivity": "Bluetooth 5.0", "weight_grams": 384}'),
  ('apple', 'AirPods Pro (2nd gen)', 'AirPods Pro 2nd gen', 'Best ANC earbuds for Apple', '{"released_year": 2022, "type": "In-Ear TWS", "driver_size_mm": 11, "noise_cancelling": true, "battery_hours": 6, "connectivity": "Bluetooth 5.3", "weight_grams": 5.3}'),
  ('bose', 'QuietComfort Ultra', 'QuietComfort Ultra', 'Premium comfort and sound', '{"released_year": 2023, "type": "Over-Ear", "driver_size_mm": 35, "noise_cancelling": true, "battery_hours": 24, "connectivity": "Bluetooth 5.3", "weight_grams": 250}'),
  ('bose', 'QuietComfort 45', 'QuietComfort 45', 'Classic ANC headphones', '{"released_year": 2021, "type": "Over-Ear", "driver_size_mm": 35, "noise_cancelling": true, "battery_hours": 24, "connectivity": "Bluetooth 5.1", "weight_grams": 240}'),
  ('sennheiser', 'Momentum 4 Wireless', 'Momentum 4 Wireless', 'Audiophile wireless headphones', '{"released_year": 2022, "type": "Over-Ear", "driver_size_mm": 42, "noise_cancelling": true, "battery_hours": 60, "connectivity": "Bluetooth 5.2", "weight_grams": 293}'),
  ('jbl', 'JBL Tour One M2', 'Tour One M2', 'Pro-tuned ANC headphones', '{"released_year": 2023, "type": "Over-Ear", "driver_size_mm": 40, "noise_cancelling": true, "battery_hours": 50, "connectivity": "Bluetooth 5.3", "weight_grams": 268}'),
  ('audio-technica', 'ATH-M50xBT2', 'ATH-M50xBT2', 'Studio monitor quality wireless', '{"released_year": 2022, "type": "Over-Ear", "driver_size_mm": 45, "noise_cancelling": false, "battery_hours": 50, "connectivity": "Bluetooth 5.0", "weight_grams": 307}'),
  ('beats', 'Beats Studio Pro', 'Beats Studio Pro', 'Apple ecosystem premium headphones', '{"released_year": 2023, "type": "Over-Ear", "driver_size_mm": 40, "noise_cancelling": true, "battery_hours": 40, "connectivity": "Bluetooth 5.3", "weight_grams": 260}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'audio-headphones-speakers'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'electronics'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- CAMERAS (8 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('canon', 'Canon EOS R5', 'EOS R5', 'Professional mirrorless with 8K video', '{"released_year": 2020, "type": "Mirrorless", "sensor": "Full Frame 45MP", "video": "8K RAW", "autofocus_points": 5940, "stabilization": "IBIS 8-stop", "weight_grams": 738}'),
  ('canon', 'Canon EOS R6 Mark II', 'EOS R6 Mark II', 'Versatile full-frame mirrorless', '{"released_year": 2022, "type": "Mirrorless", "sensor": "Full Frame 24.2MP", "video": "4K 60fps", "autofocus_points": 1053, "stabilization": "IBIS 8-stop", "weight_grams": 670}'),
  ('sony', 'Sony A7 IV', 'A7 IV', 'Hybrid photo/video workhorse', '{"released_year": 2021, "type": "Mirrorless", "sensor": "Full Frame 33MP", "video": "4K 60fps", "autofocus_points": 759, "stabilization": "IBIS 5.5-stop", "weight_grams": 658}'),
  ('sony', 'Sony A7R V', 'A7R V', 'High resolution flagship', '{"released_year": 2022, "type": "Mirrorless", "sensor": "Full Frame 61MP", "video": "8K", "autofocus_points": 693, "stabilization": "IBIS 8-stop", "weight_grams": 723}'),
  ('nikon', 'Nikon Z8', 'Z8', 'Compact pro mirrorless', '{"released_year": 2023, "type": "Mirrorless", "sensor": "Full Frame 45.7MP", "video": "8K RAW", "autofocus_points": 493, "stabilization": "IBIS 6-stop", "weight_grams": 910}'),
  ('fujifilm', 'Fujifilm X-T5', 'X-T5', 'Retro-styled APS-C flagship', '{"released_year": 2022, "type": "Mirrorless", "sensor": "APS-C 40.2MP", "video": "6.2K", "autofocus_points": 425, "stabilization": "IBIS 7-stop", "weight_grams": 557}'),
  ('panasonic', 'Panasonic Lumix S5 II', 'Lumix S5 II', 'Video-focused full-frame', '{"released_year": 2023, "type": "Mirrorless", "sensor": "Full Frame 24.2MP", "video": "6K", "autofocus_points": 779, "stabilization": "Dual IS 6.5-stop", "weight_grams": 740}'),
  ('gopro', 'GoPro Hero 12 Black', 'Hero 12 Black', 'Premium action camera', '{"released_year": 2023, "type": "Action Camera", "sensor": "1/1.9 inch 27MP", "video": "5.3K 60fps", "autofocus_points": 0, "stabilization": "HyperSmooth 6.0", "weight_grams": 154}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'cameras'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'electronics'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- GAMING CONSOLES (6 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('sony', 'PlayStation 5', 'PS5 Disc Edition', 'Current gen console with disc drive', '{"released_year": 2020, "storage_gb": 825, "resolution": "4K 120Hz", "ray_tracing": true, "backwards_compatible": true, "weight_kg": 4.5}'),
  ('sony', 'PlayStation 5 Digital Edition', 'PS5 Digital Edition', 'Digital-only PS5', '{"released_year": 2020, "storage_gb": 825, "resolution": "4K 120Hz", "ray_tracing": true, "backwards_compatible": true, "weight_kg": 3.9}'),
  ('sony', 'PlayStation 5 Slim', 'PS5 Slim', 'Smaller form factor PS5', '{"released_year": 2023, "storage_gb": 1000, "resolution": "4K 120Hz", "ray_tracing": true, "backwards_compatible": true, "weight_kg": 3.2}'),
  ('microsoft', 'Xbox Series X', 'Xbox Series X', 'Most powerful Xbox ever', '{"released_year": 2020, "storage_gb": 1000, "resolution": "4K 120Hz", "ray_tracing": true, "backwards_compatible": true, "weight_kg": 4.45}'),
  ('nintendo', 'Nintendo Switch OLED', 'Switch OLED', 'Hybrid console with OLED screen', '{"released_year": 2021, "storage_gb": 64, "resolution": "1080p docked", "ray_tracing": false, "backwards_compatible": true, "weight_kg": 0.42}'),
  ('valve', 'Steam Deck OLED', 'Steam Deck OLED', 'PC gaming handheld', '{"released_year": 2023, "storage_gb": 512, "resolution": "1280x800 90Hz", "ray_tracing": false, "backwards_compatible": true, "weight_kg": 0.64}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'gaming-consoles'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'electronics'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- SOFAS (5 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('ikea', 'IKEA KIVIK', 'KIVIK 3-Seat Sofa', 'Comfortable deep-seated sofa', '{"material": "Fabric", "seats": 3, "width_cm": 228, "depth_cm": 95, "color": "Hillared Beige"}'),
  ('ikea', 'IKEA FRIHETEN', 'FRIHETEN Sleeper Sofa', 'Sofa bed with storage', '{"material": "Fabric", "seats": 3, "width_cm": 225, "depth_cm": 105, "color": "Skiftebo Dark Gray"}'),
  ('ikea', 'IKEA SODERHAMN', 'SODERHAMN 3-Seat', 'Modular low-back sofa', '{"material": "Fabric", "seats": 3, "width_cm": 198, "depth_cm": 99, "color": "Viarp Beige/Brown"}'),
  ('west-elm', 'West Elm Harmony', 'Harmony 82 inch Sofa', 'Modern clean-lined sofa', '{"material": "Performance Velvet", "seats": 3, "width_cm": 208, "depth_cm": 102, "color": "Slate"}'),
  ('ashley', 'Ashley Darcy', 'Darcy Sofa', 'Classic comfortable sofa', '{"material": "Microfiber", "seats": 3, "width_cm": 229, "depth_cm": 99, "color": "Cobblestone"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'sofas'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'home-furniture'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- CHAIRS (5 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('herman-miller', 'Herman Miller Aeron', 'Aeron Chair Size B', 'Iconic ergonomic office chair', '{"material": "Mesh", "adjustable_arms": true, "lumbar_support": true, "max_weight_kg": 136, "warranty_years": 12}'),
  ('herman-miller', 'Herman Miller Embody', 'Embody Chair', 'Health-positive seating', '{"material": "Mesh/Fabric", "adjustable_arms": true, "lumbar_support": true, "max_weight_kg": 136, "warranty_years": 12}'),
  ('steelcase', 'Steelcase Leap', 'Leap V2', 'Adaptive office chair', '{"material": "Fabric", "adjustable_arms": true, "lumbar_support": true, "max_weight_kg": 181, "warranty_years": 12}'),
  ('ikea', 'IKEA MARKUS', 'MARKUS Office Chair', 'Popular budget ergonomic chair', '{"material": "Mesh/Fabric", "adjustable_arms": false, "lumbar_support": true, "max_weight_kg": 110, "warranty_years": 10}'),
  ('razer', 'Razer Iskur V2', 'Iskur V2', 'Gaming chair with lumbar support', '{"material": "Leatherette", "adjustable_arms": true, "lumbar_support": true, "max_weight_kg": 136, "warranty_years": 3}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'chairs'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'home-furniture'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- STORAGE UNITS (3 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('ikea', 'IKEA KALLAX', 'KALLAX 4x4', 'Versatile shelving unit', '{"material": "Particleboard", "shelves": 16, "width_cm": 147, "height_cm": 147, "color": "White"}'),
  ('ikea', 'IKEA BILLY', 'BILLY Bookcase', 'Classic bookcase', '{"material": "Particleboard", "shelves": 5, "width_cm": 80, "height_cm": 202, "color": "White"}'),
  ('ikea', 'IKEA BESTA', 'BESTA Storage Combo', 'Modular storage system', '{"material": "Particleboard", "shelves": 6, "width_cm": 180, "height_cm": 128, "color": "White/Oak"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'storage-units'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'home-furniture'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- REFRIGERATORS (4 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('samsung', 'Samsung Family Hub', 'RF28T5F01SR', 'Smart refrigerator with screen', '{"capacity_liters": 790, "type": "French Door", "energy_rating": "A++", "smart_features": true, "ice_maker": true}'),
  ('lg', 'LG InstaView', 'LRMVS3006S', 'See-through door fridge', '{"capacity_liters": 850, "type": "Side by Side", "energy_rating": "A+", "smart_features": true, "ice_maker": true}'),
  ('whirlpool', 'Whirlpool French Door', 'WRF555SDFZ', 'Reliable family refrigerator', '{"capacity_liters": 708, "type": "French Door", "energy_rating": "A+", "smart_features": false, "ice_maker": true}'),
  ('bosch', 'Bosch Serie 6', 'KGN39AIAT', 'European-style bottom freezer', '{"capacity_liters": 366, "type": "Bottom Freezer", "energy_rating": "A+++", "smart_features": false, "ice_maker": false}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'refrigerators'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'appliances'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- WASHING MACHINES (4 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('lg', 'LG TurboWash 360', 'WM4000HWA', 'Fast and efficient front loader', '{"capacity_kg": 12, "type": "Front Load", "energy_rating": "A+++", "smart_features": true, "steam_function": true}'),
  ('samsung', 'Samsung FlexWash', 'WV60M9900AV', 'Dual washer system', '{"capacity_kg": 15, "type": "Front Load", "energy_rating": "A++", "smart_features": true, "steam_function": true}'),
  ('bosch', 'Bosch Serie 8', 'WAX32GH4GB', 'German engineering washer', '{"capacity_kg": 10, "type": "Front Load", "energy_rating": "A+++", "smart_features": true, "steam_function": true}'),
  ('whirlpool', 'Whirlpool Supreme Care', 'FSCR12441', 'Large capacity washer', '{"capacity_kg": 12, "type": "Front Load", "energy_rating": "A+++", "smart_features": false, "steam_function": true}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'washing-machines'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'appliances'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- KITCHEN APPLIANCES (5 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('kitchenaid', 'KitchenAid Artisan', 'KSM150PS', 'Iconic stand mixer', '{"type": "Stand Mixer", "power_watts": 300, "bowl_capacity_liters": 4.8, "colors_available": 20, "attachments_included": 3}'),
  ('dyson', 'Dyson V15 Detect', 'V15 Detect Absolute', 'Laser-equipped cordless vacuum', '{"type": "Cordless Vacuum", "power_watts": 240, "battery_minutes": 60, "bin_capacity_liters": 0.76, "weight_kg": 3.1}'),
  ('dyson', 'Dyson Purifier Hot+Cool', 'HP07', 'Air purifier with heating/cooling', '{"type": "Air Purifier", "power_watts": 2000, "room_coverage_sqm": 46, "hepa_filter": true, "smart_features": true}'),
  ('instant-pot', 'Instant Pot Duo', 'Duo 7-in-1', 'Multi-use pressure cooker', '{"type": "Pressure Cooker", "power_watts": 1000, "capacity_liters": 5.7, "cooking_programs": 13, "pressure_levels": 2}'),
  ('kitchenaid', 'KitchenAid Food Processor', 'KFP1319', '13-cup food processor', '{"type": "Food Processor", "power_watts": 500, "bowl_capacity_liters": 3.1, "speed_settings": 2, "dishwasher_safe": true}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'kitchen-appliances'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'appliances'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- SHOES (6 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('nike', 'Nike Air Max 90', 'Air Max 90', 'Classic sneaker icon', '{"type": "Sneakers", "material": "Leather/Mesh", "sole": "Air Max", "sizes_available": "36-48", "colorways": 50}'),
  ('nike', 'Nike Air Force 1', 'Air Force 1 07', 'Timeless basketball style', '{"type": "Sneakers", "material": "Leather", "sole": "Air", "sizes_available": "35-52", "colorways": 100}'),
  ('nike', 'Nike Dunk Low', 'Dunk Low Retro', 'Basketball heritage sneaker', '{"type": "Sneakers", "material": "Leather", "sole": "Rubber", "sizes_available": "35-48", "colorways": 80}'),
  ('adidas', 'Adidas Ultraboost', 'Ultraboost 23', 'Premium running shoe', '{"type": "Running", "material": "Primeknit", "sole": "Boost", "sizes_available": "36-48", "colorways": 30}'),
  ('adidas', 'Adidas Stan Smith', 'Stan Smith', 'Classic tennis shoe', '{"type": "Sneakers", "material": "Leather", "sole": "Rubber", "sizes_available": "35-48", "colorways": 25}'),
  ('adidas', 'Adidas Samba', 'Samba OG', 'Indoor football classic', '{"type": "Sneakers", "material": "Leather/Suede", "sole": "Gum Rubber", "sizes_available": "36-48", "colorways": 20}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'shoes'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'fashion-accessories'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- BAGS/HANDBAGS (4 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('gucci', 'Gucci GG Marmont', 'GG Marmont Small', 'Iconic matelasse bag', '{"type": "Shoulder Bag", "material": "Leather", "dimensions_cm": "26x15x7", "strap_type": "Chain", "closure": "Flap"}'),
  ('louis-vuitton', 'Louis Vuitton Neverfull', 'Neverfull MM', 'Classic tote bag', '{"type": "Tote", "material": "Coated Canvas", "dimensions_cm": "31x28x14", "strap_type": "Leather", "closure": "Open Top"}'),
  ('louis-vuitton', 'Louis Vuitton Speedy', 'Speedy 30', 'Iconic doctor bag', '{"type": "Handbag", "material": "Coated Canvas", "dimensions_cm": "30x21x17", "strap_type": "Handles", "closure": "Zipper"}'),
  ('gucci', 'Gucci Dionysus', 'Dionysus Small', 'Statement shoulder bag', '{"type": "Shoulder Bag", "material": "GG Supreme Canvas", "dimensions_cm": "25x14x8", "strap_type": "Chain", "closure": "Clasp"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'bags-handbags'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'fashion-accessories'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- STROLLERS (4 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('uppababy', 'UPPAbaby Vista V2', 'Vista V2', 'Expandable stroller system', '{"type": "Full-Size", "max_weight_kg": 22, "foldable": true, "reversible_seat": true, "car_seat_compatible": true}'),
  ('uppababy', 'UPPAbaby Cruz V2', 'Cruz V2', 'Compact city stroller', '{"type": "Full-Size", "max_weight_kg": 22, "foldable": true, "reversible_seat": true, "car_seat_compatible": true}'),
  ('baby-jogger', 'Baby Jogger City Mini GT2', 'City Mini GT2', 'All-terrain stroller', '{"type": "Full-Size", "max_weight_kg": 29, "foldable": true, "reversible_seat": false, "car_seat_compatible": true}'),
  ('chicco', 'Chicco Bravo Primo', 'Bravo Primo', 'Travel system stroller', '{"type": "Travel System", "max_weight_kg": 22, "foldable": true, "reversible_seat": false, "car_seat_compatible": true}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'strollers'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'baby-kids'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- TOYS (3 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('lego', 'LEGO Star Wars Millennium Falcon', '75375', 'Ultimate Collector Series set', '{"pieces": 7541, "age_range": "18+", "dimensions_cm": "84x56x21", "minifigures": 7}'),
  ('lego', 'LEGO Technic Porsche 911', '42056', 'Detailed Porsche replica', '{"pieces": 2704, "age_range": "16+", "dimensions_cm": "57x25x10", "minifigures": 0}'),
  ('lego', 'LEGO Creator Expert Taj Mahal', '10256', 'Architectural masterpiece', '{"pieces": 5923, "age_range": "16+", "dimensions_cm": "50x50x41", "minifigures": 0}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'toys'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'baby-kids'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- BICYCLES (4 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('trek', 'Trek Domane SL 6', 'Domane SL 6', 'Endurance road bike', '{"type": "Road", "frame_material": "Carbon", "groupset": "Shimano Ultegra", "wheel_size_inches": 28, "weight_kg": 9.2}'),
  ('specialized', 'Specialized Roubaix', 'Roubaix Sport', 'Comfort road bike', '{"type": "Road", "frame_material": "Carbon", "groupset": "Shimano 105", "wheel_size_inches": 28, "weight_kg": 9.5}'),
  ('giant', 'Giant Defy Advanced', 'Defy Advanced 2', 'All-road endurance bike', '{"type": "Road", "frame_material": "Carbon", "groupset": "Shimano 105", "wheel_size_inches": 28, "weight_kg": 9.1}'),
  ('trek', 'Trek Fuel EX', 'Fuel EX 8', 'Trail mountain bike', '{"type": "Mountain", "frame_material": "Carbon/Aluminum", "groupset": "Shimano XT", "wheel_size_inches": 29, "weight_kg": 13.5}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'bicycles-non-motorized'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'sports-outdoors'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- GYM EQUIPMENT (4 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('peloton', 'Peloton Bike+', 'Bike+', 'Interactive spin bike', '{"type": "Spin Bike", "screen_inches": 24, "resistance_levels": 100, "live_classes": true, "weight_kg": 63}'),
  ('peloton', 'Peloton Tread', 'Tread', 'Smart treadmill', '{"type": "Treadmill", "screen_inches": 32, "speed_max_kmh": 20, "incline_max_percent": 12.5, "weight_kg": 132}'),
  ('nordictrack', 'NordicTrack Commercial 2950', 'Commercial 2950', 'Premium treadmill', '{"type": "Treadmill", "screen_inches": 22, "speed_max_kmh": 22, "incline_max_percent": 15, "weight_kg": 147}'),
  ('nordictrack', 'NordicTrack S22i', 'S22i Studio Cycle', 'Interactive bike', '{"type": "Spin Bike", "screen_inches": 22, "resistance_levels": 24, "live_classes": true, "weight_kg": 92}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'gym-equipment'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'sports-outdoors'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- POWER TOOLS (5 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('dewalt', 'DeWalt 20V MAX Drill', 'DCD791D2', 'Brushless compact drill', '{"type": "Drill", "voltage": 20, "battery_type": "Li-Ion", "max_rpm": 2000, "brushless": true}'),
  ('dewalt', 'DeWalt 20V MAX Impact Driver', 'DCF887D2', 'High torque impact driver', '{"type": "Impact Driver", "voltage": 20, "battery_type": "Li-Ion", "max_rpm": 3250, "brushless": true}'),
  ('makita', 'Makita 18V LXT Drill', 'XFD131', 'Compact brushless drill', '{"type": "Drill", "voltage": 18, "battery_type": "Li-Ion", "max_rpm": 2000, "brushless": true}'),
  ('milwaukee', 'Milwaukee M18 FUEL Hammer Drill', '2804-22', 'Most powerful compact drill', '{"type": "Hammer Drill", "voltage": 18, "battery_type": "Li-Ion", "max_rpm": 2000, "brushless": true}'),
  ('black-decker', 'Black+Decker 20V MAX Drill', 'LDX120C', 'Budget-friendly drill', '{"type": "Drill", "voltage": 20, "battery_type": "Li-Ion", "max_rpm": 650, "brushless": false}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'power-tools'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'tools-equipment'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- GARDENING TOOLS (3 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('husqvarna', 'Husqvarna Automower 450X', '450X', 'Premium robotic mower', '{"type": "Robotic Mower", "cutting_width_cm": 24, "area_capacity_sqm": 5000, "gps_navigation": true, "battery_type": "Li-Ion"}'),
  ('husqvarna', 'Husqvarna 520iLX', '520iLX', 'Professional trimmer', '{"type": "String Trimmer", "cutting_width_cm": 40, "power_type": "Battery", "weight_kg": 4.3, "battery_type": "Li-Ion"}'),
  ('bosch', 'Bosch Indego S+ 500', 'Indego S+ 500', 'Smart robotic mower', '{"type": "Robotic Mower", "cutting_width_cm": 19, "area_capacity_sqm": 500, "gps_navigation": false, "battery_type": "Li-Ion"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'gardening-tools'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'tools-equipment'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- BOARD GAMES (3 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('hasbro', 'Monopoly Classic', 'Monopoly', 'Classic property trading game', '{"players": "2-8", "play_time_minutes": 180, "age_range": "8+", "category": "Strategy"}'),
  ('hasbro', 'Scrabble Deluxe', 'Scrabble Deluxe', 'Word game with turntable', '{"players": "2-4", "play_time_minutes": 90, "age_range": "10+", "category": "Word"}'),
  ('hasbro', 'Risk Classic', 'Risk', 'World domination strategy game', '{"players": "2-6", "play_time_minutes": 240, "age_range": "10+", "category": "Strategy"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'board-games'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'books-media-collectibles'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- COLLECTIBLES (3 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('funko', 'Funko Pop Star Wars Darth Vader', '01', 'Classic Darth Vader Pop', '{"series": "Star Wars", "number": 1, "exclusive": false, "size_inches": 4, "year": 2011}'),
  ('funko', 'Funko Pop Marvel Iron Man', '04', 'Original Iron Man Pop', '{"series": "Marvel", "number": 4, "exclusive": false, "size_inches": 4, "year": 2011}'),
  ('funko', 'Funko Pop Harry Potter', '01', 'Harry Potter with wand', '{"series": "Harry Potter", "number": 1, "exclusive": false, "size_inches": 4, "year": 2015}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'collectibles'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'books-media-collectibles'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- MUSICAL INSTRUMENTS (6 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('fender', 'Fender Stratocaster', 'Player Stratocaster', 'Classic electric guitar', '{"type": "Electric Guitar", "body": "Alder", "neck": "Maple", "pickups": "3 Single-Coil", "frets": 22}'),
  ('fender', 'Fender Telecaster', 'Player Telecaster', 'Iconic twang guitar', '{"type": "Electric Guitar", "body": "Alder", "neck": "Maple", "pickups": "2 Single-Coil", "frets": 22}'),
  ('gibson', 'Gibson Les Paul Standard', 'Les Paul Standard 50s', 'Rock legend guitar', '{"type": "Electric Guitar", "body": "Mahogany", "neck": "Mahogany", "pickups": "2 Humbucker", "frets": 22}'),
  ('yamaha', 'Yamaha FG800', 'FG800', 'Entry-level acoustic', '{"type": "Acoustic Guitar", "body": "Spruce/Nato", "neck": "Nato", "pickups": "None", "frets": 20}'),
  ('roland', 'Roland TD-17KVX', 'TD-17KVX', 'Electronic drum kit', '{"type": "Electronic Drums", "pads": 8, "cymbals": 4, "module": "TD-17", "bluetooth": true}'),
  ('yamaha', 'Yamaha P-125', 'P-125', 'Digital piano', '{"type": "Digital Piano", "keys": 88, "weighted_keys": true, "polyphony": 192, "speakers": "Built-in"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'musical-instruments'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'hobby-creative'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- =============================================
-- AUTOMOBILE BARTER PRODUCTS
-- =============================================

-- SEDAN (4 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('toyota', 'Toyota Camry', 'Camry XLE', 'Best-selling midsize sedan', '{"year": 2024, "engine": "2.5L 4-Cyl", "horsepower": 203, "transmission": "8-Speed Auto", "fuel_type": "Gasoline", "mpg_combined": 32}'),
  ('honda', 'Honda Accord', 'Accord Touring', 'Refined sports sedan', '{"year": 2024, "engine": "2.0L Turbo", "horsepower": 252, "transmission": "10-Speed Auto", "fuel_type": "Gasoline", "mpg_combined": 31}'),
  ('bmw', 'BMW 3 Series', '330i xDrive', 'Ultimate driving machine', '{"year": 2024, "engine": "2.0L Turbo", "horsepower": 255, "transmission": "8-Speed Auto", "fuel_type": "Gasoline", "mpg_combined": 30}'),
  ('mercedes-benz', 'Mercedes-Benz C-Class', 'C 300', 'Luxury compact sedan', '{"year": 2024, "engine": "2.0L Turbo", "horsepower": 255, "transmission": "9G-Tronic", "fuel_type": "Gasoline", "mpg_combined": 29}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'sedan'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'cars'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- SUV (4 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('toyota', 'Toyota RAV4', 'RAV4 Prime', 'Best-selling compact SUV', '{"year": 2024, "engine": "2.5L Hybrid", "horsepower": 302, "transmission": "CVT", "fuel_type": "Plug-in Hybrid", "mpg_combined": 94}'),
  ('honda', 'Honda CR-V', 'CR-V Touring', 'Versatile family SUV', '{"year": 2024, "engine": "1.5L Turbo", "horsepower": 190, "transmission": "CVT", "fuel_type": "Gasoline", "mpg_combined": 30}'),
  ('bmw', 'BMW X5', 'X5 xDrive40i', 'Luxury midsize SUV', '{"year": 2024, "engine": "3.0L Turbo I6", "horsepower": 335, "transmission": "8-Speed Auto", "fuel_type": "Gasoline", "mpg_combined": 24}'),
  ('mercedes-benz', 'Mercedes-Benz GLE', 'GLE 450', 'Premium SUV', '{"year": 2024, "engine": "3.0L Turbo I6", "horsepower": 362, "transmission": "9G-Tronic", "fuel_type": "Mild Hybrid", "mpg_combined": 23}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'suv'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'cars'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- ELECTRIC CARS (4 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('tesla', 'Tesla Model 3', 'Model 3 Long Range', 'Best-selling electric sedan', '{"year": 2024, "motor": "Dual Motor AWD", "horsepower": 366, "range_miles": 333, "battery_kwh": 82, "zero_to_60_sec": 4.2}'),
  ('tesla', 'Tesla Model Y', 'Model Y Performance', 'Electric crossover SUV', '{"year": 2024, "motor": "Dual Motor AWD", "horsepower": 456, "range_miles": 303, "battery_kwh": 82, "zero_to_60_sec": 3.5}'),
  ('tesla', 'Tesla Model S', 'Model S Plaid', 'Premium electric sedan', '{"year": 2024, "motor": "Tri Motor AWD", "horsepower": 1020, "range_miles": 348, "battery_kwh": 100, "zero_to_60_sec": 1.99}'),
  ('bmw', 'BMW iX', 'iX xDrive50', 'Luxury electric SUV', '{"year": 2024, "motor": "Dual Motor AWD", "horsepower": 516, "range_miles": 324, "battery_kwh": 111.5, "zero_to_60_sec": 4.4}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'electric'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'cars'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- SPORTS MOTORCYCLES (4 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('kawasaki', 'Kawasaki Ninja ZX-10R', 'Ninja ZX-10R', 'Superbike champion', '{"year": 2024, "engine_cc": 998, "horsepower": 203, "transmission": "6-Speed", "weight_kg": 207, "top_speed_kmh": 299}'),
  ('ducati', 'Ducati Panigale V4', 'Panigale V4 S', 'Italian superbike', '{"year": 2024, "engine_cc": 1103, "horsepower": 214, "transmission": "6-Speed", "weight_kg": 195, "top_speed_kmh": 305}'),
  ('yamaha', 'Yamaha YZF-R1', 'YZF-R1M', 'MotoGP-derived superbike', '{"year": 2024, "engine_cc": 998, "horsepower": 200, "transmission": "6-Speed", "weight_kg": 201, "top_speed_kmh": 299}'),
  ('honda', 'Honda CBR1000RR-R', 'CBR1000RR-R Fireblade SP', 'Ultimate Honda superbike', '{"year": 2024, "engine_cc": 999, "horsepower": 217, "transmission": "6-Speed", "weight_kg": 201, "top_speed_kmh": 299}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'sports'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'bikes-motorcycles'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- CRUISER MOTORCYCLES (3 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('harley-davidson', 'Harley-Davidson Fat Boy', 'Fat Boy 114', 'Iconic cruiser', '{"year": 2024, "engine_cc": 1868, "horsepower": 90, "transmission": "6-Speed", "weight_kg": 317, "seat_height_mm": 675}'),
  ('harley-davidson', 'Harley-Davidson Street Glide', 'Street Glide Special', 'Touring cruiser', '{"year": 2024, "engine_cc": 1868, "horsepower": 90, "transmission": "6-Speed", "weight_kg": 379, "seat_height_mm": 695}'),
  ('honda', 'Honda Rebel 1100', 'Rebel 1100 DCT', 'Modern cruiser', '{"year": 2024, "engine_cc": 1084, "horsepower": 87, "transmission": "DCT 6-Speed", "weight_kg": 233, "seat_height_mm": 700}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'cruiser'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'bikes-motorcycles'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- ELECTRIC SCOOTERS (3 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('vespa', 'Vespa Elettrica', 'Elettrica 70', 'Classic electric scooter', '{"year": 2024, "motor_kw": 4, "range_km": 100, "top_speed_kmh": 70, "charge_hours": 4, "weight_kg": 130}'),
  ('ola', 'Ola S1 Pro', 'S1 Pro', 'Smart electric scooter', '{"year": 2024, "motor_kw": 8.5, "range_km": 181, "top_speed_kmh": 116, "charge_hours": 6.5, "weight_kg": 125}'),
  ('ola', 'Ola S1 Air', 'S1 Air', 'Affordable electric scooter', '{"year": 2024, "motor_kw": 4.5, "range_km": 101, "top_speed_kmh": 85, "charge_hours": 5, "weight_kg": 99}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'electric-scooter'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'scooters'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- LIGHT TRUCKS (3 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('ford', 'Ford F-150', 'F-150 Lariat', 'Best-selling pickup truck', '{"year": 2024, "engine": "3.5L EcoBoost V6", "horsepower": 400, "towing_capacity_kg": 6350, "payload_capacity_kg": 1450, "bed_length_feet": 5.5}'),
  ('chevrolet', 'Chevrolet Silverado', 'Silverado 1500 LTZ', 'Full-size pickup', '{"year": 2024, "engine": "5.3L V8", "horsepower": 355, "towing_capacity_kg": 5170, "payload_capacity_kg": 900, "bed_length_feet": 5.75}'),
  ('toyota', 'Toyota Tundra', 'Tundra Limited', 'Full-size truck', '{"year": 2024, "engine": "3.5L Twin-Turbo V6", "horsepower": 389, "towing_capacity_kg": 5440, "payload_capacity_kg": 880, "bed_length_feet": 6.5}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'light-truck'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'trucks'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

-- MOTORHOMES / CAMPERS (3 products)
INSERT INTO application.products (barter_type_id, category_id, subcategory_id, brand_id, title, model, description, product_info, is_active)
SELECT 
  bt.barter_type_id, c.category_id, s.subcategory_id, b.brand_id,
  p.title, p.model, p.description, p.product_info::jsonb, true
FROM (VALUES
  ('airstream', 'Airstream Classic', 'Classic 33FB', 'Iconic aluminum travel trailer', '{"year": 2024, "length_feet": 33, "sleeps": 5, "fresh_water_gallons": 54, "dry_weight_kg": 4127, "type": "Travel Trailer"}'),
  ('airstream', 'Airstream Basecamp', 'Basecamp 20X', 'Adventure-ready trailer', '{"year": 2024, "length_feet": 20, "sleeps": 2, "fresh_water_gallons": 24, "dry_weight_kg": 1542, "type": "Travel Trailer"}'),
  ('winnebago', 'Winnebago View', 'View 24J', 'Compact Class C motorhome', '{"year": 2024, "length_feet": 25, "sleeps": 4, "fresh_water_gallons": 32, "dry_weight_kg": 4672, "type": "Class C Motorhome"}')
) AS p(brand_slug, title, model, description, product_info)
JOIN application.subcategories s ON s.slug = 'motorhome'
JOIN application.categories c ON s.category_id = c.category_id AND c.slug = 'caravans-campers'
JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
JOIN application.brands b ON b.slug = p.brand_slug
ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================
-- SUMMARY:
-- Brands inserted: 80
-- Products inserted: 143 total
--   - Phones: 27
--   - Laptops: 20
--   - Audio: 10
--   - Cameras: 8
--   - Gaming Consoles: 6
--   - Sofas: 5
--   - Chairs: 5
--   - Storage Units: 3
--   - Refrigerators: 4
--   - Washing Machines: 4
--   - Kitchen Appliances: 5
--   - Shoes: 6
--   - Bags: 4
--   - Strollers: 4
--   - Toys: 3
--   - Bicycles: 4
--   - Gym Equipment: 4
--   - Power Tools: 5
--   - Gardening Tools: 3
--   - Board Games: 3
--   - Collectibles: 3
--   - Musical Instruments: 6
--   - Cars (Sedan): 4
--   - Cars (SUV): 4
--   - Cars (Electric): 4
--   - Motorcycles (Sports): 4
--   - Motorcycles (Cruiser): 3
--   - Scooters (Electric): 3
--   - Trucks (Light): 3
--   - Campers/Motorhomes: 3
-- =============================================
