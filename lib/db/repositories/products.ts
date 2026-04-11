/**
 * Products Repository
 * ====================
 * Server-side data access for products from application schema.
 * Uses direct PostgreSQL connection.
 * 
 * Easy to replace with Laravel API calls later.
 */

import { query } from "../postgres";
import type { Product, ProductType } from "@/lib/types";

/**
 * Safely parse JSONB - handles both string and already-parsed object
 * PostgreSQL driver may return JSONB as string depending on configuration
 */
function parseJsonb<T>(value: unknown): T | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

interface DbProduct {
  product_id: string;
  title: string;
  description: string | null;
  image_key: string | null;
  barter_type_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  brand_id: string | null;
  model: string | null;
  product_info: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  barter_type_slug: string | null;
  barter_type_name: string | null;
  category_name: string | null;
  category_slug: string | null;
  subcategory_name: string | null;
  subcategory_slug: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  offer_count: string | null;
}

/**
 * Map database row to Product type
 * Note: Maps to existing Product type, using productType (not barterType)
 */
function mapToProduct(row: DbProduct): Product {
  // Parse product_info JSONB - may come as string from driver
  const productInfoObj = parseJsonb<Record<string, unknown>>(row.product_info);
  
  return {
    productId: row.product_id,
    productType: (row.barter_type_slug || "goods") as ProductType,
    title: row.title,
    category: row.category_name || "",
    subcategory: row.subcategory_name || undefined,
    brand: row.brand_name || undefined,
    model: row.model || undefined,
    imageUrl: row.image_key
      ? `https://mdytcwlxlwvmioizaidu.supabase.co/storage/v1/object/public/product-images/${row.image_key}`
      : undefined,
    offerCount: parseInt(row.offer_count || "0", 10),
    productInfo: productInfoObj 
      ? Object.entries(productInfoObj).map(([key, value]) => ({ 
          fieldName: key, 
          value: String(value) 
        }))
      : undefined,
  };
}

export interface FetchProductsOptions {
  barterTypeSlug?: string;
  categorySlug?: string;
  subcategoryId?: string;
  brandId?: string;
  search?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Fetch products from application.products
 */
export async function fetchProducts(
  options: FetchProductsOptions = {}
): Promise<{ products: Product[]; total: number }> {
  const { barterTypeSlug, subcategoryId, brandId, search, includeInactive, limit = 100, offset = 0 } = options;

  // Build WHERE clause
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Only filter by is_active if not including inactive
  if (!includeInactive) {
    conditions.push("p.is_active = true");
  }

  if (barterTypeSlug) {
    conditions.push(`bt.slug = $${paramIndex}`);
    params.push(barterTypeSlug);
    paramIndex++;
  }
  
  if (subcategoryId) {
    conditions.push(`p.subcategory_id = $${paramIndex}`);
    params.push(subcategoryId);
    paramIndex++;
  }
  
  if (brandId) {
    conditions.push(`p.brand_id = $${paramIndex}`);
    params.push(brandId);
    paramIndex++;
  }
  
  if (search) {
    conditions.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count query
  const countSql = `
    SELECT COUNT(*) as total
    FROM application.products p
    LEFT JOIN application.barter_types bt ON p.barter_type_id = bt.barter_type_id
    ${whereClause}
  `;

  // Data query with offer count
  const dataSql = `
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
      bt.slug as barter_type_slug,
      bt.name as barter_type_name,
      c.name as category_name,
      c.slug as category_slug,
      sc.name as subcategory_name,
      sc.slug as subcategory_slug,
      b.name as brand_name,
      b.slug as brand_slug,
      (SELECT COUNT(*) FROM application.offers o WHERE o.product_id = p.product_id AND o.status = 'active') as offer_count
    FROM application.products p
    LEFT JOIN application.barter_types bt ON p.barter_type_id = bt.barter_type_id
    LEFT JOIN application.categories c ON p.category_id = c.category_id
    LEFT JOIN application.subcategories sc ON p.subcategory_id = sc.subcategory_id
    LEFT JOIN application.brands b ON p.brand_id = b.brand_id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  console.log("[v0] Products query with params:", { barterTypeSlug, limit, offset });

  const [countResult, products] = await Promise.all([
    query<{ total: string }>(countSql, barterTypeSlug ? [barterTypeSlug] : []),
    query<DbProduct>(dataSql, params),
  ]);

  const total = parseInt(countResult[0]?.total || "0", 10);

  console.log("[v0] Products fetched:", products.length, "total:", total);

  return {
    products: products.map(mapToProduct),
    total,
  };
}

/**
 * Catalog product type with extended fields
 */
export interface CatalogProduct {
  productId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  imageKey?: string;
  subcategoryId: string;
  brandId?: string;
  productInfo?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subcategoryName?: string;
  categoryName?: string;
  brandName?: string;
}

/**
 * Fetch products for catalog with extended fields
 */
export async function fetchProductsForCatalog(
  options: FetchProductsOptions = {}
): Promise<{ products: CatalogProduct[]; total: number }> {
  const { barterTypeSlug, subcategoryId, brandId, search, includeInactive, limit = 100, offset = 0 } = options;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (!includeInactive) {
    conditions.push("p.is_active = true");
  }

  if (barterTypeSlug) {
    conditions.push(`bt.slug = $${paramIndex}`);
    params.push(barterTypeSlug);
    paramIndex++;
  }
  
  if (subcategoryId) {
    conditions.push(`p.subcategory_id = $${paramIndex}`);
    params.push(subcategoryId);
    paramIndex++;
  }
  
  if (brandId) {
    conditions.push(`p.brand_id = $${paramIndex}`);
    params.push(brandId);
    paramIndex++;
  }
  
  if (search) {
    conditions.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count query
  const countSql = `
    SELECT COUNT(*) as total
    FROM application.products p
    LEFT JOIN application.barter_types bt ON p.barter_type_id = bt.barter_type_id
    ${whereClause}
  `;

  // Data query with all needed fields
  const dataSql = `
    SELECT 
      p.product_id,
      p.title,
      p.description,
      p.image_key,
      p.subcategory_id,
      p.brand_id,
      p.product_info,
      p.is_active,
      p.created_at,
      p.updated_at,
      c.name as category_name,
      sc.name as subcategory_name,
      b.name as brand_name
    FROM application.products p
    LEFT JOIN application.barter_types bt ON p.barter_type_id = bt.barter_type_id
    LEFT JOIN application.categories c ON p.category_id = c.category_id
    LEFT JOIN application.subcategories sc ON p.subcategory_id = sc.subcategory_id
    LEFT JOIN application.brands b ON p.brand_id = b.brand_id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const countParams = params.slice(0, -2); // Exclude limit and offset for count
  const [countResult, products] = await Promise.all([
    query<{ total: string }>(countSql, countParams),
    query<{
      product_id: string;
      title: string;
      description: string | null;
      image_key: string | null;
      subcategory_id: string;
      brand_id: string | null;
      product_info: Record<string, unknown> | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      category_name: string | null;
      subcategory_name: string | null;
      brand_name: string | null;
    }>(dataSql, params),
  ]);

  const total = parseInt(countResult[0]?.total || "0", 10);

  return {
    products: products.map(row => ({
      productId: row.product_id,
      title: row.title,
      description: row.description || undefined,
      imageUrl: row.image_key
        ? `https://mdytcwlxlwvmioizaidu.supabase.co/storage/v1/object/public/product-images/${row.image_key}`
        : undefined,
      imageKey: row.image_key || undefined,
      subcategoryId: row.subcategory_id,
      brandId: row.brand_id || undefined,
      productInfo: parseJsonb<Record<string, unknown>>(row.product_info) || undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      categoryName: row.category_name || undefined,
      subcategoryName: row.subcategory_name || undefined,
      brandName: row.brand_name || undefined,
    })),
    total,
  };
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(productId: string): Promise<Product | null> {
  const sql = `
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
      bt.slug as barter_type_slug,
      bt.name as barter_type_name,
      c.name as category_name,
      c.slug as category_slug,
      sc.name as subcategory_name,
      sc.slug as subcategory_slug,
      b.name as brand_name,
      b.slug as brand_slug
    FROM application.products p
    LEFT JOIN application.barter_types bt ON p.barter_type_id = bt.barter_type_id
    LEFT JOIN application.categories c ON p.category_id = c.category_id
    LEFT JOIN application.subcategories sc ON p.subcategory_id = sc.subcategory_id
    LEFT JOIN application.brands b ON p.brand_id = b.brand_id
    WHERE p.product_id = $1
  `;

  const result = await query<DbProduct>(sql, [productId]);
  return result[0] ? mapToProduct(result[0]) : null;
}

/**
 * Fetch barter types
 */
export async function fetchBarterTypes(): Promise<{ barterTypeId: string; slug: string; name: string }[]> {
  const sql = `SELECT barter_type_id, slug, name FROM application.barter_types WHERE is_active = true ORDER BY name`;
  const result = await query<{ barter_type_id: string; slug: string; name: string }>(sql);
  return result.map((r) => ({
    barterTypeId: r.barter_type_id,
    slug: r.slug,
    name: r.name,
  }));
}

/**
 * Fetch categories
 */
export async function fetchCategories(): Promise<{ categoryId: string; slug: string; name: string }[]> {
  const sql = `SELECT category_id, slug, name FROM application.categories WHERE is_active = true ORDER BY name`;
  const result = await query<{ category_id: string; slug: string; name: string }>(sql);
  return result.map((r) => ({
    categoryId: r.category_id,
    slug: r.slug,
    name: r.name,
  }));
}

/**
 * Fetch brands
 */
export async function fetchBrands(): Promise<{ brandId: string; slug: string; name: string }[]> {
  const sql = `SELECT brand_id, slug, name FROM application.brands WHERE is_active = true ORDER BY name`;
  const result = await query<{ brand_id: string; slug: string; name: string }>(sql);
  return result.map((r) => ({
    brandId: r.brand_id,
    slug: r.slug,
    name: r.name,
  }));
}

// =============================================================================
// CREATE / UPDATE FUNCTIONS
// =============================================================================

interface CreateProductInput {
  title: string;
  barterTypeId: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  model?: string;
  description?: string;
  productInfo?: Record<string, unknown>;
  imageKey?: string;
}

/**
 * Create a new product
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const sql = `
    INSERT INTO application.products (
      title, barter_type_id, category_id, subcategory_id, brand_id, model, 
      description, product_info, image_key, is_active, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
    RETURNING product_id
  `;
  
  const result = await query<{ product_id: string }>(sql, [
    input.title,
    input.barterTypeId,
    input.categoryId || null,
    input.subcategoryId || null,
    input.brandId || null,
    input.model || null,
    input.description || null,
    JSON.stringify(input.productInfo || {}), // product_info has NOT NULL constraint, default to empty object
    input.imageKey || null,
  ]);
  
  if (!result[0]) {
    throw new Error("Failed to create product");
  }
  
  // Fetch and return the created product
  const product = await fetchProductById(result[0].product_id);
  if (!product) {
    throw new Error("Failed to fetch created product");
  }
  
  return product;
}

interface UpdateProductInput {
  title?: string;
  description?: string;
  productInfo?: Record<string, unknown>;
  imageKey?: string;
}

/**
 * Update an existing product
 */
export async function updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;
  
  if (input.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    params.push(input.title);
  }
  if (input.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(input.description);
  }
  if (input.productInfo !== undefined) {
    updates.push(`product_info = $${paramIndex++}`);
    params.push(JSON.stringify(input.productInfo));
  }
  if (input.imageKey !== undefined) {
    updates.push(`image_key = $${paramIndex++}`);
    params.push(input.imageKey);
  }
  
  if (updates.length === 0) {
    const product = await fetchProductById(productId);
    if (!product) throw new Error("Product not found");
    return product;
  }
  
  updates.push(`updated_at = NOW()`);
  params.push(productId);
  
  const sql = `
    UPDATE application.products
    SET ${updates.join(", ")}
    WHERE product_id = $${paramIndex}
    RETURNING product_id
  `;
  
  const result = await query<{ product_id: string }>(sql, params);
  
  if (!result[0]) {
    throw new Error("Failed to update product");
  }
  
  const product = await fetchProductById(result[0].product_id);
  if (!product) {
    throw new Error("Failed to fetch updated product");
  }
  
  return product;
}

/**
 * Update category icon
 */
export async function updateCategoryIcon(categoryId: string, iconKey: string): Promise<void> {
  const sql = `UPDATE application.categories SET icon_key = $1, updated_at = NOW() WHERE category_id = $2`;
  await query(sql, [iconKey, categoryId]);
}

/**
 * Update subcategory icon
 */
export async function updateSubcategoryIcon(subcategoryId: string, iconKey: string): Promise<void> {
  const sql = `UPDATE application.subcategories SET icon_key = $1, updated_at = NOW() WHERE subcategory_id = $2`;
  await query(sql, [iconKey, subcategoryId]);
}

/**
 * Update brand logo
 */
export async function updateBrandLogo(brandId: string, logoKey: string): Promise<void> {
  const sql = `UPDATE application.brands SET logo_key = $1, updated_at = NOW() WHERE brand_id = $2`;
  await query(sql, [logoKey, brandId]);
}

/**
 * Fetch product with full details for catalog assets (includes IDs)
 */
export async function fetchProductWithIds(productId: string): Promise<{
  productId: string;
  title: string;
  barterTypeId: string;
  barterTypeName: string;
  barterTypeSlug: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryIconKey: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  subcategoryIconKey: string | null;
  brandId: string | null;
  brandName: string | null;
  brandLogoKey: string | null;
  model: string | null;
  imageKey: string | null;
  productInfo: Record<string, unknown> | null;
} | null> {
  const sql = `
    SELECT 
      p.product_id,
      p.title,
      p.barter_type_id,
      bt.name as barter_type_name,
      bt.slug as barter_type_slug,
      p.category_id,
      c.name as category_name,
      c.icon_key as category_icon_key,
      p.subcategory_id,
      sc.name as subcategory_name,
      sc.icon_key as subcategory_icon_key,
      p.brand_id,
      b.name as brand_name,
      b.logo_key as brand_logo_key,
      p.model,
      p.image_key,
      p.product_info
    FROM application.products p
    LEFT JOIN application.barter_types bt ON p.barter_type_id = bt.barter_type_id
    LEFT JOIN application.categories c ON p.category_id = c.category_id
    LEFT JOIN application.subcategories sc ON p.subcategory_id = sc.subcategory_id
    LEFT JOIN application.brands b ON p.brand_id = b.brand_id
    WHERE p.product_id = $1
  `;
  
  const result = await query<{
    product_id: string;
    title: string;
    barter_type_id: string;
    barter_type_name: string;
    barter_type_slug: string;
    category_id: string | null;
    category_name: string | null;
    category_icon_key: string | null;
    subcategory_id: string | null;
    subcategory_name: string | null;
    subcategory_icon_key: string | null;
    brand_id: string | null;
    brand_name: string | null;
    brand_logo_key: string | null;
    model: string | null;
    image_key: string | null;
    product_info: Record<string, unknown> | null;
  }>(sql, [productId]);
  
  if (!result[0]) return null;
  
  const r = result[0];
  return {
    productId: r.product_id,
    title: r.title,
    barterTypeId: r.barter_type_id,
    barterTypeName: r.barter_type_name,
    barterTypeSlug: r.barter_type_slug,
    categoryId: r.category_id,
    categoryName: r.category_name,
    categoryIconKey: r.category_icon_key,
    subcategoryId: r.subcategory_id,
    subcategoryName: r.subcategory_name,
    subcategoryIconKey: r.subcategory_icon_key,
    brandId: r.brand_id,
    brandName: r.brand_name,
    brandLogoKey: r.brand_logo_key,
    model: r.model,
    imageKey: r.image_key,
    productInfo: r.product_info,
  };
}
