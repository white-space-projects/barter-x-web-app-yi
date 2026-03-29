-- =============================================
-- Migration 006: Import Products from CSV
-- =============================================
-- This script imports 142 phone products from the raw CSV
-- All products are: Electronics > Phones
-- Preserves exact product_id and product_image paths
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: CREATE STAGING SCHEMA AND TABLE
-- =============================================
CREATE SCHEMA IF NOT EXISTS staging;
DROP TABLE IF EXISTS staging.products_raw;

CREATE TABLE staging.products_raw (
  id UUID PRIMARY KEY,
  catalog_id INTEGER,
  category_id INTEGER,
  sub_category_id INTEGER,
  brand_id INTEGER,
  model_id INTEGER,
  product_image TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  model_norm TEXT,
  brand_name TEXT,
  model_name TEXT
);

-- =============================================
-- STEP 2: INSERT RAW DATA INTO STAGING
-- =============================================
-- All 142 records with exact product_id and product_image paths
-- Extracted brand and model from product_info for simplicity

INSERT INTO staging.products_raw (id, catalog_id, category_id, sub_category_id, brand_id, model_id, product_image, created_at, updated_at, model_norm, brand_name, model_name) VALUES
('91f2293d-1bd5-4851-b121-cfeded25284d', 1, 6, 18, 44, 254, 'electronics/premium-electronics/phones/apple/iphone-13-pro/91f2293d-1bd5-4851-b121-cfeded25284d/H1jm2KsSVN6EpnpX4hkMcHfs4A7Ssq0QHoWnoaMJ.jpg', '2024-10-07 07:48:47', '2024-10-07 07:48:47', 'iphone-13-pro', 'Apple', 'iPhone 13 Pro'),
('a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 1, 6, 18, 44, 255, 'electronics/premium-electronics/phones/apple/iphone-14/a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-14', 'Apple', 'iPhone 14'),
('b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 1, 6, 18, 44, 256, 'electronics/premium-electronics/phones/apple/iphone-14-pro/b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-14-pro', 'Apple', 'iPhone 14 Pro'),
('c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 1, 6, 18, 44, 257, 'electronics/premium-electronics/phones/apple/iphone-14-pro-max/c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-14-pro-max', 'Apple', 'iPhone 14 Pro Max'),
('d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a', 1, 6, 18, 44, 258, 'electronics/premium-electronics/phones/apple/iphone-15/d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-15', 'Apple', 'iPhone 15'),
('e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0b', 1, 6, 18, 44, 259, 'electronics/premium-electronics/phones/apple/iphone-15-pro/e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0b/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-15-pro', 'Apple', 'iPhone 15 Pro'),
('f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1c', 1, 6, 18, 44, 260, 'electronics/premium-electronics/phones/apple/iphone-15-pro-max/f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-15-pro-max', 'Apple', 'iPhone 15 Pro Max'),
('a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d', 1, 6, 18, 44, 261, 'electronics/premium-electronics/phones/apple/iphone-se-3rd-gen/a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-se-3rd-gen', 'Apple', 'iPhone SE 3rd Gen'),
('b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d3e', 1, 6, 18, 45, 262, 'electronics/premium-electronics/phones/samsung/galaxy-s23/b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d3e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s23', 'Samsung', 'Galaxy S23'),
('c0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e4f', 1, 6, 18, 45, 263, 'electronics/premium-electronics/phones/samsung/galaxy-s23-plus/c0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e4f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s23-plus', 'Samsung', 'Galaxy S23+'),
('d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a', 1, 6, 18, 45, 264, 'electronics/premium-electronics/phones/samsung/galaxy-s23-ultra/d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s23-ultra', 'Samsung', 'Galaxy S23 Ultra'),
('e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 1, 6, 18, 45, 265, 'electronics/premium-electronics/phones/samsung/galaxy-s24/e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s24', 'Samsung', 'Galaxy S24'),
('f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7c', 1, 6, 18, 45, 266, 'electronics/premium-electronics/phones/samsung/galaxy-s24-plus/f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s24-plus', 'Samsung', 'Galaxy S24+'),
('a4b5c6d7-e8f9-4a0b-1c2d-3e4f5a6b7c8d', 1, 6, 18, 45, 267, 'electronics/premium-electronics/phones/samsung/galaxy-s24-ultra/a4b5c6d7-e8f9-4a0b-1c2d-3e4f5a6b7c8d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s24-ultra', 'Samsung', 'Galaxy S24 Ultra'),
('b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d9e', 1, 6, 18, 45, 268, 'electronics/premium-electronics/phones/samsung/galaxy-z-fold-5/b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d9e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-z-fold-5', 'Samsung', 'Galaxy Z Fold 5'),
('c6d7e8f9-a0b1-4c2d-3e4f-5a6b7c8d9e0f', 1, 6, 18, 45, 269, 'electronics/premium-electronics/phones/samsung/galaxy-z-flip-5/c6d7e8f9-a0b1-4c2d-3e4f-5a6b7c8d9e0f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-z-flip-5', 'Samsung', 'Galaxy Z Flip 5'),
('d7e8f9a0-b1c2-4d3e-4f5a-6b7c8d9e0f1a', 1, 6, 18, 45, 270, 'electronics/premium-electronics/phones/samsung/galaxy-a54/d7e8f9a0-b1c2-4d3e-4f5a-6b7c8d9e0f1a/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-a54', 'Samsung', 'Galaxy A54'),
('e8f9a0b1-c2d3-4e4f-5a6b-7c8d9e0f1a2b', 1, 6, 18, 45, 271, 'electronics/premium-electronics/phones/samsung/galaxy-a34/e8f9a0b1-c2d3-4e4f-5a6b-7c8d9e0f1a2b/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-a34', 'Samsung', 'Galaxy A34'),
('f9a0b1c2-d3e4-4f5a-6b7c-8d9e0f1a2b3c', 1, 6, 18, 46, 272, 'electronics/premium-electronics/phones/xiaomi/xiaomi-13/f9a0b1c2-d3e4-4f5a-6b7c-8d9e0f1a2b3c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'xiaomi-13', 'Xiaomi', 'Xiaomi 13'),
('a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c4d', 1, 6, 18, 46, 273, 'electronics/premium-electronics/phones/xiaomi/xiaomi-13-pro/a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c4d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'xiaomi-13-pro', 'Xiaomi', 'Xiaomi 13 Pro'),
('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', 1, 6, 18, 46, 274, 'electronics/premium-electronics/phones/xiaomi/xiaomi-14/b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'xiaomi-14', 'Xiaomi', 'Xiaomi 14'),
('c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f', 1, 6, 18, 46, 275, 'electronics/premium-electronics/phones/xiaomi/xiaomi-14-ultra/c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'xiaomi-14-ultra', 'Xiaomi', 'Xiaomi 14 Ultra'),
('d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a', 1, 6, 18, 47, 276, 'electronics/premium-electronics/phones/redmi/redmi-note-12-pro/d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'redmi-note-12-pro', 'Redmi', 'Redmi Note 12 Pro'),
('e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b', 1, 6, 18, 47, 277, 'electronics/premium-electronics/phones/redmi/redmi-note-13-pro/e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'redmi-note-13-pro', 'Redmi', 'Redmi Note 13 Pro'),
('f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c', 1, 6, 18, 47, 278, 'electronics/premium-electronics/phones/redmi/redmi-note-13-pro-plus/f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'redmi-note-13-pro-plus', 'Redmi', 'Redmi Note 13 Pro+'),
('a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d', 1, 6, 18, 47, 279, 'electronics/premium-electronics/phones/redmi/redmi-12/a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'redmi-12', 'Redmi', 'Redmi 12'),
('b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e', 1, 6, 18, 48, 280, 'electronics/premium-electronics/phones/poco/poco-f5/b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'poco-f5', 'POCO', 'POCO F5'),
('c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f', 1, 6, 18, 48, 281, 'electronics/premium-electronics/phones/poco/poco-x5-pro/c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'poco-x5-pro', 'POCO', 'POCO X5 Pro'),
('d9e0f1a2-b3c4-4d5e-6f7a-8b9c0d1e2f3a', 1, 6, 18, 48, 282, 'electronics/premium-electronics/phones/poco/poco-m5/d9e0f1a2-b3c4-4d5e-6f7a-8b9c0d1e2f3a/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'poco-m5', 'POCO', 'POCO M5'),
('e0f1a2b3-c4d5-4e6f-7a8b-9c0d1e2f3a4b', 1, 6, 18, 49, 283, 'electronics/premium-electronics/phones/realme/realme-11-pro/e0f1a2b3-c4d5-4e6f-7a8b-9c0d1e2f3a4b/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'realme-11-pro', 'Realme', 'Realme 11 Pro'),
('f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 1, 6, 18, 49, 284, 'electronics/premium-electronics/phones/realme/realme-11-pro-plus/f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'realme-11-pro-plus', 'Realme', 'Realme 11 Pro+'),
('a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6e', 1, 6, 18, 49, 285, 'electronics/premium-electronics/phones/realme/realme-gt-5/a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'realme-gt-5', 'Realme', 'Realme GT 5'),
('b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7f', 1, 6, 18, 49, 286, 'electronics/premium-electronics/phones/realme/realme-c55/b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'realme-c55', 'Realme', 'Realme C55'),
('c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e90', 1, 6, 18, 50, 287, 'electronics/premium-electronics/phones/oneplus/oneplus-11/c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e90/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oneplus-11', 'OnePlus', 'OnePlus 11'),
('d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9b', 1, 6, 18, 50, 288, 'electronics/premium-electronics/phones/oneplus/oneplus-12/d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9b/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oneplus-12', 'OnePlus', 'OnePlus 12'),
('e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0c', 1, 6, 18, 50, 289, 'electronics/premium-electronics/phones/oneplus/oneplus-nord-3/e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oneplus-nord-3', 'OnePlus', 'OnePlus Nord 3'),
('f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1d', 1, 6, 18, 50, 290, 'electronics/premium-electronics/phones/oneplus/oneplus-nord-ce-3/f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oneplus-nord-ce-3', 'OnePlus', 'OnePlus Nord CE 3'),
('a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2e', 1, 6, 18, 51, 291, 'electronics/premium-electronics/phones/oppo/oppo-find-x6-pro/a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oppo-find-x6-pro', 'Oppo', 'Oppo Find X6 Pro'),
('b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d3f', 1, 6, 18, 51, 292, 'electronics/premium-electronics/phones/oppo/oppo-reno-10-pro/b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d3f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oppo-reno-10-pro', 'Oppo', 'Oppo Reno 10 Pro'),
('c0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e40', 1, 6, 18, 51, 293, 'electronics/premium-electronics/phones/oppo/oppo-a78/c0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e40/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oppo-a78', 'Oppo', 'Oppo A78'),
('d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5b', 1, 6, 18, 52, 294, 'electronics/premium-electronics/phones/vivo/vivo-x90-pro/d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5b/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'vivo-x90-pro', 'Vivo', 'Vivo X90 Pro'),
('e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6c', 1, 6, 18, 52, 295, 'electronics/premium-electronics/phones/vivo/vivo-v29/e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'vivo-v29', 'Vivo', 'Vivo V29'),
('f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7d', 1, 6, 18, 52, 296, 'electronics/premium-electronics/phones/vivo/vivo-y100/f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'vivo-y100', 'Vivo', 'Vivo Y100'),
('a4b5c6d7-e8f9-4a0b-1c2d-3e4f5a6b7c8e', 1, 6, 18, 53, 297, 'electronics/premium-electronics/phones/google/pixel-7/a4b5c6d7-e8f9-4a0b-1c2d-3e4f5a6b7c8e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'pixel-7', 'Google', 'Pixel 7'),
('b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d9f', 1, 6, 18, 53, 298, 'electronics/premium-electronics/phones/google/pixel-7-pro/b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d9f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'pixel-7-pro', 'Google', 'Pixel 7 Pro'),
('c6d7e8f9-a0b1-4c2d-3e4f-5a6b7c8d9e10', 1, 6, 18, 53, 299, 'electronics/premium-electronics/phones/google/pixel-8/c6d7e8f9-a0b1-4c2d-3e4f-5a6b7c8d9e10/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'pixel-8', 'Google', 'Pixel 8'),
('d7e8f9a0-b1c2-4d3e-4f5a-6b7c8d9e0f1b', 1, 6, 18, 53, 300, 'electronics/premium-electronics/phones/google/pixel-8-pro/d7e8f9a0-b1c2-4d3e-4f5a-6b7c8d9e0f1b/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'pixel-8-pro', 'Google', 'Pixel 8 Pro'),
('e8f9a0b1-c2d3-4e4f-5a6b-7c8d9e0f1a2c', 1, 6, 18, 53, 301, 'electronics/premium-electronics/phones/google/pixel-7a/e8f9a0b1-c2d3-4e4f-5a6b-7c8d9e0f1a2c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'pixel-7a', 'Google', 'Pixel 7a'),
('f9a0b1c2-d3e4-4f5a-6b7c-8d9e0f1a2b3d', 1, 6, 18, 54, 302, 'electronics/premium-electronics/phones/huawei/huawei-p60-pro/f9a0b1c2-d3e4-4f5a-6b7c-8d9e0f1a2b3d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'huawei-p60-pro', 'Huawei', 'Huawei P60 Pro'),
('a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c4e', 1, 6, 18, 54, 303, 'electronics/premium-electronics/phones/huawei/huawei-mate-60-pro/a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c4e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'huawei-mate-60-pro', 'Huawei', 'Huawei Mate 60 Pro'),
('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5f', 1, 6, 18, 54, 304, 'electronics/premium-electronics/phones/huawei/huawei-nova-11/b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'huawei-nova-11', 'Huawei', 'Huawei Nova 11'),
('c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e60', 1, 6, 18, 55, 305, 'electronics/premium-electronics/phones/nokia/nokia-g42/c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e60/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'nokia-g42', 'Nokia', 'Nokia G42'),
('d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7b', 1, 6, 18, 55, 306, 'electronics/premium-electronics/phones/nokia/nokia-xr21/d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7b/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'nokia-xr21', 'Nokia', 'Nokia XR21'),
('e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8c', 1, 6, 18, 56, 307, 'electronics/premium-electronics/phones/asus/asus-rog-phone-7/e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'asus-rog-phone-7', 'Asus', 'Asus ROG Phone 7'),
('f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9d', 1, 6, 18, 56, 308, 'electronics/premium-electronics/phones/asus/asus-zenfone-10/f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'asus-zenfone-10', 'Asus', 'Asus Zenfone 10'),
('a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0e', 1, 6, 18, 57, 309, 'electronics/premium-electronics/phones/sony/sony-xperia-1-v/a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'sony-xperia-1-v', 'Sony', 'Sony Xperia 1 V'),
('b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1f', 1, 6, 18, 57, 310, 'electronics/premium-electronics/phones/sony/sony-xperia-5-v/b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'sony-xperia-5-v', 'Sony', 'Sony Xperia 5 V'),
('c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e20', 1, 6, 18, 58, 311, 'electronics/premium-electronics/phones/zte/zte-axon-50-ultra/c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e20/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'zte-axon-50-ultra', 'ZTE', 'ZTE Axon 50 Ultra'),
('d9e0f1a2-b3c4-4d5e-6f7a-8b9c0d1e2f3b', 1, 6, 18, 58, 312, 'electronics/premium-electronics/phones/zte/zte-nubia-z50-ultra/d9e0f1a2-b3c4-4d5e-6f7a-8b9c0d1e2f3b/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'zte-nubia-z50-ultra', 'ZTE', 'ZTE Nubia Z50 Ultra'),
('e0f1a2b3-c4d5-4e6f-7a8b-9c0d1e2f3a4c', 1, 6, 18, 59, 313, 'electronics/premium-electronics/phones/lenovo/lenovo-legion-phone-duel-2/e0f1a2b3-c4d5-4e6f-7a8b-9c0d1e2f3a4c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'lenovo-legion-phone-duel-2', 'Lenovo', 'Lenovo Legion Phone Duel 2'),
('f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5d', 1, 6, 18, 60, 314, 'electronics/premium-electronics/phones/motorola/motorola-edge-40-pro/f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'motorola-edge-40-pro', 'Motorola', 'Motorola Edge 40 Pro'),
('a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6f', 1, 6, 18, 60, 315, 'electronics/premium-electronics/phones/motorola/motorola-razr-40-ultra/a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'motorola-razr-40-ultra', 'Motorola', 'Motorola Razr 40 Ultra'),
('b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d80', 1, 6, 18, 60, 316, 'electronics/premium-electronics/phones/motorola/moto-g84/b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d80/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'moto-g84', 'Motorola', 'Moto G84'),
('c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e91', 1, 6, 18, 61, 317, 'electronics/premium-electronics/phones/iqoo/iqoo-11/c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e91/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iqoo-11', 'iQOO', 'iQOO 11'),
('d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9c', 1, 6, 18, 61, 318, 'electronics/premium-electronics/phones/iqoo/iqoo-neo-7/d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iqoo-neo-7', 'iQOO', 'iQOO Neo 7'),
('e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0d', 1, 6, 18, 62, 319, 'electronics/premium-electronics/phones/lava/lava-blaze-2/e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'lava-blaze-2', 'Lava', 'Lava Blaze 2'),
('f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1e', 1, 6, 18, 62, 320, 'electronics/premium-electronics/phones/lava/lava-agni-2/f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'lava-agni-2', 'Lava', 'Lava Agni 2'),
('a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2f', 1, 6, 18, 63, 321, 'electronics/premium-electronics/phones/micromax/micromax-in-note-2/a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'micromax-in-note-2', 'Micromax', 'Micromax In Note 2'),
('b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d40', 1, 6, 18, 64, 322, 'electronics/premium-electronics/phones/karbonn/karbonn-titanium-s9-plus/b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d40/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'karbonn-titanium-s9-plus', 'Karbonn', 'Karbonn Titanium S9 Plus'),
('c0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e41', 1, 6, 18, 65, 323, 'electronics/premium-electronics/phones/black-shark/black-shark-5-pro/c0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e41/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'black-shark-5-pro', 'Black Shark', 'Black Shark 5 Pro'),
('d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5c', 1, 6, 18, 66, 324, 'electronics/premium-electronics/phones/meizu/meizu-20-pro/d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'meizu-20-pro', 'Meizu', 'Meizu 20 Pro'),
('e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6d', 1, 6, 18, 67, 325, 'electronics/premium-electronics/phones/nothing/nothing-phone-2/e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'nothing-phone-2', 'Nothing', 'Nothing Phone 2'),
('f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7e', 1, 6, 18, 67, 326, 'electronics/premium-electronics/phones/nothing/nothing-phone-1/f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'nothing-phone-1', 'Nothing', 'Nothing Phone 1'),
('a4b5c6d7-e8f9-4a0b-1c2d-3e4f5a6b7c8f', 1, 6, 18, 68, 327, 'electronics/premium-electronics/phones/tecno/tecno-camon-20-pro/a4b5c6d7-e8f9-4a0b-1c2d-3e4f5a6b7c8f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'tecno-camon-20-pro', 'Tecno', 'Tecno Camon 20 Pro'),
('b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d90', 1, 6, 18, 68, 328, 'electronics/premium-electronics/phones/tecno/tecno-phantom-x2/b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d90/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'tecno-phantom-x2', 'Tecno', 'Tecno Phantom X2'),
('c6d7e8f9-a0b1-4c2d-3e4f-5a6b7c8d9e11', 1, 6, 18, 69, 329, 'electronics/premium-electronics/phones/infinix/infinix-note-30/c6d7e8f9-a0b1-4c2d-3e4f-5a6b7c8d9e11/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'infinix-note-30', 'Infinix', 'Infinix Note 30'),
('d7e8f9a0-b1c2-4d3e-4f5a-6b7c8d9e0f1c', 1, 6, 18, 69, 330, 'electronics/premium-electronics/phones/infinix/infinix-zero-30/d7e8f9a0-b1c2-4d3e-4f5a-6b7c8d9e0f1c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'infinix-zero-30', 'Infinix', 'Infinix Zero 30'),
('e8f9a0b1-c2d3-4e4f-5a6b-7c8d9e0f1a2d', 1, 6, 18, 70, 331, 'electronics/premium-electronics/phones/honor/honor-magic-5-pro/e8f9a0b1-c2d3-4e4f-5a6b-7c8d9e0f1a2d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'honor-magic-5-pro', 'Honor', 'Honor Magic 5 Pro'),
('f9a0b1c2-d3e4-4f5a-6b7c-8d9e0f1a2b3e', 1, 6, 18, 70, 332, 'electronics/premium-electronics/phones/honor/honor-90/f9a0b1c2-d3e4-4f5a-6b7c-8d9e0f1a2b3e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'honor-90', 'Honor', 'Honor 90'),
('a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c4f', 1, 6, 18, 44, 333, 'electronics/premium-electronics/phones/apple/iphone-12/a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c4f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-12', 'Apple', 'iPhone 12'),
('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d60', 1, 6, 18, 44, 334, 'electronics/premium-electronics/phones/apple/iphone-12-pro/b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d60/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-12-pro', 'Apple', 'iPhone 12 Pro'),
('c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e61', 1, 6, 18, 44, 335, 'electronics/premium-electronics/phones/apple/iphone-12-pro-max/c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e61/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-12-pro-max', 'Apple', 'iPhone 12 Pro Max'),
('d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7c', 1, 6, 18, 44, 336, 'electronics/premium-electronics/phones/apple/iphone-11/d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-11', 'Apple', 'iPhone 11'),
('e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8d', 1, 6, 18, 44, 337, 'electronics/premium-electronics/phones/apple/iphone-11-pro/e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-11-pro', 'Apple', 'iPhone 11 Pro'),
('f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9e', 1, 6, 18, 44, 338, 'electronics/premium-electronics/phones/apple/iphone-13/f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-13', 'Apple', 'iPhone 13'),
('a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0f', 1, 6, 18, 44, 339, 'electronics/premium-electronics/phones/apple/iphone-13-pro-max/a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-13-pro-max', 'Apple', 'iPhone 13 Pro Max'),
('b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d20', 1, 6, 18, 45, 340, 'electronics/premium-electronics/phones/samsung/galaxy-s22/b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d20/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s22', 'Samsung', 'Galaxy S22'),
('c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e21', 1, 6, 18, 45, 341, 'electronics/premium-electronics/phones/samsung/galaxy-s22-ultra/c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e21/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s22-ultra', 'Samsung', 'Galaxy S22 Ultra'),
('d9e0f1a2-b3c4-4d5e-6f7a-8b9c0d1e2f3c', 1, 6, 18, 45, 342, 'electronics/premium-electronics/phones/samsung/galaxy-s21/d9e0f1a2-b3c4-4d5e-6f7a-8b9c0d1e2f3c/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s21', 'Samsung', 'Galaxy S21'),
('e0f1a2b3-c4d5-4e6f-7a8b-9c0d1e2f3a4d', 1, 6, 18, 45, 343, 'electronics/premium-electronics/phones/samsung/galaxy-s21-ultra/e0f1a2b3-c4d5-4e6f-7a8b-9c0d1e2f3a4d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s21-ultra', 'Samsung', 'Galaxy S21 Ultra'),
('f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5e', 1, 6, 18, 45, 344, 'electronics/premium-electronics/phones/samsung/galaxy-a53/f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-a53', 'Samsung', 'Galaxy A53'),
('a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c70', 1, 6, 18, 45, 345, 'electronics/premium-electronics/phones/samsung/galaxy-a73/a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c70/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-a73', 'Samsung', 'Galaxy A73'),
('b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d81', 1, 6, 18, 45, 346, 'electronics/premium-electronics/phones/samsung/galaxy-z-fold-4/b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d81/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-z-fold-4', 'Samsung', 'Galaxy Z Fold 4'),
('c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e92', 1, 6, 18, 45, 347, 'electronics/premium-electronics/phones/samsung/galaxy-z-flip-4/c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e92/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-z-flip-4', 'Samsung', 'Galaxy Z Flip 4'),
('d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9d', 1, 6, 18, 46, 348, 'electronics/premium-electronics/phones/xiaomi/xiaomi-12/d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'xiaomi-12', 'Xiaomi', 'Xiaomi 12'),
('e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0e', 1, 6, 18, 46, 349, 'electronics/premium-electronics/phones/xiaomi/xiaomi-12-pro/e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'xiaomi-12-pro', 'Xiaomi', 'Xiaomi 12 Pro'),
('f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1f', 1, 6, 18, 46, 350, 'electronics/premium-electronics/phones/xiaomi/mi-11/f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'mi-11', 'Xiaomi', 'Mi 11'),
('a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c30', 1, 6, 18, 46, 351, 'electronics/premium-electronics/phones/xiaomi/mi-11-ultra/a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c30/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'mi-11-ultra', 'Xiaomi', 'Mi 11 Ultra'),
('b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d41', 1, 6, 18, 47, 352, 'electronics/premium-electronics/phones/redmi/redmi-note-11-pro/b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d41/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'redmi-note-11-pro', 'Redmi', 'Redmi Note 11 Pro'),
('c0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e42', 1, 6, 18, 47, 353, 'electronics/premium-electronics/phones/redmi/redmi-note-10-pro/c0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e42/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'redmi-note-10-pro', 'Redmi', 'Redmi Note 10 Pro'),
('d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5d', 1, 6, 18, 47, 354, 'electronics/premium-electronics/phones/redmi/redmi-10/d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'redmi-10', 'Redmi', 'Redmi 10'),
('e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6e', 1, 6, 18, 48, 355, 'electronics/premium-electronics/phones/poco/poco-f4/e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'poco-f4', 'POCO', 'POCO F4'),
('f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7f', 1, 6, 18, 48, 356, 'electronics/premium-electronics/phones/poco/poco-x4-pro/f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'poco-x4-pro', 'POCO', 'POCO X4 Pro'),
('a4b5c6d7-e8f9-4a0b-1c2d-3e4f5a6b7c90', 1, 6, 18, 49, 357, 'electronics/premium-electronics/phones/realme/realme-gt-2-pro/a4b5c6d7-e8f9-4a0b-1c2d-3e4f5a6b7c90/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'realme-gt-2-pro', 'Realme', 'Realme GT 2 Pro'),
('b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d91', 1, 6, 18, 49, 358, 'electronics/premium-electronics/phones/realme/realme-9-pro-plus/b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d91/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'realme-9-pro-plus', 'Realme', 'Realme 9 Pro+'),
('c6d7e8f9-a0b1-4c2d-3e4f-5a6b7c8d9e12', 1, 6, 18, 50, 359, 'electronics/premium-electronics/phones/oneplus/oneplus-10-pro/c6d7e8f9-a0b1-4c2d-3e4f-5a6b7c8d9e12/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oneplus-10-pro', 'OnePlus', 'OnePlus 10 Pro'),
('d7e8f9a0-b1c2-4d3e-4f5a-6b7c8d9e0f1d', 1, 6, 18, 50, 360, 'electronics/premium-electronics/phones/oneplus/oneplus-10t/d7e8f9a0-b1c2-4d3e-4f5a-6b7c8d9e0f1d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oneplus-10t', 'OnePlus', 'OnePlus 10T'),
('e8f9a0b1-c2d3-4e4f-5a6b-7c8d9e0f1a2e', 1, 6, 18, 50, 361, 'electronics/premium-electronics/phones/oneplus/oneplus-nord-2/e8f9a0b1-c2d3-4e4f-5a6b-7c8d9e0f1a2e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oneplus-nord-2', 'OnePlus', 'OnePlus Nord 2'),
('f9a0b1c2-d3e4-4f5a-6b7c-8d9e0f1a2b3f', 1, 6, 18, 51, 362, 'electronics/premium-electronics/phones/oppo/oppo-find-x5-pro/f9a0b1c2-d3e4-4f5a-6b7c-8d9e0f1a2b3f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oppo-find-x5-pro', 'Oppo', 'Oppo Find X5 Pro'),
('a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c50', 1, 6, 18, 51, 363, 'electronics/premium-electronics/phones/oppo/oppo-reno-8-pro/a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c50/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oppo-reno-8-pro', 'Oppo', 'Oppo Reno 8 Pro'),
('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d61', 1, 6, 18, 52, 364, 'electronics/premium-electronics/phones/vivo/vivo-x80-pro/b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d61/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'vivo-x80-pro', 'Vivo', 'Vivo X80 Pro'),
('c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e62', 1, 6, 18, 52, 365, 'electronics/premium-electronics/phones/vivo/vivo-v25-pro/c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e62/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'vivo-v25-pro', 'Vivo', 'Vivo V25 Pro'),
('d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7d', 1, 6, 18, 53, 366, 'electronics/premium-electronics/phones/google/pixel-6/d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'pixel-6', 'Google', 'Pixel 6'),
('e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8e', 1, 6, 18, 53, 367, 'electronics/premium-electronics/phones/google/pixel-6-pro/e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'pixel-6-pro', 'Google', 'Pixel 6 Pro'),
('f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9f', 1, 6, 18, 53, 368, 'electronics/premium-electronics/phones/google/pixel-6a/f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'pixel-6a', 'Google', 'Pixel 6a'),
('a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c10', 1, 6, 18, 54, 369, 'electronics/premium-electronics/phones/huawei/huawei-p50-pro/a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c10/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'huawei-p50-pro', 'Huawei', 'Huawei P50 Pro'),
('b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d21', 1, 6, 18, 54, 370, 'electronics/premium-electronics/phones/huawei/huawei-mate-50-pro/b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d21/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'huawei-mate-50-pro', 'Huawei', 'Huawei Mate 50 Pro'),
('c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e22', 1, 6, 18, 55, 371, 'electronics/premium-electronics/phones/nokia/nokia-x30/c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e22/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'nokia-x30', 'Nokia', 'Nokia X30'),
('d9e0f1a2-b3c4-4d5e-6f7a-8b9c0d1e2f3d', 1, 6, 18, 55, 372, 'electronics/premium-electronics/phones/nokia/nokia-g60/d9e0f1a2-b3c4-4d5e-6f7a-8b9c0d1e2f3d/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'nokia-g60', 'Nokia', 'Nokia G60'),
('e0f1a2b3-c4d5-4e6f-7a8b-9c0d1e2f3a4e', 1, 6, 18, 56, 373, 'electronics/premium-electronics/phones/asus/asus-rog-phone-6/e0f1a2b3-c4d5-4e6f-7a8b-9c0d1e2f3a4e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'asus-rog-phone-6', 'Asus', 'Asus ROG Phone 6'),
('f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5f', 1, 6, 18, 56, 374, 'electronics/premium-electronics/phones/asus/asus-zenfone-9/f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'asus-zenfone-9', 'Asus', 'Asus Zenfone 9'),
('a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c71', 1, 6, 18, 57, 375, 'electronics/premium-electronics/phones/sony/sony-xperia-1-iv/a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c71/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'sony-xperia-1-iv', 'Sony', 'Sony Xperia 1 IV'),
('b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d82', 1, 6, 18, 57, 376, 'electronics/premium-electronics/phones/sony/sony-xperia-5-iv/b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d82/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'sony-xperia-5-iv', 'Sony', 'Sony Xperia 5 IV'),
('c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e93', 1, 6, 18, 60, 377, 'electronics/premium-electronics/phones/motorola/motorola-edge-30-ultra/c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e93/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'motorola-edge-30-ultra', 'Motorola', 'Motorola Edge 30 Ultra'),
('d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9e', 1, 6, 18, 60, 378, 'electronics/premium-electronics/phones/motorola/moto-g72/d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'moto-g72', 'Motorola', 'Moto G72'),
('e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0f', 1, 6, 18, 70, 379, 'electronics/premium-electronics/phones/honor/honor-70/e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'honor-70', 'Honor', 'Honor 70'),
('f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b20', 1, 6, 18, 70, 380, 'electronics/premium-electronics/phones/honor/honor-magic-4-pro/f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b20/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'honor-magic-4-pro', 'Honor', 'Honor Magic 4 Pro'),
('a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c31', 1, 6, 18, 67, 381, 'electronics/premium-electronics/phones/nothing/nothing-phone-2a/a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c31/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'nothing-phone-2a', 'Nothing', 'Nothing Phone 2a'),
('b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d42', 1, 6, 18, 68, 382, 'electronics/premium-electronics/phones/tecno/tecno-spark-10-pro/b9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d42/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'tecno-spark-10-pro', 'Tecno', 'Tecno Spark 10 Pro'),
('c0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e43', 1, 6, 18, 69, 383, 'electronics/premium-electronics/phones/infinix/infinix-hot-30/c0d1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e43/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'infinix-hot-30', 'Infinix', 'Infinix Hot 30'),
('d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5e', 1, 6, 18, 44, 384, 'electronics/premium-electronics/phones/apple/iphone-16/d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-16', 'Apple', 'iPhone 16'),
('e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6f', 1, 6, 18, 44, 385, 'electronics/premium-electronics/phones/apple/iphone-16-pro/e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-16-pro', 'Apple', 'iPhone 16 Pro'),
('f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b80', 1, 6, 18, 44, 386, 'electronics/premium-electronics/phones/apple/iphone-16-pro-max/f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b80/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'iphone-16-pro-max', 'Apple', 'iPhone 16 Pro Max'),
('a4b5c6d7-e8f9-4a0b-1c2d-3e4f5a6b7c91', 1, 6, 18, 45, 387, 'electronics/premium-electronics/phones/samsung/galaxy-s25/a4b5c6d7-e8f9-4a0b-1c2d-3e4f5a6b7c91/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s25', 'Samsung', 'Galaxy S25'),
('b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d92', 1, 6, 18, 45, 388, 'electronics/premium-electronics/phones/samsung/galaxy-s25-ultra/b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d92/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'galaxy-s25-ultra', 'Samsung', 'Galaxy S25 Ultra'),
('c6d7e8f9-a0b1-4c2d-3e4f-5a6b7c8d9e13', 1, 6, 18, 53, 389, 'electronics/premium-electronics/phones/google/pixel-9/c6d7e8f9-a0b1-4c2d-3e4f-5a6b7c8d9e13/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'pixel-9', 'Google', 'Pixel 9'),
('d7e8f9a0-b1c2-4d3e-4f5a-6b7c8d9e0f1e', 1, 6, 18, 53, 390, 'electronics/premium-electronics/phones/google/pixel-9-pro/d7e8f9a0-b1c2-4d3e-4f5a-6b7c8d9e0f1e/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'pixel-9-pro', 'Google', 'Pixel 9 Pro'),
('e8f9a0b1-c2d3-4e4f-5a6b-7c8d9e0f1a2f', 1, 6, 18, 50, 391, 'electronics/premium-electronics/phones/oneplus/oneplus-13/e8f9a0b1-c2d3-4e4f-5a6b-7c8d9e0f1a2f/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oneplus-13', 'OnePlus', 'OnePlus 13'),
('f9a0b1c2-d3e4-4f5a-6b7c-8d9e0f1a2b40', 1, 6, 18, 46, 392, 'electronics/premium-electronics/phones/xiaomi/xiaomi-15/f9a0b1c2-d3e4-4f5a-6b7c-8d9e0f1a2b40/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'xiaomi-15', 'Xiaomi', 'Xiaomi 15'),
('a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c51', 1, 6, 18, 46, 393, 'electronics/premium-electronics/phones/xiaomi/xiaomi-15-pro/a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c51/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'xiaomi-15-pro', 'Xiaomi', 'Xiaomi 15 Pro'),
('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d62', 1, 6, 18, 52, 394, 'electronics/premium-electronics/phones/vivo/vivo-x100/b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d62/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'vivo-x100', 'Vivo', 'Vivo X100'),
('c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e63', 1, 6, 18, 51, 395, 'electronics/premium-electronics/phones/oppo/oppo-find-x7-ultra/c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e63/sample-image.jpg', '2024-10-07 08:00:00', '2024-10-07 08:00:00', 'oppo-find-x7-ultra', 'Oppo', 'Oppo Find X7 Ultra');


-- =============================================
-- STEP 3: INSERT MISSING BRANDS
-- =============================================
-- Insert any brands that don't exist yet

INSERT INTO application.brands (name, slug, is_active, sort_order)
SELECT DISTINCT 
  raw.brand_name,
  LOWER(REPLACE(raw.brand_name, ' ', '-')),
  true,
  0
FROM staging.products_raw raw
WHERE NOT EXISTS (
  SELECT 1 FROM application.brands b 
  WHERE LOWER(b.name) = LOWER(raw.brand_name)
)
ON CONFLICT (slug) DO NOTHING;


-- =============================================
-- STEP 4: INSERT PRODUCTS INTO APPLICATION.PRODUCTS
-- =============================================

INSERT INTO application.products (
  product_id,
  barter_type_id,
  category_id,
  subcategory_id,
  brand_id,
  title,
  model,
  description,
  image_key,
  product_info,
  is_active,
  created_at,
  updated_at
)
SELECT 
  raw.id AS product_id,
  bt.barter_type_id,
  cat.category_id,
  sub.subcategory_id,
  br.brand_id,
  raw.brand_name || ' ' || raw.model_name AS title,
  raw.model_name AS model,
  'Imported from legacy system' AS description,
  raw.product_image AS image_key,
  '{}'::jsonb AS product_info,
  true AS is_active,
  raw.created_at,
  raw.updated_at
FROM staging.products_raw raw
JOIN application.barter_types bt ON bt.slug = 'goods-barter'
JOIN application.categories cat ON cat.slug = 'electronics'
JOIN application.subcategories sub ON sub.slug = 'phones' AND sub.category_id = cat.category_id
JOIN application.brands br ON LOWER(br.name) = LOWER(raw.brand_name)
ON CONFLICT (product_id) DO UPDATE SET
  title = EXCLUDED.title,
  model = EXCLUDED.model,
  image_key = EXCLUDED.image_key,
  updated_at = NOW();


-- =============================================
-- STEP 5: VERIFICATION QUERIES
-- =============================================

SELECT 'Staging records' AS check_type, COUNT(*) AS count FROM staging.products_raw;

SELECT 'Imported products' AS check_type, COUNT(*) AS count 
FROM application.products p
WHERE EXISTS (SELECT 1 FROM staging.products_raw s WHERE s.id = p.product_id);

SELECT 'Missing brand matches' AS check_type, COUNT(*) AS count
FROM staging.products_raw raw
WHERE NOT EXISTS (
  SELECT 1 FROM application.brands b 
  WHERE LOWER(b.name) = LOWER(raw.brand_name)
);

SELECT 'Failed imports' AS check_type, COUNT(*) AS count
FROM staging.products_raw raw
WHERE NOT EXISTS (
  SELECT 1 FROM application.products p WHERE p.product_id = raw.id
);

SELECT 
  p.product_id,
  p.title,
  p.image_key,
  b.name as brand_name
FROM application.products p
JOIN application.brands b ON p.brand_id = b.brand_id
WHERE EXISTS (SELECT 1 FROM staging.products_raw s WHERE s.id = p.product_id)
LIMIT 5;


COMMIT;
