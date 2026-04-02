import type { OfferInfoFieldDefinition, SubcategoryOfferInfoFields, ProductInfoField } from "./types";

// ============================================================================
// OFFER INFO FIELD DEFINITIONS BY SUBCATEGORY
// These fields are user-editable when creating/editing an offer
// ============================================================================

// Common fields that apply to most subcategories
const COMMON_OFFER_FIELDS: OfferInfoFieldDefinition[] = [
  {
    fieldId: "purchase_date",
    fieldName: "Purchase Month & Year",
    fieldType: "date_select",
  },
  {
    fieldId: "condition",
    fieldName: "Condition",
    fieldType: "single_select",
    options: ["New (Unopened)", "Like New", "Excellent", "Good", "Fair", "Poor", "Not Working"],
  },
  {
    fieldId: "color",
    fieldName: "Color",
    fieldType: "text",
  },
  {
    fieldId: "usage_level",
    fieldName: "Usage Level",
    fieldType: "single_select",
    options: ["Unused", "Light Use", "Regular Use", "Heavy Use"],
  },
  {
    fieldId: "invoice_available",
    fieldName: "Original Invoice Available",
    fieldType: "single_select",
    options: ["Yes", "No"],
  },
  {
    fieldId: "warranty_status",
    fieldName: "Warranty Status",
    fieldType: "single_select",
    options: ["Valid", "Expired", "Not Applicable"],
  },
  {
    fieldId: "included_items",
    fieldName: "Included Items",
    fieldType: "multi_select",
    options: ["Original Box", "Manual/Documents", "Carry Case/Bag", "Protective Cover", "Extra Parts", "Mounts/Straps", "Tools/Installation Kit", "Charger/Cable"],
  },
  {
    fieldId: "repairs_done",
    fieldName: "Any Repairs Done",
    fieldType: "single_select",
    options: ["Yes", "No"],
  },
  {
    fieldId: "repaired_components",
    fieldName: "Repaired Components",
    fieldType: "multi_select",
    options: ["Part Replaced", "Stitching Repaired", "Screen Replaced", "Wheel Replaced", "Frame Repaired", "Electronics Repaired", "Battery Replaced"],
  },
  {
    fieldId: "functional_issues",
    fieldName: "Functional Issues",
    fieldType: "multi_select",
    options: ["None", "Not Working", "Loose Parts", "Noise During Use", "Connectivity Issues", "Performance Issues", "Missing Parts"],
  },
  {
    fieldId: "visible_damages",
    fieldName: "Visible Damages",
    fieldType: "multi_select",
    options: ["None", "Scratches", "Cracks", "Dents", "Tears", "Stains", "Rust", "Paint Fading"],
  },
  {
    fieldId: "additional_notes",
    fieldName: "Additional Notes",
    fieldType: "text",
  },
  {
    fieldId: "documents",
    fieldName: "Documents",
    fieldType: "attachment",
    options: ["Invoice", "Warranty Card", "Certificates", "Receipts"],
  },
];

// Electronics-specific fields
const ELECTRONICS_FIELDS: OfferInfoFieldDefinition[] = [
  ...COMMON_OFFER_FIELDS,
  {
    fieldId: "battery_health",
    fieldName: "Battery Health",
    fieldType: "text",
  },
  {
    fieldId: "storage_capacity",
    fieldName: "Storage Capacity",
    fieldType: "text",
  },
];

// Smartphones-specific fields
const SMARTPHONES_FIELDS: OfferInfoFieldDefinition[] = [
  ...ELECTRONICS_FIELDS,
  {
    fieldId: "network_unlocked",
    fieldName: "Network Unlocked",
    fieldType: "single_select",
    options: ["Yes", "No", "Unknown"],
  },
  {
    fieldId: "screen_condition",
    fieldName: "Screen Condition",
    fieldType: "single_select",
    options: ["Perfect", "Minor Scratches", "Visible Scratches", "Cracked", "Replaced"],
  },
];

// Laptops-specific fields
const LAPTOPS_FIELDS: OfferInfoFieldDefinition[] = [
  ...ELECTRONICS_FIELDS,
  {
    fieldId: "battery_cycles",
    fieldName: "Battery Cycles",
    fieldType: "text",
  },
  {
    fieldId: "ram_size",
    fieldName: "RAM Size",
    fieldType: "text",
  },
  {
    fieldId: "keyboard_condition",
    fieldName: "Keyboard Condition",
    fieldType: "single_select",
    options: ["Perfect", "Minor Wear", "Some Keys Faded", "Keys Replaced"],
  },
];

// Furniture-specific fields
const FURNITURE_FIELDS: OfferInfoFieldDefinition[] = [
  ...COMMON_OFFER_FIELDS,
  {
    fieldId: "assembly_required",
    fieldName: "Assembly Required",
    fieldType: "single_select",
    options: ["Yes", "No", "Partial"],
  },
  {
    fieldId: "pet_free_home",
    fieldName: "From Pet-Free Home",
    fieldType: "single_select",
    options: ["Yes", "No"],
  },
  {
    fieldId: "smoke_free_home",
    fieldName: "From Smoke-Free Home",
    fieldType: "single_select",
    options: ["Yes", "No"],
  },
];

// Fashion-specific fields
const FASHION_FIELDS: OfferInfoFieldDefinition[] = [
  ...COMMON_OFFER_FIELDS,
  {
    fieldId: "size",
    fieldName: "Size",
    fieldType: "text",
  },
  {
    fieldId: "authenticity",
    fieldName: "Authenticity",
    fieldType: "single_select",
    options: ["Verified Authentic", "Purchased from Official Store", "Unknown"],
  },
];

// Map subcategories to their field definitions
export const SUBCATEGORY_OFFER_FIELDS: SubcategoryOfferInfoFields = {
  // Electronics
  "Phones": SMARTPHONES_FIELDS,
  "Smartphones": SMARTPHONES_FIELDS,
  "Laptops": LAPTOPS_FIELDS,
  "Headphones": ELECTRONICS_FIELDS,
  "Cameras": ELECTRONICS_FIELDS,
  "Gaming Consoles": ELECTRONICS_FIELDS,
  // Furniture
  "Shelving": FURNITURE_FIELDS,
  "Chairs": FURNITURE_FIELDS,
  // Fashion
  "Sneakers": FASHION_FIELDS,
  "Jeans": FASHION_FIELDS,
  // Home Appliances
  "Vacuum Cleaners": COMMON_OFFER_FIELDS,
  "Kitchen Appliances": COMMON_OFFER_FIELDS,
  // Default
  "default": COMMON_OFFER_FIELDS,
};

// Get offer info fields for a subcategory
export function getOfferInfoFieldsForSubcategory(subcategory: string): OfferInfoFieldDefinition[] {
  return SUBCATEGORY_OFFER_FIELDS[subcategory] || SUBCATEGORY_OFFER_FIELDS["default"];
}

// ============================================================================
// PRODUCT INFO (STATIC, READ-ONLY)
// These are set at the product level and shown when viewing any offer
// ============================================================================

export const PRODUCT_INFO_BY_PRODUCT: Record<string, ProductInfoField[]> = {
  // iPhone 13 Pro
  "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d": [
    { fieldName: "Product Type", value: "Electronic" },
    { fieldName: "Primary Material", value: "Glass, Aluminium" },
    { fieldName: "Dimensions", value: "146.7 x 71.5 x 7.65 mm" },
    { fieldName: "Weight", value: "204 g" },
    { fieldName: "Power Source", value: "Battery" },
    { fieldName: "Connectivity", value: "5G, Wi-Fi, Bluetooth, NFC" },
    { fieldName: "Water Resistance", value: "Yes (IP68)" },
    { fieldName: "Release Year", value: "2021" },
  ],
  // MacBook Air M2
  "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e": [
    { fieldName: "Product Type", value: "Electronic" },
    { fieldName: "Primary Material", value: "Aluminium" },
    { fieldName: "Dimensions", value: "30.41 x 21.5 x 1.13 cm" },
    { fieldName: "Weight", value: "1.24 kg" },
    { fieldName: "Power Source", value: "Battery" },
    { fieldName: "Connectivity", value: "Wi-Fi 6, Bluetooth 5.0" },
    { fieldName: "Usage Environment", value: "Indoor" },
    { fieldName: "Release Year", value: "2022" },
  ],
  // Samsung Galaxy S23
  "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f": [
    { fieldName: "Product Type", value: "Electronic" },
    { fieldName: "Primary Material", value: "Glass, Aluminium" },
    { fieldName: "Dimensions", value: "146.3 x 70.9 x 7.6 mm" },
    { fieldName: "Weight", value: "168 g" },
    { fieldName: "Power Source", value: "Battery" },
    { fieldName: "Connectivity", value: "5G, Wi-Fi, Bluetooth, NFC" },
    { fieldName: "Water Resistance", value: "Yes (IP68)" },
    { fieldName: "Release Year", value: "2023" },
  ],
  // IKEA KALLAX
  "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a": [
    { fieldName: "Product Type", value: "Physical" },
    { fieldName: "Primary Material", value: "Particleboard, Fiberboard" },
    { fieldName: "Dimensions", value: "147 x 147 x 39 cm" },
    { fieldName: "Weight", value: "55 kg" },
    { fieldName: "Mounting Type", value: "Freestanding / Wall-mounted" },
    { fieldName: "Usage Environment", value: "Indoor" },
    { fieldName: "Target User", value: "Adult" },
  ],
  // Nike Air Max 90
  "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b": [
    { fieldName: "Product Type", value: "Wearable" },
    { fieldName: "Primary Material", value: "Leather, Mesh, Rubber" },
    { fieldName: "Usage Environment", value: "Both" },
    { fieldName: "Target User", value: "Unisex" },
    { fieldName: "Release Year", value: "1990 (Reissue)" },
  ],
  // Sony WH-1000XM5
  "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c": [
    { fieldName: "Product Type", value: "Electronic" },
    { fieldName: "Primary Material", value: "Plastic, Synthetic Leather" },
    { fieldName: "Weight", value: "250 g" },
    { fieldName: "Power Source", value: "Battery" },
    { fieldName: "Connectivity", value: "Bluetooth 5.2, 3.5mm Jack" },
    { fieldName: "Usage Environment", value: "Both" },
    { fieldName: "Release Year", value: "2022" },
  ],
  // Herman Miller Aeron
  "a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d": [
    { fieldName: "Product Type", value: "Physical" },
    { fieldName: "Primary Material", value: "Aluminium, Mesh" },
    { fieldName: "Weight", value: "20 kg" },
    { fieldName: "Usage Environment", value: "Indoor" },
    { fieldName: "Target User", value: "Adult" },
  ],
  // Canon EOS R6
  "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e": [
    { fieldName: "Product Type", value: "Electronic" },
    { fieldName: "Primary Material", value: "Magnesium Alloy, Plastic" },
    { fieldName: "Dimensions", value: "138 x 97.5 x 88.4 mm" },
    { fieldName: "Weight", value: "680 g" },
    { fieldName: "Power Source", value: "Battery" },
    { fieldName: "Connectivity", value: "Wi-Fi, Bluetooth" },
    { fieldName: "Water Resistance", value: "Yes (Weather Sealed)" },
    { fieldName: "Release Year", value: "2020" },
  ],
  // PlayStation 5
  "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b": [
    { fieldName: "Product Type", value: "Electronic" },
    { fieldName: "Primary Material", value: "Plastic" },
    { fieldName: "Dimensions", value: "390 x 104 x 260 mm" },
    { fieldName: "Weight", value: "4.5 kg" },
    { fieldName: "Power Source", value: "Wired" },
    { fieldName: "Connectivity", value: "Wi-Fi 6, Bluetooth 5.1, HDMI 2.1" },
    { fieldName: "Usage Environment", value: "Indoor" },
    { fieldName: "Release Year", value: "2020" },
  ],
  // AirPods Max
  "a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d": [
    { fieldName: "Product Type", value: "Electronic" },
    { fieldName: "Primary Material", value: "Aluminium, Stainless Steel" },
    { fieldName: "Weight", value: "385 g" },
    { fieldName: "Power Source", value: "Battery" },
    { fieldName: "Connectivity", value: "Bluetooth 5.0" },
    { fieldName: "Usage Environment", value: "Both" },
    { fieldName: "Release Year", value: "2020" },
  ],
};

// Get product info for a specific product
export function getProductInfo(productId: string): ProductInfoField[] {
  return PRODUCT_INFO_BY_PRODUCT[productId] || [];
}
