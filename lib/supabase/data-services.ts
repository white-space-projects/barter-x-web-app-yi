/**
 * ============================================================================
 * SUPABASE DATA SERVICES
 * ============================================================================
 * Provides typed functions for fetching and mutating data from Supabase.
 * Uses the `application` schema for all core business tables.
 * 
 * Usage:
 * - Server Components: import { createClient } from "@/lib/supabase/server"
 * - Client Components: import { createClient } from "@/lib/supabase/client"
 * - Then pass the client to these service functions
 * ============================================================================
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { 
  Product, 
  Offer, 
  Hook, 
  ProductType, 
  LockLevel,
  NotificationState,
  OfferInfoFieldValue,
  OfferImage,
  DashboardStats 
} from "@/lib/types";

// ============================================================================
// DATABASE ROW TYPES (matching Supabase schema)
// ============================================================================

interface DbProduct {
  product_id: string;
  barter_type_id: string;
  category_id: string;
  subcategory_id: string;
  brand_id: string | null;
  model: string | null;
  title: string;
  description: string | null;
  image_key: string | null;
  product_info: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  escrow_amount: number | null;
  // Joined fields
  barter_type?: { slug: string; name: string };
  category?: { name: string; slug: string };
  subcategory?: { name: string; slug: string };
  brand?: { name: string; slug: string };
  offer_count?: number;
}

interface DbOffer {
  offer_id: string;
  product_id: string;
  created_by_user_id: string;
  title: string | null;
  description: string | null;
  condition: string | null;
  pickup_country_id: string | null;
  pickup_city_id: string | null;
  pickup_address: string | null;
  pickup_notes: string | null;
  pickup_datetime: string | null;
  pickup_ready_date: string | null;
  status: string;
  exchange_preferences: Record<string, unknown>;
  hook_status: string;
  ready_state: boolean;
  ready_updated_at: string | null;
  escrow_paid: boolean;
  escrow_paid_at: string | null;
  lock_level: number;
  lock_updated_at: string | null;
  notification_state: number;
  notification_updated_at: string | null;
  is_active: boolean;
  is_active_updated_at: string | null;
  offer_info: OfferInfoFieldValue[];
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  pickup_country?: { name: string; country_code: string };
  pickup_city?: { name: string };
  images?: DbOfferImage[];
  hooked_count?: number;
  outgoing_hook_count?: number;
}

interface DbOfferImage {
  image_id: string;
  offer_id: string;
  image_key: string;
  slot_number: number;
  original_filename: string | null;
  created_at: string;
}

interface DbHook {
  hook_id: string;
  source_offer_id: string;
  target_offer_id: string;
  status: string;
  cycle_id: string | null;
  cycle_position: number | null;
  lock_level: number;
  lock_updated_at: string | null;
  is_active: boolean;
  is_active_updated_at: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  exchanged_date: string | null;
  correlation_id?: string;
}

interface DbBarterType {
  barter_type_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
}

interface DbCategory {
  category_id: string;
  barter_type_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

interface DbSubcategory {
  subcategory_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface DbBrand {
  brand_id: string;
  name: string;
  slug: string;
  logo_image_key: string | null;
  is_active: boolean;
  sort_order: number;
}

// ============================================================================
// MAPPERS: Convert DB rows to frontend types
// ============================================================================

function mapDbProductToProduct(db: DbProduct): Product {
  return {
    productId: db.product_id,
    productType: (db.barter_type?.slug || "goods") as ProductType,
    title: db.title,
    category: db.category?.name || "",
    subcategory: db.subcategory?.name,
    brand: db.brand?.name,
    model: db.model || undefined,
    imageUrl: db.image_key || "",
    offerCount: db.offer_count || 0,
    productInfo: db.product_info ? Object.entries(db.product_info).map(([key, value]) => ({
      fieldName: key,
      value: String(value),
    })) : undefined,
  };
}

function mapDbOfferToOffer(db: DbOffer): Offer {
  return {
    offerId: db.offer_id,
    productId: db.product_id,
    ownerUserId: db.created_by_user_id,
    title: db.title || "",
    description: db.description || "",
    hookedCount: db.hooked_count || 0,
    outgoingHookCount: db.outgoing_hook_count || 0,
    readyForCommit: db.ready_state && db.escrow_paid === true,
    pickupAddress: db.pickup_address ? {
      country: db.pickup_country?.name || "",
      city: db.pickup_city?.name || "",
      addressLine1: db.pickup_address,
    } : undefined,
    pickupDateTime: db.pickup_datetime || undefined,
    pickupReadyDate: db.pickup_ready_date || undefined,
    escrowAmount: undefined, // Loaded from product if needed
    images: db.images?.map((img): OfferImage => ({
      imageId: img.image_id,
      url: img.image_key,
      order: img.slot_number - 1,
      uploadedAt: new Date(img.created_at),
    })),
    offerInfo: db.offer_info || undefined,
    readyState: db.ready_state,
    readyUpdatedAt: db.ready_updated_at || undefined,
    escrowPaid: db.escrow_paid,
    escrowPaidAt: db.escrow_paid_at || undefined,
    lockLevel: db.lock_level as LockLevel,
    lockUpdatedAt: db.lock_updated_at || undefined,
    notificationState: db.notification_state as NotificationState,
    notificationUpdatedAt: db.notification_updated_at || undefined,
    isActive: db.is_active,
    isActiveUpdatedAt: db.is_active_updated_at || undefined,
  };
}

function mapDbHookToHook(db: DbHook): Hook {
  return {
    hookId: db.hook_id,
    correlationId: db.correlation_id || db.cycle_id || db.hook_id,
    fromOfferId: db.source_offer_id,
    toOfferId: db.target_offer_id,
    status: db.status as Hook["status"],
    reservedCycleId: db.cycle_id || undefined,
    exchangedDate: db.exchanged_date || undefined,
    lockLevel: db.lock_level as LockLevel,
    lockUpdatedAt: db.lock_updated_at || undefined,
    isActive: db.is_active,
    isActiveUpdatedAt: db.is_active_updated_at || undefined,
  };
}

// ============================================================================
// PRODUCTS SERVICE
// ============================================================================

export async function fetchProducts(
  supabase: SupabaseClient,
  options?: {
    barterTypeSlug?: ProductType;
    countryId?: string;
    cityId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ products: Product[]; total: number }> {
  console.log("[v0] fetchProducts called with options:", options);
  
  let query = supabase
    .schema("application")
    .from("products")
    .select(`
      *,
      barter_type:barter_types(slug, name),
      category:categories(name, slug),
      subcategory:subcategories(name, slug),
      brand:brands(name, slug)
    `, { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (options?.barterTypeSlug) {
    // First get the barter_type_id for the slug
    const { data: barterType } = await supabase
      .schema("application")
      .from("barter_types")
      .select("barter_type_id")
      .eq("slug", options.barterTypeSlug)
      .single();
    
    if (barterType) {
      query = query.eq("barter_type_id", barterType.barter_type_id);
    }
    console.log("[v0] Barter type lookup for", options.barterTypeSlug, ":", barterType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error, count } = await query;
  
  console.log("[v0] Supabase query result - data:", data?.length, "error:", error, "count:", count);

  if (error) {
    console.error("[v0] Error fetching products:", error);
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  // Fetch offer counts for each product
  const productIds = (data || []).map((p: DbProduct) => p.product_id);
  
  let offerCountMap: Record<string, number> = {};
  if (productIds.length > 0) {
    const { data: offerCounts } = await supabase
      .schema("application")
      .from("offers")
      .select("product_id")
      .in("product_id", productIds)
      .eq("status", "active")
      .eq("is_active", true);
    
    if (offerCounts) {
      offerCounts.forEach((o: { product_id: string }) => {
        offerCountMap[o.product_id] = (offerCountMap[o.product_id] || 0) + 1;
      });
    }
  }

  const products = (data || []).map((p: DbProduct) => 
    mapDbProductToProduct({ ...p, offer_count: offerCountMap[p.product_id] || 0 })
  );

  return { products, total: count || 0 };
}

export async function fetchProductById(
  supabase: SupabaseClient,
  productId: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .schema("application")
    .from("products")
    .select(`
      *,
      barter_type:barter_types(slug, name),
      category:categories(name, slug),
      subcategory:subcategories(name, slug),
      brand:brands(name, slug)
    `)
    .eq("product_id", productId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  // Get offer count
  const { count } = await supabase
    .schema("application")
    .from("offers")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("status", "active")
    .eq("is_active", true);

  return mapDbProductToProduct({ ...data, offer_count: count || 0 });
}

export async function createProduct(
  supabase: SupabaseClient,
  product: {
    barterTypeSlug: ProductType;
    categoryName: string;
    subcategoryName: string;
    brandName?: string;
    model?: string;
    title: string;
    description?: string;
    imageKey?: string;
    productInfo?: Record<string, unknown>;
  }
): Promise<Product> {
  // First, resolve IDs from names
  const { data: barterType } = await supabase
    .schema("application")
    .from("barter_types")
    .select("barter_type_id")
    .eq("slug", product.barterTypeSlug)
    .single();

  if (!barterType) {
    throw new Error(`Barter type not found: ${product.barterTypeSlug}`);
  }

  const { data: category } = await supabase
    .schema("application")
    .from("categories")
    .select("category_id")
    .eq("barter_type_id", barterType.barter_type_id)
    .eq("name", product.categoryName)
    .single();

  if (!category) {
    throw new Error(`Category not found: ${product.categoryName}`);
  }

  const { data: subcategory } = await supabase
    .schema("application")
    .from("subcategories")
    .select("subcategory_id")
    .eq("category_id", category.category_id)
    .eq("name", product.subcategoryName)
    .single();

  if (!subcategory) {
    throw new Error(`Subcategory not found: ${product.subcategoryName}`);
  }

  let brandId = null;
  if (product.brandName) {
    const { data: brand } = await supabase
      .schema("application")
      .from("brands")
      .select("brand_id")
      .eq("name", product.brandName)
      .single();
    brandId = brand?.brand_id;
  }

  const { data, error } = await supabase
    .schema("application")
    .from("products")
    .insert({
      barter_type_id: barterType.barter_type_id,
      category_id: category.category_id,
      subcategory_id: subcategory.subcategory_id,
      brand_id: brandId,
      model: product.model,
      title: product.title,
      description: product.description,
      image_key: product.imageKey,
      product_info: product.productInfo || {},
    })
    .select(`
      *,
      barter_type:barter_types(slug, name),
      category:categories(name, slug),
      subcategory:subcategories(name, slug),
      brand:brands(name, slug)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return mapDbProductToProduct({ ...data, offer_count: 0 });
}

// ============================================================================
// OFFERS SERVICE
// ============================================================================

export async function fetchOffers(
  supabase: SupabaseClient,
  options?: {
    productId?: string;
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ offers: Offer[]; total: number }> {
  let query = supabase
    .schema("application")
    .from("offers")
    .select(`
      *,
      pickup_country:countries(name, country_code),
      pickup_city:cities(name),
      images:offer_images(*)
    `, { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (options?.productId) {
    query = query.eq("product_id", options.productId);
  }

  if (options?.userId) {
    query = query.eq("created_by_user_id", options.userId);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[v0] Error fetching offers:", error);
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  // Fetch hooked counts
  const offerIds = (data || []).map((o: DbOffer) => o.offer_id);
  let hookedCountMap: Record<string, number> = {};
  let outgoingCountMap: Record<string, number> = {};
  
  if (offerIds.length > 0) {
    // Incoming hooks (offers hooked TO these offers)
    const { data: incomingHooks } = await supabase
      .schema("application")
      .from("hooks")
      .select("target_offer_id")
      .in("target_offer_id", offerIds)
      .eq("is_active", true);
    
    if (incomingHooks) {
      incomingHooks.forEach((h: { target_offer_id: string }) => {
        hookedCountMap[h.target_offer_id] = (hookedCountMap[h.target_offer_id] || 0) + 1;
      });
    }

    // Outgoing hooks (hooks FROM these offers)
    const { data: outgoingHooks } = await supabase
      .schema("application")
      .from("hooks")
      .select("source_offer_id")
      .in("source_offer_id", offerIds)
      .eq("is_active", true);
    
    if (outgoingHooks) {
      outgoingHooks.forEach((h: { source_offer_id: string }) => {
        outgoingCountMap[h.source_offer_id] = (outgoingCountMap[h.source_offer_id] || 0) + 1;
      });
    }
  }

  const offers = (data || []).map((o: DbOffer) => 
    mapDbOfferToOffer({ 
      ...o, 
      hooked_count: hookedCountMap[o.offer_id] || 0,
      outgoing_hook_count: outgoingCountMap[o.offer_id] || 0,
    })
  );

  return { offers, total: count || 0 };
}

export async function fetchOfferById(
  supabase: SupabaseClient,
  offerId: string
): Promise<Offer | null> {
  const { data, error } = await supabase
    .schema("application")
    .from("offers")
    .select(`
      *,
      pickup_country:countries(name, country_code),
      pickup_city:cities(name),
      images:offer_images(*)
    `)
    .eq("offer_id", offerId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch offer: ${error.message}`);
  }

  // Get hook counts
  const { count: hookedCount } = await supabase
    .schema("application")
    .from("hooks")
    .select("*", { count: "exact", head: true })
    .eq("target_offer_id", offerId)
    .eq("is_active", true);

  const { count: outgoingCount } = await supabase
    .schema("application")
    .from("hooks")
    .select("*", { count: "exact", head: true })
    .eq("source_offer_id", offerId)
    .eq("is_active", true);

  return mapDbOfferToOffer({ 
    ...data, 
    hooked_count: hookedCount || 0,
    outgoing_hook_count: outgoingCount || 0,
  });
}

export async function createOffer(
  supabase: SupabaseClient,
  offer: {
    productId: string;
    userId: string;
    title: string;
    description?: string;
    condition?: string;
    pickupCountryId?: string;
    pickupCityId?: string;
    pickupAddress?: string;
    offerInfo?: OfferInfoFieldValue[];
  }
): Promise<Offer> {
  const { data, error } = await supabase
    .schema("application")
    .from("offers")
    .insert({
      product_id: offer.productId,
      created_by_user_id: offer.userId,
      title: offer.title,
      description: offer.description,
      condition: offer.condition,
      pickup_country_id: offer.pickupCountryId,
      pickup_city_id: offer.pickupCityId,
      pickup_address: offer.pickupAddress,
      offer_info: offer.offerInfo || [],
      status: "active",
      hook_status: "searching",
      ready_state: false,
      escrow_paid: false,
      lock_level: 0,
      notification_state: 0,
      is_active: true,
    })
    .select(`
      *,
      pickup_country:countries(name, country_code),
      pickup_city:cities(name),
      images:offer_images(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create offer: ${error.message}`);
  }

  return mapDbOfferToOffer({ ...data, hooked_count: 0, outgoing_hook_count: 0 });
}

export async function updateOffer(
  supabase: SupabaseClient,
  offerId: string,
  updates: Partial<{
    title: string;
    description: string;
    condition: string;
    pickupCountryId: string;
    pickupCityId: string;
    pickupAddress: string;
    offerInfo: OfferInfoFieldValue[];
    readyState: boolean;
    escrowPaid: boolean;
    lockLevel: LockLevel;
    notificationState: NotificationState;
    isActive: boolean;
  }>
): Promise<Offer> {
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
  if (updates.pickupCountryId !== undefined) dbUpdates.pickup_country_id = updates.pickupCountryId;
  if (updates.pickupCityId !== undefined) dbUpdates.pickup_city_id = updates.pickupCityId;
  if (updates.pickupAddress !== undefined) dbUpdates.pickup_address = updates.pickupAddress;
  if (updates.offerInfo !== undefined) dbUpdates.offer_info = updates.offerInfo;
  if (updates.readyState !== undefined) {
    dbUpdates.ready_state = updates.readyState;
    dbUpdates.ready_updated_at = new Date().toISOString();
  }
  if (updates.escrowPaid !== undefined) {
    dbUpdates.escrow_paid = updates.escrowPaid;
    if (updates.escrowPaid) dbUpdates.escrow_paid_at = new Date().toISOString();
  }
  if (updates.lockLevel !== undefined) {
    dbUpdates.lock_level = updates.lockLevel;
    dbUpdates.lock_updated_at = new Date().toISOString();
  }
  if (updates.notificationState !== undefined) {
    dbUpdates.notification_state = updates.notificationState;
    dbUpdates.notification_updated_at = new Date().toISOString();
  }
  if (updates.isActive !== undefined) {
    dbUpdates.is_active = updates.isActive;
    dbUpdates.is_active_updated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .schema("application")
    .from("offers")
    .update(dbUpdates)
    .eq("offer_id", offerId)
    .select(`
      *,
      pickup_country:countries(name, country_code),
      pickup_city:cities(name),
      images:offer_images(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update offer: ${error.message}`);
  }

  return mapDbOfferToOffer(data);
}

export async function deleteOffer(
  supabase: SupabaseClient,
  offerId: string
): Promise<void> {
  // Soft delete - set is_active to false
  const { error } = await supabase
    .schema("application")
    .from("offers")
    .update({ 
      is_active: false, 
      is_active_updated_at: new Date().toISOString(),
      status: "deleted",
    })
    .eq("offer_id", offerId);

  if (error) {
    throw new Error(`Failed to delete offer: ${error.message}`);
  }
}

// ============================================================================
// HOOKS SERVICE
// ============================================================================

export async function fetchHooks(
  supabase: SupabaseClient,
  options?: {
    userId?: string;
    sourceOfferId?: string;
    targetOfferId?: string;
    status?: string;
    limit?: number;
  }
): Promise<Hook[]> {
  let query = supabase
    .schema("application")
    .from("hooks")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (options?.sourceOfferId) {
    query = query.eq("source_offer_id", options.sourceOfferId);
  }

  if (options?.targetOfferId) {
    query = query.eq("target_offer_id", options.targetOfferId);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  // If userId is provided, filter by hooks where user owns source or target offer
  if (options?.userId) {
    // First get all offer IDs owned by this user
    const { data: userOffers } = await supabase
      .schema("application")
      .from("offers")
      .select("offer_id")
      .eq("created_by_user_id", options.userId)
      .eq("is_active", true);
    
    if (userOffers && userOffers.length > 0) {
      const offerIds = userOffers.map((o: { offer_id: string }) => o.offer_id);
      query = query.or(`source_offer_id.in.(${offerIds.join(",")}),target_offer_id.in.(${offerIds.join(",")})`);
    } else {
      return []; // No offers means no hooks
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("[v0] Error fetching hooks:", error);
    throw new Error(`Failed to fetch hooks: ${error.message}`);
  }

  return (data || []).map(mapDbHookToHook);
}

export async function createHook(
  supabase: SupabaseClient,
  hook: {
    sourceOfferId: string;
    targetOfferId: string;
    correlationId?: string;
  }
): Promise<Hook> {
  const { data, error } = await supabase
    .schema("application")
    .from("hooks")
    .insert({
      source_offer_id: hook.sourceOfferId,
      target_offer_id: hook.targetOfferId,
      cycle_id: hook.correlationId,
      status: "pending",
      lock_level: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create hook: ${error.message}`);
  }

  return mapDbHookToHook(data);
}

export async function updateHook(
  supabase: SupabaseClient,
  hookId: string,
  updates: Partial<{
    status: Hook["status"];
    lockLevel: LockLevel;
    cycleId: string;
    isActive: boolean;
  }>
): Promise<Hook> {
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.lockLevel !== undefined) {
    dbUpdates.lock_level = updates.lockLevel;
    dbUpdates.lock_updated_at = new Date().toISOString();
  }
  if (updates.cycleId !== undefined) dbUpdates.cycle_id = updates.cycleId;
  if (updates.isActive !== undefined) {
    dbUpdates.is_active = updates.isActive;
    dbUpdates.is_active_updated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .schema("application")
    .from("hooks")
    .update(dbUpdates)
    .eq("hook_id", hookId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update hook: ${error.message}`);
  }

  return mapDbHookToHook(data);
}

export async function deleteHook(
  supabase: SupabaseClient,
  hookId: string
): Promise<void> {
  const { error } = await supabase
    .schema("application")
    .from("hooks")
    .update({ 
      is_active: false, 
      is_active_updated_at: new Date().toISOString() 
    })
    .eq("hook_id", hookId);

  if (error) {
    throw new Error(`Failed to delete hook: ${error.message}`);
  }
}

// ============================================================================
// CATALOG SERVICE (Barter Types, Categories, Subcategories, Brands)
// ============================================================================

export async function fetchBarterTypes(
  supabase: SupabaseClient
): Promise<DbBarterType[]> {
  const { data, error } = await supabase
    .schema("application")
    .from("barter_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw new Error(`Failed to fetch barter types: ${error.message}`);
  }

  return data || [];
}

export async function fetchCategories(
  supabase: SupabaseClient,
  barterTypeId?: string
): Promise<DbCategory[]> {
  let query = supabase
    .schema("application")
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (barterTypeId) {
    query = query.eq("barter_type_id", barterTypeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data || [];
}

export async function fetchSubcategories(
  supabase: SupabaseClient,
  categoryId?: string
): Promise<DbSubcategory[]> {
  let query = supabase
    .schema("application")
    .from("subcategories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch subcategories: ${error.message}`);
  }

  return data || [];
}

export async function fetchBrands(
  supabase: SupabaseClient
): Promise<DbBrand[]> {
  const { data, error } = await supabase
    .schema("application")
    .from("brands")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw new Error(`Failed to fetch brands: ${error.message}`);
  }

  return data || [];
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function fetchDashboardStats(
  supabase: SupabaseClient
): Promise<DashboardStats> {
  // Get total users
  const { count: totalUsers } = await supabase
    .schema("application")
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Get active offers
  const { count: activeOffers } = await supabase
    .schema("application")
    .from("offers")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("status", "active");

  // Get active hooks
  const { count: activeHooks } = await supabase
    .schema("application")
    .from("hooks")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Get reserved cycles (hooks with status reserved or processing)
  const { count: reservedCycles } = await supabase
    .schema("application")
    .from("hooks")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .in("status", ["reserved", "processing"]);

  // Get committed offers (lock_level >= 2)
  const { count: committedOffers } = await supabase
    .schema("application")
    .from("offers")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .gte("lock_level", 2);

  // Get total products
  const { count: totalProducts } = await supabase
    .schema("application")
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  return {
    totalUsers: totalUsers || 0,
    activeOffers: activeOffers || 0,
    activeHooks: activeHooks || 0,
    reservedCycles: reservedCycles || 0,
    committedOffers: committedOffers || 0,
    totalProducts: totalProducts || 0,
  };
}
