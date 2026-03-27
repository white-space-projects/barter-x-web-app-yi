-- ============================================================================
-- BARTER-X DATABASE SETUP
-- ============================================================================
-- This script creates the complete database structure for the Barter-X application.
-- 
-- Schemas:
--   - application: Core business tables (users, products, offers, catalog, geo)
--   - analytics: Event tracking tables (prepared for future use)
--
-- Key design decisions:
--   - All primary keys use UUID with gen_random_uuid() default
--   - MinIO is used for image storage; only paths/keys stored in DB
--   - Geo-location is extensible for future state/zip support
--   - Analytics tables are created but tracking is not enabled yet
--   - RLS policies are defined but can be disabled initially
-- ============================================================================

-- ============================================================================
-- SCHEMA CREATION
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS application;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA application TO authenticated;
GRANT USAGE ON SCHEMA analytics TO authenticated;

-- ============================================================================
-- UTILITY: Updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION application.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION analytics.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA: application
-- ============================================================================

-- ----------------------------------------------------------------------------
-- GEO-LOCATION TABLES
-- ----------------------------------------------------------------------------
-- Extensible design: countries -> states (future) -> cities -> zip_codes (future)

-- Countries table
CREATE TABLE application.countries (
  country_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code CHAR(2) NOT NULL UNIQUE,        -- ISO 3166-1 alpha-2 (e.g., 'US', 'DE')
  country_code_3 CHAR(3),                       -- ISO 3166-1 alpha-3 (e.g., 'USA', 'DEU')
  name VARCHAR(100) NOT NULL,
  phone_code VARCHAR(10),                       -- e.g., '+1', '+49'
  currency_code CHAR(3),                        -- ISO 4217 (e.g., 'USD', 'EUR')
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_countries_code ON application.countries(country_code);
CREATE INDEX idx_countries_name ON application.countries(name);
CREATE INDEX idx_countries_active ON application.countries(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE application.countries IS 'Master list of countries for geo-location';
COMMENT ON COLUMN application.countries.country_code IS 'ISO 3166-1 alpha-2 country code';

-- States/Regions table (for future use - structure ready)
CREATE TABLE application.states (
  state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES application.countries(country_id) ON DELETE CASCADE,
  state_code VARCHAR(10),                       -- State/province code (e.g., 'CA', 'NY')
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(country_id, state_code)
);

CREATE INDEX idx_states_country ON application.states(country_id);
CREATE INDEX idx_states_name ON application.states(name);

COMMENT ON TABLE application.states IS 'States/provinces/regions within countries (extensible for future use)';

-- Cities table
CREATE TABLE application.cities (
  city_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES application.countries(country_id) ON DELETE CASCADE,
  state_id UUID REFERENCES application.states(state_id) ON DELETE SET NULL,  -- Optional, for future use
  name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_cities_country ON application.cities(country_id);
CREATE INDEX idx_cities_state ON application.cities(state_id);
CREATE INDEX idx_cities_name ON application.cities(name);
CREATE INDEX idx_cities_active ON application.cities(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE application.cities IS 'Cities within countries, optionally linked to states';

-- Zip codes table (for future use - structure ready)
CREATE TABLE application.zip_codes (
  zip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES application.cities(city_id) ON DELETE CASCADE,
  zip_code VARCHAR(20) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(city_id, zip_code)
);

CREATE INDEX idx_zip_codes_city ON application.zip_codes(city_id);
CREATE INDEX idx_zip_codes_code ON application.zip_codes(zip_code);

COMMENT ON TABLE application.zip_codes IS 'Zip/postal codes within cities (extensible for future use)';

-- ----------------------------------------------------------------------------
-- USERS / PROFILES TABLE
-- ----------------------------------------------------------------------------
-- Links to Supabase auth.users via user_id
-- Stores both detected (IP-based) and profile (user-entered) region info

CREATE TABLE application.users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic profile info
  email VARCHAR(255),
  phone VARCHAR(30),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(100),
  bio TEXT,
  avatar_image_key VARCHAR(500),               -- MinIO path for avatar image
  
  -- Detected region (from login screen, IP-based, editable)
  detected_country_id UUID REFERENCES application.countries(country_id) ON DELETE SET NULL,
  detected_city_id UUID REFERENCES application.cities(city_id) ON DELETE SET NULL,
  detected_at TIMESTAMPTZ,                     -- When detection occurred
  
  -- Profile region (user-entered in profile settings)
  profile_country_id UUID REFERENCES application.countries(country_id) ON DELETE SET NULL,
  profile_city_id UUID REFERENCES application.cities(city_id) ON DELETE SET NULL,
  profile_address_line1 VARCHAR(255),
  profile_address_line2 VARCHAR(255),
  profile_zip_code VARCHAR(20),
  
  -- Notification settings (structured JSON for flexibility)
  notification_settings JSONB DEFAULT '{
    "email_notifications": true,
    "push_notifications": true,
    "offer_updates": true,
    "cycle_alerts": true,
    "chat_messages": true,
    "marketing": false
  }'::JSONB,
  
  -- Account status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_email ON application.users(email);
CREATE INDEX idx_users_display_name ON application.users(display_name);
CREATE INDEX idx_users_detected_country ON application.users(detected_country_id);
CREATE INDEX idx_users_detected_city ON application.users(detected_city_id);
CREATE INDEX idx_users_profile_country ON application.users(profile_country_id);
CREATE INDEX idx_users_profile_city ON application.users(profile_city_id);
CREATE INDEX idx_users_active ON application.users(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE application.users IS 'User profiles linked to Supabase auth, with detected and profile region info';
COMMENT ON COLUMN application.users.detected_country_id IS 'Country detected from IP at login (editable by user)';
COMMENT ON COLUMN application.users.profile_country_id IS 'Country entered by user in profile settings';

-- ----------------------------------------------------------------------------
-- CATALOG TABLES (Barter Types, Categories, Subcategories)
-- ----------------------------------------------------------------------------

-- Barter Types (e.g., Goods, Automobile, Homes & Spaces)
CREATE TABLE application.barter_types (
  barter_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,           -- URL-friendly identifier
  description TEXT,
  icon VARCHAR(50),                            -- Icon name for UI
  color VARCHAR(50),                           -- Color class for UI
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_barter_types_slug ON application.barter_types(slug);
CREATE INDEX idx_barter_types_active ON application.barter_types(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE application.barter_types IS 'Top-level barter types (Goods, Automobile, Homes & Spaces)';

-- Categories within each barter type
CREATE TABLE application.categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barter_type_id UUID NOT NULL REFERENCES application.barter_types(barter_type_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(barter_type_id, slug)
);

CREATE INDEX idx_categories_barter_type ON application.categories(barter_type_id);
CREATE INDEX idx_categories_slug ON application.categories(slug);
CREATE INDEX idx_categories_active ON application.categories(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE application.categories IS 'Categories within each barter type';

-- Subcategories within each category
CREATE TABLE application.subcategories (
  subcategory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES application.categories(category_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(category_id, slug)
);

CREATE INDEX idx_subcategories_category ON application.subcategories(category_id);
CREATE INDEX idx_subcategories_slug ON application.subcategories(slug);
CREATE INDEX idx_subcategories_active ON application.subcategories(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE application.subcategories IS 'Subcategories within each category';

-- ----------------------------------------------------------------------------
-- PRODUCTS TABLE
-- ----------------------------------------------------------------------------
-- A product = unique combination of category + subcategory + brand + model
-- Each product has exactly 1 image stored in MinIO

CREATE TABLE application.products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barter_type_id UUID NOT NULL REFERENCES application.barter_types(barter_type_id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES application.categories(category_id) ON DELETE RESTRICT,
  subcategory_id UUID NOT NULL REFERENCES application.subcategories(subcategory_id) ON DELETE RESTRICT,
  
  brand VARCHAR(100),
  model VARCHAR(200),
  title VARCHAR(300) NOT NULL,                 -- Display title (can be auto-generated or custom)
  description TEXT,
  
  -- MinIO image reference (exactly 1 image per product)
  image_key VARCHAR(500),                      -- MinIO path/key for product image
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_by_user_id UUID REFERENCES application.users(user_id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Uniqueness: prevent duplicate products (same category + subcategory + brand + model)
  UNIQUE NULLS NOT DISTINCT (category_id, subcategory_id, LOWER(brand), LOWER(model))
);

CREATE INDEX idx_products_barter_type ON application.products(barter_type_id);
CREATE INDEX idx_products_category ON application.products(category_id);
CREATE INDEX idx_products_subcategory ON application.products(subcategory_id);
CREATE INDEX idx_products_brand ON application.products(brand);
CREATE INDEX idx_products_title ON application.products(title);
CREATE INDEX idx_products_active ON application.products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_created_by ON application.products(created_by_user_id);

COMMENT ON TABLE application.products IS 'Unique products defined by category + subcategory + brand + model';
COMMENT ON COLUMN application.products.image_key IS 'MinIO path/key for product image (exactly 1 per product)';

-- ----------------------------------------------------------------------------
-- OFFERS TABLE
-- ----------------------------------------------------------------------------
-- Core offer structure with extensibility for future fields

CREATE TABLE application.offers (
  offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES application.products(product_id) ON DELETE RESTRICT,
  created_by_user_id UUID NOT NULL REFERENCES application.users(user_id) ON DELETE CASCADE,
  
  -- Basic offer info
  title VARCHAR(300),
  description TEXT,
  condition VARCHAR(50),                       -- e.g., 'new', 'like_new', 'good', 'fair', 'poor'
  
  -- Pickup/exchange location (can differ from user profile)
  pickup_country_id UUID REFERENCES application.countries(country_id) ON DELETE SET NULL,
  pickup_city_id UUID REFERENCES application.cities(city_id) ON DELETE SET NULL,
  pickup_address TEXT,
  pickup_notes TEXT,
  
  -- Offer status
  status VARCHAR(50) DEFAULT 'active',         -- 'active', 'paused', 'exchanged', 'expired', 'deleted'
  
  -- Exchange preferences (extensible JSON)
  exchange_preferences JSONB DEFAULT '{}'::JSONB,
  
  -- Hook/cycle status
  hook_status VARCHAR(50) DEFAULT 'searching', -- 'searching', 'cycle_found', 'reserved', 'processing', 'exchanged', 'expired'
  
  -- Timestamps
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_offers_product ON application.offers(product_id);
CREATE INDEX idx_offers_created_by ON application.offers(created_by_user_id);
CREATE INDEX idx_offers_status ON application.offers(status);
CREATE INDEX idx_offers_hook_status ON application.offers(hook_status);
CREATE INDEX idx_offers_pickup_country ON application.offers(pickup_country_id);
CREATE INDEX idx_offers_pickup_city ON application.offers(pickup_city_id);
CREATE INDEX idx_offers_created_at ON application.offers(created_at DESC);
CREATE INDEX idx_offers_active ON application.offers(status) WHERE status = 'active';

COMMENT ON TABLE application.offers IS 'User offers for products, extensible for future fields';
COMMENT ON COLUMN application.offers.exchange_preferences IS 'JSON field for flexible exchange preferences';

-- ----------------------------------------------------------------------------
-- OFFER IMAGES TABLE
-- ----------------------------------------------------------------------------
-- Each offer can have up to 6 images stored in MinIO

CREATE TABLE application.offer_images (
  image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES application.offers(offer_id) ON DELETE CASCADE,
  
  image_key VARCHAR(500) NOT NULL,             -- MinIO path/key for image
  slot_number SMALLINT NOT NULL CHECK (slot_number >= 1 AND slot_number <= 6),
  
  -- Image metadata
  original_filename VARCHAR(255),
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique slot per offer (max 6 images)
  UNIQUE(offer_id, slot_number)
);

CREATE INDEX idx_offer_images_offer ON application.offer_images(offer_id);
CREATE INDEX idx_offer_images_slot ON application.offer_images(offer_id, slot_number);

COMMENT ON TABLE application.offer_images IS 'Images for offers stored in MinIO (max 6 per offer)';
COMMENT ON COLUMN application.offer_images.slot_number IS 'Image slot 1-6, enforces max 6 images per offer';

-- ----------------------------------------------------------------------------
-- HOOKS TABLE (for future cycle/matching logic)
-- ----------------------------------------------------------------------------
-- Prepared structure for tracking offer hooks and cycles

CREATE TABLE application.hooks (
  hook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_offer_id UUID NOT NULL REFERENCES application.offers(offer_id) ON DELETE CASCADE,
  target_offer_id UUID NOT NULL REFERENCES application.offers(offer_id) ON DELETE CASCADE,
  
  status VARCHAR(50) DEFAULT 'pending',        -- 'pending', 'confirmed', 'rejected', 'expired'
  
  -- Cycle tracking
  cycle_id UUID,                               -- Groups hooks that form a complete cycle
  cycle_position INTEGER,                      -- Position in cycle (1, 2, 3, etc.)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMPTZ,
  
  -- Prevent duplicate hooks
  UNIQUE(source_offer_id, target_offer_id)
);

CREATE INDEX idx_hooks_source ON application.hooks(source_offer_id);
CREATE INDEX idx_hooks_target ON application.hooks(target_offer_id);
CREATE INDEX idx_hooks_cycle ON application.hooks(cycle_id);
CREATE INDEX idx_hooks_status ON application.hooks(status);

COMMENT ON TABLE application.hooks IS 'Tracks hooks between offers and cycle formation';

-- ============================================================================
-- SCHEMA: analytics
-- ============================================================================
-- Event tracking tables prepared for future use (tracking NOT enabled yet)

-- ----------------------------------------------------------------------------
-- SESSIONS TABLE
-- ----------------------------------------------------------------------------
-- Tracks user sessions for analytics correlation

CREATE TABLE analytics.sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES application.users(user_id) ON DELETE SET NULL,
  
  -- Session info
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Device/client info
  device_type VARCHAR(50),                     -- 'mobile', 'tablet', 'desktop'
  os VARCHAR(100),
  browser VARCHAR(100),
  app_version VARCHAR(50),
  
  -- IP-based region at session start
  ip_address INET,
  session_country_id UUID REFERENCES application.countries(country_id) ON DELETE SET NULL,
  session_city_id UUID REFERENCES application.cities(city_id) ON DELETE SET NULL,
  
  -- Session metadata
  referrer VARCHAR(500),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_sessions_user ON analytics.sessions(user_id);
CREATE INDEX idx_sessions_started ON analytics.sessions(started_at DESC);
CREATE INDEX idx_sessions_country ON analytics.sessions(session_country_id);

COMMENT ON TABLE analytics.sessions IS 'User sessions for analytics correlation (tracking not enabled yet)';

-- ----------------------------------------------------------------------------
-- EVENTS TABLE
-- ----------------------------------------------------------------------------
-- Core event tracking table for all analytics events

CREATE TABLE analytics.events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID,                         -- Groups related events
  session_id UUID REFERENCES analytics.sessions(session_id) ON DELETE SET NULL,
  user_id UUID REFERENCES application.users(user_id) ON DELETE SET NULL,
  
  -- Event identification
  event_name VARCHAR(100) NOT NULL,            -- e.g., 'page_view', 'button_click', 'offer_created'
  event_category VARCHAR(50),                  -- e.g., 'navigation', 'engagement', 'conversion'
  
  -- Context
  screen_name VARCHAR(100),                    -- Current screen/page
  component_name VARCHAR(100),                 -- Component that triggered event
  action_source VARCHAR(100),                  -- Button/element identifier
  
  -- Event data (flexible)
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timing
  event_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Platform info
  platform VARCHAR(50),                        -- 'web', 'ios', 'android'
  app_version VARCHAR(50),
  
  -- IP-based region snapshot
  event_country_id UUID REFERENCES application.countries(country_id) ON DELETE SET NULL,
  event_city_id UUID REFERENCES application.cities(city_id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Partition-ready indexes for high-volume event data
CREATE INDEX idx_events_timestamp ON analytics.events(event_timestamp DESC);
CREATE INDEX idx_events_user ON analytics.events(user_id);
CREATE INDEX idx_events_session ON analytics.events(session_id);
CREATE INDEX idx_events_name ON analytics.events(event_name);
CREATE INDEX idx_events_category ON analytics.events(event_category);
CREATE INDEX idx_events_screen ON analytics.events(screen_name);
CREATE INDEX idx_events_correlation ON analytics.events(correlation_id);

COMMENT ON TABLE analytics.events IS 'Core event tracking table (tracking not enabled yet)';
COMMENT ON COLUMN analytics.events.metadata IS 'Flexible JSONB for event-specific data';

-- ----------------------------------------------------------------------------
-- EVENT TYPES TABLE (Reference table for event definitions)
-- ----------------------------------------------------------------------------

CREATE TABLE analytics.event_types (
  event_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(100) NOT NULL UNIQUE,
  event_category VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE analytics.event_types IS 'Reference table defining valid event types';

-- ----------------------------------------------------------------------------
-- AGGREGATED METRICS TABLE (for pre-computed analytics)
-- ----------------------------------------------------------------------------

CREATE TABLE analytics.daily_metrics (
  metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  
  -- Dimensions
  barter_type_id UUID REFERENCES application.barter_types(barter_type_id) ON DELETE SET NULL,
  category_id UUID REFERENCES application.categories(category_id) ON DELETE SET NULL,
  country_id UUID REFERENCES application.countries(country_id) ON DELETE SET NULL,
  
  -- Values
  metric_value DECIMAL(20, 4),
  metric_count INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(metric_date, metric_name, barter_type_id, category_id, country_id)
);

CREATE INDEX idx_daily_metrics_date ON analytics.daily_metrics(metric_date DESC);
CREATE INDEX idx_daily_metrics_name ON analytics.daily_metrics(metric_name);

COMMENT ON TABLE analytics.daily_metrics IS 'Pre-aggregated daily metrics for dashboards';

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================

-- Application schema triggers
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON application.countries
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON application.states
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON application.cities
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_zip_codes_updated_at BEFORE UPDATE ON application.zip_codes
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON application.users
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_barter_types_updated_at BEFORE UPDATE ON application.barter_types
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON application.categories
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON application.subcategories
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON application.products
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON application.offers
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_offer_images_updated_at BEFORE UPDATE ON application.offer_images
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

CREATE TRIGGER update_hooks_updated_at BEFORE UPDATE ON application.hooks
  FOR EACH ROW EXECUTE FUNCTION application.update_updated_at_column();

-- Analytics schema triggers
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON analytics.sessions
  FOR EACH ROW EXECUTE FUNCTION analytics.update_updated_at_column();

CREATE TRIGGER update_event_types_updated_at BEFORE UPDATE ON analytics.event_types
  FOR EACH ROW EXECUTE FUNCTION analytics.update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON analytics.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION analytics.update_updated_at_column();

-- ============================================================================
-- AUTO-CREATE USER PROFILE ON AUTH SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION application.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO application.users (
    user_id,
    email,
    first_name,
    last_name,
    display_name,
    is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', NULL),
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'first_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    TRUE
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = application;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION application.handle_new_user();

COMMENT ON FUNCTION application.handle_new_user IS 'Auto-creates user profile in application.users when auth user signs up';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- RLS is enabled but policies allow most read access initially.
-- Tighten policies as needed for production.

-- Enable RLS on all application tables
ALTER TABLE application.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.zip_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.barter_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.offer_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.hooks ENABLE ROW LEVEL SECURITY;

-- Geo tables: Public read access
CREATE POLICY "countries_read_all" ON application.countries FOR SELECT USING (true);
CREATE POLICY "states_read_all" ON application.states FOR SELECT USING (true);
CREATE POLICY "cities_read_all" ON application.cities FOR SELECT USING (true);
CREATE POLICY "zip_codes_read_all" ON application.zip_codes FOR SELECT USING (true);

-- Catalog tables: Public read access
CREATE POLICY "barter_types_read_all" ON application.barter_types FOR SELECT USING (true);
CREATE POLICY "categories_read_all" ON application.categories FOR SELECT USING (true);
CREATE POLICY "subcategories_read_all" ON application.subcategories FOR SELECT USING (true);

-- Users: Read own, update own
CREATE POLICY "users_read_own" ON application.users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_read_basic" ON application.users FOR SELECT USING (true);  -- Allow reading basic info
CREATE POLICY "users_update_own" ON application.users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own" ON application.users FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products: Public read, authenticated create
CREATE POLICY "products_read_all" ON application.products FOR SELECT USING (true);
CREATE POLICY "products_insert_authenticated" ON application.products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "products_update_creator" ON application.products FOR UPDATE USING (auth.uid() = created_by_user_id);

-- Offers: Public read active, owner full access
CREATE POLICY "offers_read_active" ON application.offers FOR SELECT USING (status = 'active' OR auth.uid() = created_by_user_id);
CREATE POLICY "offers_insert_own" ON application.offers FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);
CREATE POLICY "offers_update_own" ON application.offers FOR UPDATE USING (auth.uid() = created_by_user_id);
CREATE POLICY "offers_delete_own" ON application.offers FOR DELETE USING (auth.uid() = created_by_user_id);

-- Offer images: Same as offers
CREATE POLICY "offer_images_read" ON application.offer_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM application.offers WHERE offer_id = application.offer_images.offer_id AND (status = 'active' OR created_by_user_id = auth.uid()))
);
CREATE POLICY "offer_images_insert_own" ON application.offer_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM application.offers WHERE offer_id = application.offer_images.offer_id AND created_by_user_id = auth.uid())
);
CREATE POLICY "offer_images_update_own" ON application.offer_images FOR UPDATE USING (
  EXISTS (SELECT 1 FROM application.offers WHERE offer_id = application.offer_images.offer_id AND created_by_user_id = auth.uid())
);
CREATE POLICY "offer_images_delete_own" ON application.offer_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM application.offers WHERE offer_id = application.offer_images.offer_id AND created_by_user_id = auth.uid())
);

-- Hooks: Read own hooks, create authenticated
CREATE POLICY "hooks_read_own" ON application.hooks FOR SELECT USING (
  EXISTS (SELECT 1 FROM application.offers WHERE (offer_id = source_offer_id OR offer_id = target_offer_id) AND created_by_user_id = auth.uid())
);
CREATE POLICY "hooks_insert_authenticated" ON application.hooks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Analytics tables: Read/write for authenticated (for future use)
ALTER TABLE analytics.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_read_own" ON analytics.sessions FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "sessions_insert" ON analytics.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "events_read_own" ON analytics.events FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "events_insert" ON analytics.events FOR INSERT WITH CHECK (true);
CREATE POLICY "event_types_read" ON analytics.event_types FOR SELECT USING (true);
CREATE POLICY "daily_metrics_read" ON analytics.daily_metrics FOR SELECT USING (true);

-- Grant table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA application TO authenticated;
GRANT INSERT, UPDATE, DELETE ON application.users TO authenticated;
GRANT INSERT, UPDATE ON application.products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON application.offers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON application.offer_images TO authenticated;
GRANT INSERT ON application.hooks TO authenticated;

GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA analytics TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'BARTER-X DATABASE SETUP COMPLETE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Schemas created: application, analytics';
  RAISE NOTICE 'Tables created in application: countries, states, cities, zip_codes,';
  RAISE NOTICE '  users, barter_types, categories, subcategories, products,';
  RAISE NOTICE '  offers, offer_images, hooks';
  RAISE NOTICE 'Tables created in analytics: sessions, events, event_types, daily_metrics';
  RAISE NOTICE 'RLS policies: Enabled on all tables';
  RAISE NOTICE 'Triggers: updated_at auto-update on all tables';
  RAISE NOTICE 'Next: Run 002_seed_catalog_data.sql to populate catalog data';
  RAISE NOTICE '============================================================';
END $$;
