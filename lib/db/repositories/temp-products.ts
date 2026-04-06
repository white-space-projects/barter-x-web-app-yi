/**
 * Temp Products Repository
 * ========================
 * Handles custom product submissions that need admin review.
 * Includes duplicate detection to suggest existing products/brands.
 */

import { query } from "../postgres";

export interface TempProduct {
  tempProductId: string;
  createdByUserId: string;
  barterTypeId: string;
  categoryId?: string;
  subcategoryId?: string;
  brandName?: string;
  modelName?: string;
  title: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  approvedProductId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateSuggestion {
  type: "brand" | "product";
  id: string;
  name: string;
  matchScore: number;
  details?: string;
}

interface CreateTempProductInput {
  createdByUserId: string;
  barterTypeId: string;
  categoryId?: string;
  subcategoryId?: string;
  brandName?: string;
  modelName?: string;
  title: string;
  description?: string;
}

/**
 * Create a temp product and return it with duplicate suggestions
 */
export async function createTempProduct(
  input: CreateTempProductInput
): Promise<{ tempProduct: TempProduct; duplicates: DuplicateSuggestion[] }> {
  // Insert the temp product
  const result = await query<{
    temp_product_id: string;
    created_by_user_id: string;
    barter_type_id: string;
    category_id: string | null;
    subcategory_id: string | null;
    brand_name: string | null;
    model_name: string | null;
    title: string;
    description: string | null;
    status: string;
    approved_product_id: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `INSERT INTO application.temp_products 
     (created_by_user_id, barter_type_id, category_id, subcategory_id, brand_name, model_name, title, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.createdByUserId,
      input.barterTypeId,
      input.categoryId || null,
      input.subcategoryId || null,
      input.brandName || null,
      input.modelName || null,
      input.title,
      input.description || null,
    ]
  );

  const row = result[0];
  const tempProduct: TempProduct = {
    tempProductId: row.temp_product_id,
    createdByUserId: row.created_by_user_id,
    barterTypeId: row.barter_type_id,
    categoryId: row.category_id || undefined,
    subcategoryId: row.subcategory_id || undefined,
    brandName: row.brand_name || undefined,
    modelName: row.model_name || undefined,
    title: row.title,
    description: row.description || undefined,
    status: row.status as TempProduct["status"],
    approvedProductId: row.approved_product_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Find duplicate suggestions
  const duplicates = await findDuplicates(input);

  return { tempProduct, duplicates };
}

/**
 * Find potential duplicate brands and products based on fuzzy matching
 */
export async function findDuplicates(
  input: Pick<CreateTempProductInput, "brandName" | "modelName" | "title" | "barterTypeId">
): Promise<DuplicateSuggestion[]> {
  const suggestions: DuplicateSuggestion[] = [];

  // Search for similar brands if brand name provided
  if (input.brandName) {
    const brandMatches = await query<{
      brand_id: string;
      name: string;
      similarity: number;
    }>(
      `SELECT brand_id, name, 
              similarity(LOWER(name), LOWER($1)) as similarity
       FROM application.brands
       WHERE similarity(LOWER(name), LOWER($1)) > 0.3
          OR LOWER(name) LIKE LOWER($2)
       ORDER BY similarity DESC
       LIMIT 5`,
      [input.brandName, `%${input.brandName}%`]
    );

    for (const match of brandMatches) {
      suggestions.push({
        type: "brand",
        id: match.brand_id,
        name: match.name,
        matchScore: Math.round(match.similarity * 100),
      });
    }
  }

  // Search for similar products by title
  if (input.title) {
    const productMatches = await query<{
      product_id: string;
      title: string;
      brand_name: string | null;
      similarity: number;
    }>(
      `SELECT p.product_id, p.title, b.name as brand_name,
              similarity(LOWER(p.title), LOWER($1)) as similarity
       FROM application.products p
       LEFT JOIN application.brands b ON p.brand_id = b.brand_id
       WHERE p.barter_type_id = $2
         AND (similarity(LOWER(p.title), LOWER($1)) > 0.3
              OR LOWER(p.title) LIKE LOWER($3))
       ORDER BY similarity DESC
       LIMIT 5`,
      [input.title, input.barterTypeId, `%${input.title}%`]
    );

    for (const match of productMatches) {
      suggestions.push({
        type: "product",
        id: match.product_id,
        name: match.title,
        matchScore: Math.round(match.similarity * 100),
        details: match.brand_name ? `Brand: ${match.brand_name}` : undefined,
      });
    }
  }

  // Sort by match score descending
  return suggestions.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get temp product by ID
 */
export async function getTempProduct(tempProductId: string): Promise<TempProduct | null> {
  const result = await query<{
    temp_product_id: string;
    created_by_user_id: string;
    barter_type_id: string;
    category_id: string | null;
    subcategory_id: string | null;
    brand_name: string | null;
    model_name: string | null;
    title: string;
    description: string | null;
    status: string;
    approved_product_id: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT * FROM application.temp_products WHERE temp_product_id = $1`,
    [tempProductId]
  );

  if (result.length === 0) return null;

  const row = result[0];
  return {
    tempProductId: row.temp_product_id,
    createdByUserId: row.created_by_user_id,
    barterTypeId: row.barter_type_id,
    categoryId: row.category_id || undefined,
    subcategoryId: row.subcategory_id || undefined,
    brandName: row.brand_name || undefined,
    modelName: row.model_name || undefined,
    title: row.title,
    description: row.description || undefined,
    status: row.status as TempProduct["status"],
    approvedProductId: row.approved_product_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all pending temp products for admin review
 */
export async function getPendingTempProducts(): Promise<TempProduct[]> {
  const result = await query<{
    temp_product_id: string;
    created_by_user_id: string;
    barter_type_id: string;
    category_id: string | null;
    subcategory_id: string | null;
    brand_name: string | null;
    model_name: string | null;
    title: string;
    description: string | null;
    status: string;
    approved_product_id: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT * FROM application.temp_products 
     WHERE status = 'pending' 
     ORDER BY created_at ASC`
  );

  return result.map((row) => ({
    tempProductId: row.temp_product_id,
    createdByUserId: row.created_by_user_id,
    barterTypeId: row.barter_type_id,
    categoryId: row.category_id || undefined,
    subcategoryId: row.subcategory_id || undefined,
    brandName: row.brand_name || undefined,
    modelName: row.model_name || undefined,
    title: row.title,
    description: row.description || undefined,
    status: row.status as TempProduct["status"],
    approvedProductId: row.approved_product_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Update temp product status (approve/reject)
 */
export async function updateTempProductStatus(
  tempProductId: string,
  status: "approved" | "rejected",
  approvedProductId?: string
): Promise<TempProduct | null> {
  const result = await query<{
    temp_product_id: string;
    created_by_user_id: string;
    barter_type_id: string;
    category_id: string | null;
    subcategory_id: string | null;
    brand_name: string | null;
    model_name: string | null;
    title: string;
    description: string | null;
    status: string;
    approved_product_id: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `UPDATE application.temp_products 
     SET status = $2, approved_product_id = $3, updated_at = NOW()
     WHERE temp_product_id = $1
     RETURNING *`,
    [tempProductId, status, approvedProductId || null]
  );

  if (result.length === 0) return null;

  const row = result[0];
  return {
    tempProductId: row.temp_product_id,
    createdByUserId: row.created_by_user_id,
    barterTypeId: row.barter_type_id,
    categoryId: row.category_id || undefined,
    subcategoryId: row.subcategory_id || undefined,
    brandName: row.brand_name || undefined,
    modelName: row.model_name || undefined,
    title: row.title,
    description: row.description || undefined,
    status: row.status as TempProduct["status"],
    approvedProductId: row.approved_product_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
