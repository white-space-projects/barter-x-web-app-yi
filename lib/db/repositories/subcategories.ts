/**
 * Subcategories Repository
 * ========================
 * Server-side data access for subcategories with dynamic field schemas.
 * Uses normalized tables: subcategory_product_fields and subcategory_product_field_options
 */

import { query } from "../postgres";

// Field option type (for select dropdowns)
export interface FieldOption {
  optionId: string;
  optionValue: string;
  optionLabel: string;
  sortOrder: number;
  isActive: boolean;
}

// Date mode type for date fields
export type DateMode = "month_year" | "day_month_year" | "year_only";

// Field definition type
export interface FieldDefinition {
  fieldId: string;
  subcategoryId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: "text" | "number" | "select" | "multiselect" | "boolean" | "date" | "textarea";
  fieldScope: FieldScope;
  placeholder?: string;
  helpText?: string;
  dateMode?: DateMode;
  isRequired: boolean;
  isFilterable: boolean;
  isActive: boolean;
  sortOrder: number;
  options?: FieldOption[]; // Populated for select type fields
}

export interface Subcategory {
  subcategoryId: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  productFields: FieldDefinition[]; // Fields with scope "product"
  offerFields: FieldDefinition[]; // Fields with scope "offer"
  // Joined data
  categoryName?: string;
  barterTypeId?: string;
  barterTypeName?: string;
  barterTypeSlug?: string;
}

// Database row types
interface DbSubcategory {
  subcategory_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  category_name?: string;
  barter_type_id?: string;
  barter_type_name?: string;
  barter_type_slug?: string;
}

interface DbField {
  field_id: string;
  subcategory_id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  field_scope: string;
  placeholder: string | null;
  help_text: string | null;
  date_mode: string | null;
  is_required: boolean;
  is_filterable: boolean;
  is_active: boolean;
  sort_order: number;
}

interface DbFieldOption {
  option_id: string;
  field_id: string;
  option_value: string;
  option_label: string;
  sort_order: number;
  is_active: boolean;
}

function mapToFieldOption(row: DbFieldOption): FieldOption {
  return {
    optionId: row.option_id,
    optionValue: row.option_value,
    optionLabel: row.option_label,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function mapToFieldDefinition(row: DbField, options: FieldOption[] = []): FieldDefinition {
  return {
    fieldId: row.field_id,
    subcategoryId: row.subcategory_id,
    fieldKey: row.field_key,
    fieldLabel: row.field_label,
    fieldType: row.field_type as FieldDefinition["fieldType"],
    fieldScope: (row.field_scope || "product") as FieldScope,
    placeholder: row.placeholder || undefined,
    helpText: row.help_text || undefined,
    dateMode: row.date_mode as FieldDefinition["dateMode"] || undefined,
    isRequired: row.is_required,
    isFilterable: row.is_filterable,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    options: options.length > 0 ? options : undefined,
  };
}

function mapToSubcategory(row: DbSubcategory, fields: FieldDefinition[] = []): Subcategory {
  // Split fields by scope
  const productFields = fields.filter(f => f.fieldScope === "product");
  const offerFields = fields.filter(f => f.fieldScope === "offer");
  
  return {
    subcategoryId: row.subcategory_id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description || undefined,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    productFields,
    offerFields,
    categoryName: row.category_name,
    barterTypeId: row.barter_type_id,
    barterTypeName: row.barter_type_name,
    barterTypeSlug: row.barter_type_slug,
  };
}

/**
 * Fetch fields for a subcategory (with their options)
 */
async function fetchFieldsForSubcategory(subcategoryId: string): Promise<FieldDefinition[]> {
  // Get all fields
  const fieldsSql = `
    SELECT * FROM application.subcategory_product_fields
    WHERE subcategory_id = $1
    ORDER BY sort_order ASC
  `;
  const fieldsResult = await query<DbField>(fieldsSql, [subcategoryId]);

  if (fieldsResult.length === 0) return [];

  // Get all options for these fields
  const fieldIds = fieldsResult.map(f => f.field_id);
  const optionsSql = `
    SELECT * FROM application.subcategory_product_field_options
    WHERE field_id = ANY($1::uuid[])
    ORDER BY sort_order ASC
  `;
  const optionsResult = await query<DbFieldOption>(optionsSql, [fieldIds]);

  // Group options by field_id
  const optionsByFieldId: Record<string, FieldOption[]> = {};
  for (const opt of optionsResult) {
    if (!optionsByFieldId[opt.field_id]) {
      optionsByFieldId[opt.field_id] = [];
    }
    optionsByFieldId[opt.field_id].push(mapToFieldOption(opt));
  }

  // Map fields with their options
  return fieldsResult.map(field => 
    mapToFieldDefinition(field, optionsByFieldId[field.field_id] || [])
  );
}

/**
 * Fetch all subcategories with optional filters
 */
export async function fetchSubcategories(options: {
  categoryId?: string;
  barterTypeSlug?: string;
  includeFields?: boolean;
  name?: string; // Filter by exact subcategory name
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

  if (options.name) {
    conditions.push(`sc.name = $${paramIndex++}`);
    params.push(options.name);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT 
      sc.subcategory_id,
      sc.category_id,
      sc.name,
      sc.slug,
      sc.description,
      sc.sort_order,
      sc.is_active,
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
  
  // If includeFields is true, fetch fields for each subcategory
  if (options.includeFields) {
    const subcategories: Subcategory[] = [];
    for (const row of result) {
      const fields = await fetchFieldsForSubcategory(row.subcategory_id);
      subcategories.push(mapToSubcategory(row, fields));
    }
    return subcategories;
  }

  return result.map(row => mapToSubcategory(row, []));
}

/**
 * Fetch a single subcategory by ID (always includes fields)
 */
export async function fetchSubcategoryById(subcategoryId: string): Promise<Subcategory | null> {
  const sql = `
    SELECT 
      sc.subcategory_id,
      sc.category_id,
      sc.name,
      sc.slug,
      sc.description,
      sc.sort_order,
      sc.is_active,
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

  const fields = await fetchFieldsForSubcategory(subcategoryId);
  return mapToSubcategory(result[0], fields);
}

/**
 * Create a new field for a subcategory
 */
export async function createField(data: {
  subcategoryId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  fieldScope: FieldScope;
  placeholder?: string;
  helpText?: string;
  dateMode?: DateMode;
  isRequired?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
}): Promise<FieldDefinition> {
  // Get max sort_order if not provided (scoped by field_scope)
  let sortOrder = data.sortOrder;
  if (sortOrder === undefined) {
    const maxResult = await query<{ max_order: number }>(
      `SELECT COALESCE(MAX(sort_order), 0) as max_order FROM application.subcategory_product_fields WHERE subcategory_id = $1 AND field_scope = $2`,
      [data.subcategoryId, data.fieldScope]
    );
    sortOrder = (maxResult[0]?.max_order || 0) + 1;
  }

  const sql = `
    INSERT INTO application.subcategory_product_fields (
      field_id, subcategory_id, field_key, field_label, field_type, field_scope,
      placeholder, help_text, date_mode, is_required, is_filterable, is_active, sort_order
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11
    )
    RETURNING *
  `;

  const result = await query<DbField>(sql, [
    data.subcategoryId,
    data.fieldKey,
    data.fieldLabel,
    data.fieldType,
    data.fieldScope,
    data.placeholder || null,
    data.helpText || null,
    data.dateMode || null,
    data.isRequired ?? false,
    data.isFilterable ?? false,
    sortOrder,
  ]);

  return mapToFieldDefinition(result[0], []);
}

/**
 * Update a field
 */
export async function updateField(
  fieldId: string,
  data: Partial<{
    fieldKey: string;
    fieldLabel: string;
    fieldType: string;
    placeholder: string | null;
    helpText: string | null;
    dateMode: string | null;
    isRequired: boolean;
    isFilterable: boolean;
    isActive: boolean;
    sortOrder: number;
  }>
): Promise<FieldDefinition | null> {
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (data.fieldKey !== undefined) {
    updates.push(`field_key = $${paramIndex++}`);
    params.push(data.fieldKey);
  }
  if (data.fieldLabel !== undefined) {
    updates.push(`field_label = $${paramIndex++}`);
    params.push(data.fieldLabel);
  }
  if (data.fieldType !== undefined) {
    updates.push(`field_type = $${paramIndex++}`);
    params.push(data.fieldType);
  }
  if (data.placeholder !== undefined) {
    updates.push(`placeholder = $${paramIndex++}`);
    params.push(data.placeholder);
  }
  if (data.helpText !== undefined) {
    updates.push(`help_text = $${paramIndex++}`);
    params.push(data.helpText);
  }
  if (data.dateMode !== undefined) {
    updates.push(`date_mode = $${paramIndex++}`);
    params.push(data.dateMode);
  }
  if (data.isRequired !== undefined) {
    updates.push(`is_required = $${paramIndex++}`);
    params.push(data.isRequired);
  }
  if (data.isFilterable !== undefined) {
    updates.push(`is_filterable = $${paramIndex++}`);
    params.push(data.isFilterable);
  }
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    params.push(data.isActive);
  }
  if (data.sortOrder !== undefined) {
    updates.push(`sort_order = $${paramIndex++}`);
    params.push(data.sortOrder);
  }

  if (updates.length === 0) return null;

  params.push(fieldId);

  const sql = `
    UPDATE application.subcategory_product_fields
    SET ${updates.join(", ")}
    WHERE field_id = $${paramIndex}
    RETURNING *
  `;

  const result = await query<DbField>(sql, params);
  if (result.length === 0) return null;

  // Fetch options for this field
  const optionsResult = await query<DbFieldOption>(
    `SELECT * FROM application.subcategory_product_field_options WHERE field_id = $1 ORDER BY sort_order`,
    [fieldId]
  );

  return mapToFieldDefinition(result[0], optionsResult.map(mapToFieldOption));
}

/**
 * Delete a field (and its options via cascade)
 */
export async function deleteField(fieldId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM application.subcategory_product_fields WHERE field_id = $1 RETURNING field_id`,
    [fieldId]
  );
  return result.length > 0;
}

/**
 * Create a field option
 */
export async function createFieldOption(data: {
  fieldId: string;
  optionValue: string;
  optionLabel: string;
  sortOrder?: number;
}): Promise<FieldOption> {
  let sortOrder = data.sortOrder;
  if (sortOrder === undefined) {
    const maxResult = await query<{ max_order: number }>(
      `SELECT COALESCE(MAX(sort_order), 0) as max_order FROM application.subcategory_product_field_options WHERE field_id = $1`,
      [data.fieldId]
    );
    sortOrder = (maxResult[0]?.max_order || 0) + 1;
  }

  const sql = `
    INSERT INTO application.subcategory_product_field_options (
      option_id, field_id, option_value, option_label, sort_order, is_active
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, true
    )
    RETURNING *
  `;

  const result = await query<DbFieldOption>(sql, [
    data.fieldId,
    data.optionValue,
    data.optionLabel,
    sortOrder,
  ]);

  return mapToFieldOption(result[0]);
}

/**
 * Update a field option
 */
export async function updateFieldOption(
  optionId: string,
  data: Partial<{
    optionValue: string;
    optionLabel: string;
    sortOrder: number;
    isActive: boolean;
  }>
): Promise<FieldOption | null> {
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (data.optionValue !== undefined) {
    updates.push(`option_value = $${paramIndex++}`);
    params.push(data.optionValue);
  }
  if (data.optionLabel !== undefined) {
    updates.push(`option_label = $${paramIndex++}`);
    params.push(data.optionLabel);
  }
  if (data.sortOrder !== undefined) {
    updates.push(`sort_order = $${paramIndex++}`);
    params.push(data.sortOrder);
  }
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    params.push(data.isActive);
  }

  if (updates.length === 0) return null;

  params.push(optionId);

  const sql = `
    UPDATE application.subcategory_product_field_options
    SET ${updates.join(", ")}
    WHERE option_id = $${paramIndex}
    RETURNING *
  `;

  const result = await query<DbFieldOption>(sql, params);
  if (result.length === 0) return null;

  return mapToFieldOption(result[0]);
}

/**
 * Delete a field option
 */
export async function deleteFieldOption(optionId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM application.subcategory_product_field_options WHERE option_id = $1 RETURNING option_id`,
    [optionId]
  );
  return result.length > 0;
}

/**
 * Delete all options for a field
 */
export async function deleteFieldOptions(fieldId: string): Promise<number> {
  const result = await query(
    `DELETE FROM application.subcategory_product_field_options WHERE field_id = $1 RETURNING option_id`,
    [fieldId]
  );
  return result.length;
}

/**
 * Get field schema for a specific subcategory
 * Used by frontend to render dynamic forms
 */
export async function getSubcategoryFieldSchema(subcategoryId: string): Promise<{
  productFields: FieldDefinition[];
} | null> {
  const fields = await fetchFieldsForSubcategory(subcategoryId);
  return { productFields: fields };
}

/**
 * Bulk update field sort orders
 */
export async function updateFieldSortOrders(
  fieldOrders: { fieldId: string; sortOrder: number }[]
): Promise<void> {
  for (const { fieldId, sortOrder } of fieldOrders) {
    await query(
      `UPDATE application.subcategory_product_fields SET sort_order = $1 WHERE field_id = $2`,
      [sortOrder, fieldId]
    );
  }
}
