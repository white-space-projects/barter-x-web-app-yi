-- ============================================================================
-- API FUNCTIONS FOR ACCESSING APPLICATION SCHEMA
-- ============================================================================
-- These functions allow the Supabase client to query the application schema
-- via RPC calls, bypassing the need to expose the schema directly.
-- ============================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_products(text, int, int);
DROP FUNCTION IF EXISTS public.get_product_by_id(uuid);
DROP FUNCTION IF EXISTS public.get_offers(uuid, uuid, int, int);
DROP FUNCTION IF EXISTS public.get_offer_by_id(uuid);
DROP FUNCTION IF EXISTS public.get_hooks(uuid, uuid, uuid, int, int);
DROP FUNCTION IF EXISTS public.get_barter_types();
DROP FUNCTION IF EXISTS public.get_categories(uuid);
DROP FUNCTION IF EXISTS public.get_subcategories(uuid);
DROP FUNCTION IF EXISTS public.get_brands();

-- ============================================================================
-- GET PRODUCTS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_products(
  p_barter_type_slug text DEFAULT NULL,
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  product_id uuid,
  title text,
  description text,
  image_key text,
  barter_type_id uuid,
  category_id uuid,
  subcategory_id uuid,
  brand_id uuid,
  model text,
  product_info jsonb,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  barter_type_slug text,
  barter_type_name text,
  category_name text,
  category_slug text,
  subcategory_name text,
  subcategory_slug text,
  brand_name text,
  brand_slug text,
  offer_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.product_id,
    p.title,
    p.description,
    p.image_key,
    p.barter_type_id,
    p.category_id,
    p.subcategory_id,
    p.brand_id,
    p.model,
    p.product_info,
    p.is_active,
    p.created_at,
    p.updated_at,
    bt.slug::text as barter_type_slug,
    bt.name::text as barter_type_name,
    c.name::text as category_name,
    c.slug::text as category_slug,
    sc.name::text as subcategory_name,
    sc.slug::text as subcategory_slug,
    b.name::text as brand_name,
    b.slug::text as brand_slug,
    COALESCE((
      SELECT COUNT(*) 
      FROM application.offers o 
      WHERE o.product_id = p.product_id 
        AND o.is_active = true 
        AND o.status = 'active'
    ), 0)::bigint as offer_count
  FROM application.products p
  LEFT JOIN application.barter_types bt ON p.barter_type_id = bt.barter_type_id
  LEFT JOIN application.categories c ON p.category_id = c.category_id
  LEFT JOIN application.subcategories sc ON p.subcategory_id = sc.subcategory_id
  LEFT JOIN application.brands b ON p.brand_id = b.brand_id
  WHERE p.is_active = true
    AND (p_barter_type_slug IS NULL OR bt.slug = p_barter_type_slug)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- GET PRODUCT BY ID
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_product_by_id(p_product_id uuid)
RETURNS TABLE (
  product_id uuid,
  title text,
  description text,
  image_key text,
  barter_type_id uuid,
  category_id uuid,
  subcategory_id uuid,
  brand_id uuid,
  model text,
  product_info jsonb,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  barter_type_slug text,
  barter_type_name text,
  category_name text,
  category_slug text,
  subcategory_name text,
  subcategory_slug text,
  brand_name text,
  brand_slug text,
  offer_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.product_id,
    p.title,
    p.description,
    p.image_key,
    p.barter_type_id,
    p.category_id,
    p.subcategory_id,
    p.brand_id,
    p.model,
    p.product_info,
    p.is_active,
    p.created_at,
    p.updated_at,
    bt.slug::text,
    bt.name::text,
    c.name::text,
    c.slug::text,
    sc.name::text,
    sc.slug::text,
    b.name::text,
    b.slug::text,
    COALESCE((
      SELECT COUNT(*) 
      FROM application.offers o 
      WHERE o.product_id = p.product_id 
        AND o.is_active = true 
        AND o.status = 'active'
    ), 0)::bigint
  FROM application.products p
  LEFT JOIN application.barter_types bt ON p.barter_type_id = bt.barter_type_id
  LEFT JOIN application.categories c ON p.category_id = c.category_id
  LEFT JOIN application.subcategories sc ON p.subcategory_id = sc.subcategory_id
  LEFT JOIN application.brands b ON p.brand_id = b.brand_id
  WHERE p.product_id = p_product_id;
END;
$$;

-- ============================================================================
-- GET OFFERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_offers(
  p_product_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  offer_id uuid,
  product_id uuid,
  created_by_user_id uuid,
  title text,
  description text,
  condition text,
  pickup_country_id uuid,
  pickup_city_id uuid,
  pickup_address text,
  pickup_notes text,
  pickup_datetime timestamptz,
  pickup_ready_date date,
  status text,
  exchange_preferences jsonb,
  hook_status text,
  ready_state boolean,
  ready_updated_at timestamptz,
  escrow_paid boolean,
  escrow_paid_at timestamptz,
  lock_level int,
  lock_updated_at timestamptz,
  notification_state int,
  notification_updated_at timestamptz,
  is_active boolean,
  is_active_updated_at timestamptz,
  offer_info jsonb,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  pickup_country_name text,
  pickup_country_code text,
  pickup_city_name text,
  hooked_count bigint,
  outgoing_hook_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.offer_id,
    o.product_id,
    o.created_by_user_id,
    o.title,
    o.description,
    o.condition,
    o.pickup_country_id,
    o.pickup_city_id,
    o.pickup_address,
    o.pickup_notes,
    o.pickup_datetime,
    o.pickup_ready_date,
    o.status::text,
    o.exchange_preferences,
    o.hook_status::text,
    o.ready_state,
    o.ready_updated_at,
    o.escrow_paid,
    o.escrow_paid_at,
    o.lock_level,
    o.lock_updated_at,
    o.notification_state,
    o.notification_updated_at,
    o.is_active,
    o.is_active_updated_at,
    o.offer_info,
    o.expires_at,
    o.created_at,
    o.updated_at,
    cn.name::text as pickup_country_name,
    cn.country_code::text as pickup_country_code,
    ct.name::text as pickup_city_name,
    COALESCE((
      SELECT COUNT(*) 
      FROM application.hooks h 
      WHERE h.target_offer_id = o.offer_id AND h.is_active = true
    ), 0)::bigint as hooked_count,
    COALESCE((
      SELECT COUNT(*) 
      FROM application.hooks h 
      WHERE h.source_offer_id = o.offer_id AND h.is_active = true
    ), 0)::bigint as outgoing_hook_count
  FROM application.offers o
  LEFT JOIN application.countries cn ON o.pickup_country_id = cn.country_id
  LEFT JOIN application.cities ct ON o.pickup_city_id = ct.city_id
  WHERE o.is_active = true
    AND (p_product_id IS NULL OR o.product_id = p_product_id)
    AND (p_user_id IS NULL OR o.created_by_user_id = p_user_id)
  ORDER BY o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- GET HOOKS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_hooks(
  p_user_id uuid DEFAULT NULL,
  p_source_offer_id uuid DEFAULT NULL,
  p_target_offer_id uuid DEFAULT NULL,
  p_limit int DEFAULT 200,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  hook_id uuid,
  source_offer_id uuid,
  target_offer_id uuid,
  status text,
  cycle_id uuid,
  cycle_position int,
  lock_level int,
  lock_updated_at timestamptz,
  is_active boolean,
  is_active_updated_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  confirmed_at timestamptz,
  exchanged_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.hook_id,
    h.source_offer_id,
    h.target_offer_id,
    h.status::text,
    h.cycle_id,
    h.cycle_position,
    h.lock_level,
    h.lock_updated_at,
    h.is_active,
    h.is_active_updated_at,
    h.created_at,
    h.updated_at,
    h.confirmed_at,
    h.exchanged_date
  FROM application.hooks h
  WHERE h.is_active = true
    AND (p_source_offer_id IS NULL OR h.source_offer_id = p_source_offer_id)
    AND (p_target_offer_id IS NULL OR h.target_offer_id = p_target_offer_id)
    AND (p_user_id IS NULL OR EXISTS (
      SELECT 1 FROM application.offers o 
      WHERE (o.offer_id = h.source_offer_id OR o.offer_id = h.target_offer_id)
        AND o.created_by_user_id = p_user_id
    ))
  ORDER BY h.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- GET BARTER TYPES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_barter_types()
RETURNS TABLE (
  barter_type_id uuid,
  name text,
  slug text,
  description text,
  icon text,
  color text,
  sort_order int,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bt.barter_type_id,
    bt.name::text,
    bt.slug::text,
    bt.description::text,
    bt.icon::text,
    bt.color::text,
    bt.sort_order,
    bt.is_active
  FROM application.barter_types bt
  WHERE bt.is_active = true
  ORDER BY bt.sort_order;
END;
$$;

-- ============================================================================
-- GET CATEGORIES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_categories(p_barter_type_id uuid DEFAULT NULL)
RETURNS TABLE (
  category_id uuid,
  barter_type_id uuid,
  name text,
  slug text,
  description text,
  icon text,
  sort_order int,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.category_id,
    c.barter_type_id,
    c.name::text,
    c.slug::text,
    c.description::text,
    c.icon::text,
    c.sort_order,
    c.is_active
  FROM application.categories c
  WHERE c.is_active = true
    AND (p_barter_type_id IS NULL OR c.barter_type_id = p_barter_type_id)
  ORDER BY c.sort_order;
END;
$$;

-- ============================================================================
-- GET SUBCATEGORIES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_subcategories(p_category_id uuid DEFAULT NULL)
RETURNS TABLE (
  subcategory_id uuid,
  category_id uuid,
  name text,
  slug text,
  description text,
  sort_order int,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.subcategory_id,
    sc.category_id,
    sc.name::text,
    sc.slug::text,
    sc.description::text,
    sc.sort_order,
    sc.is_active
  FROM application.subcategories sc
  WHERE sc.is_active = true
    AND (p_category_id IS NULL OR sc.category_id = p_category_id)
  ORDER BY sc.sort_order;
END;
$$;

-- ============================================================================
-- GET BRANDS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_brands()
RETURNS TABLE (
  brand_id uuid,
  name text,
  slug text,
  logo_image_key text,
  is_active boolean,
  sort_order int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.brand_id,
    b.name::text,
    b.slug::text,
    b.logo_image_key::text,
    b.is_active,
    b.sort_order
  FROM application.brands b
  WHERE b.is_active = true
  ORDER BY b.sort_order, b.name;
END;
$$;

-- Grant execute permissions to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_products TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_product_by_id TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_offers TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_hooks TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_barter_types TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_categories TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_subcategories TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_brands TO authenticated, anon;
