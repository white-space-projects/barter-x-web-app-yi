/**
 * Subcategories Repository
 * ========================
 * Server-side data access for subcategories with dynamic field schemas.
 * Uses direct PostgreSQL connection.
 */

import { query } from "../postgres";

// Field definition types
export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "date" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: string | number | boolean;
  helpText?: string;
  order: number;
}

export interface Subcategory {
  subcategoryId: string;
  categoryId: string;
  name: string;
  slug: string;
  productInfoFields: FieldDefinition[];
  offerInfoFields: FieldDefinition[];
  createdAt: string;
  updatedAt: string;
  // Joined data
  categoryName?: string;
  barterTypeId?: string;
  barterTypeName?: string;
  barterTypeSlug?: string;
}

interface DbSubcategory {
  subcategory_id: string;
  category_id: string;
  name: string;
  slug: string;
  product_info_fields: FieldDefinition[] | string;
  offer_info_fields: FieldDefinition[] | string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  barter_type_id?: string;
  barter_type_name?: string;
  barter_type_slug?: string;
}

function parseJsonField(field: FieldDefinition[] | string | null): FieldDefinition[] {
  if (!field) return [];
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  }
  return field;
}

function mapToSubcategory(row: DbSubcategory): Subcategory {
  return {
    subcategoryId: row.subcategory_id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    productInfoFields: parseJsonField(row.product_info_fields),
    offerInfoFields: parseJsonField(row.offer_info_fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoryName: row.category_name,
    barterTypeId: row.barter_type_id,
    barterTypeName: row.barter_type_name,
    barterTypeSlug: row.barter_type_slug,
  };
}

/**
 * Fetch all subcategories with optional filters
 */
export async function fetchSubcategories(options: {
  categoryId?: string;
  barterTypeSlug?: string;
} = {}): Promise<Subcategory[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options.categoryId) {
    conditions.push(`sc.category_id = $${paramIndex++}`);
    params.push(options.categoryId);
  }

  if (options.barterTypeSlug) {
    conditions.push(`bt.slug = $${paramIndex++}`);
    params.push(options.barterTypeSlug);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT 
      sc.*,
      c.name as category_name,
      bt.barter_type_id,
      bt.name as barter_type_name,
      bt.slug as barter_type_slug
    FROM application.subcategories sc
    JOIN application.categories c ON sc.category_id = c.category_id
    JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
    ${whereClause}
    ORDER BY bt.name, c.name, sc.name
  `;

  const result = await query<DbSubcategory>(sql, params);
  return result.map(mapToSubcategory);
}

/**
 * Fetch a single subcategory by ID
 */
export async function fetchSubcategoryById(subcategoryId: string): Promise<Subcategory | null> {
  const sql = `
    SELECT 
      sc.*,
      c.name as category_name,
      bt.barter_type_id,
      bt.name as barter_type_name,
      bt.slug as barter_type_slug
    FROM application.subcategories sc
    JOIN application.categories c ON sc.category_id = c.category_id
    JOIN application.barter_types bt ON c.barter_type_id = bt.barter_type_id
    WHERE sc.subcategory_id = $1
  `;

  const result = await query<DbSubcategory>(sql, [subcategoryId]);
  if (result.length === 0) return null;
  return mapToSubcategory(result[0]);
}

/**
 * Update subcategory field schemas
 */
export async function updateSubcategoryFields(
  subcategoryId: string,
  data: {
    productInfoFields?: FieldDefinition[];
    offerInfoFields?: FieldDefinition[];
  }
): Promise<Subcategory | null> {
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (data.productInfoFields !== undefined) {
    updates.push(`product_info_fields = $${paramIndex++}::jsonb`);
    params.push(JSON.stringify(data.productInfoFields));
  }

  if (data.offerInfoFields !== undefined) {
    updates.push(`offer_info_fields = $${paramIndex++}::jsonb`);
    params.push(JSON.stringify(data.offerInfoFields));
  }

  if (updates.length === 0) {
    return fetchSubcategoryById(subcategoryId);
  }

  updates.push(`updated_at = NOW()`);
  params.push(subcategoryId);

  const sql = `
    UPDATE application.subcategories
    SET ${updates.join(", ")}
    WHERE subcategory_id = $${paramIndex}
    RETURNING *
  `;

  const result = await query<DbSubcategory>(sql, params);
  if (result.length === 0) return null;

  // Refetch to get joined data
  return fetchSubcategoryById(subcategoryId);
}

/**
 * Get field schema for a specific subcategory
 * Used by frontend to render dynamic forms
 */
export async function getSubcategoryFieldSchema(subcategoryId: string): Promise<{
  productInfoFields: FieldDefinition[];
  offerInfoFields: FieldDefinition[];
} | null> {
  const subcategory = await fetchSubcategoryById(subcategoryId);
  if (!subcategory) return null;

  return {
    productInfoFields: subcategory.productInfoFields,
    offerInfoFields: subcategory.offerInfoFields,
  };
}
