import type { Product, Offer, Hook, DashboardStats, ProductInfoField, LockLevel, NotificationState } from "./types";
import { getProductInfo } from "./offer-info-fields";

// Helper to create default workflow fields for offers
const defaultOfferWorkflow = {
  readyState: false,
  lockLevel: 0 as LockLevel,
  notificationState: 0 as NotificationState,
  isActive: true,
};

// Helper to create default workflow fields for hooks
const defaultHookWorkflow = {
  lockLevel: 0 as LockLevel,
  isActive: true,
};

// ==========================================
// Mock Products — realistic used goods
// Categories match product-types.ts definitions
// ==========================================
export const MOCK_PRODUCTS: Product[] = [
  // ========== GOODS BARTER ==========
  {
    productId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    productType: "goods",
    title: "iPhone 13 Pro",
    category: "Electronics",
    subcategory: "Phones",
    brand: "Apple",
    model: "iPhone 13 Pro",
    imageUrl: "",
    offerCount: 3,
  },
  {
    productId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    productType: "goods",
    title: "MacBook Air M2",
    category: "Electronics",
    subcategory: "Laptops",
    brand: "Apple",
    model: "MacBook Air M2",
    imageUrl: "",
    offerCount: 2,
  },
  {
    productId: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    productType: "goods",
    title: "Samsung Galaxy S23",
    category: "Electronics",
    subcategory: "Phones",
    brand: "Samsung",
    model: "Galaxy S23",
    imageUrl: "",
    offerCount: 1,
  },
  {
    productId: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    productType: "goods",
    title: "IKEA KALLAX Shelf",
    category: "Home & Furniture",
    subcategory: "Storage Units",
    brand: "IKEA",
    model: "KALLAX",
    imageUrl: "",
    offerCount: 2,
  },
  {
    productId: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
    productType: "goods",
    title: "Nike Air Max 90",
    category: "Fashion & Accessories",
    subcategory: "Shoes",
    brand: "Nike",
    model: "Air Max 90",
    imageUrl: "",
    offerCount: 1,
  },
  {
    productId: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
    productType: "goods",
    title: "Sony WH-1000XM5",
    category: "Electronics",
    subcategory: "Audio (Headphones / Speakers)",
    brand: "Sony",
    model: "WH-1000XM5",
    imageUrl: "",
    offerCount: 2,
  },
  {
    productId: "a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d",
    productType: "goods",
    title: "Herman Miller Aeron Chair",
    category: "Office & Work Setup",
    subcategory: "Office Chairs",
    brand: "Herman Miller",
    model: "Aeron",
    imageUrl: "",
    offerCount: 0,
  },
  {
    productId: "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e",
    productType: "goods",
    title: "Canon EOS R6",
    category: "Electronics",
    subcategory: "Cameras",
    brand: "Canon",
    model: "EOS R6",
    imageUrl: "",
    offerCount: 1,
  },
  {
    productId: "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f",
    productType: "goods",
    title: "Dyson V15 Detect",
    category: "Appliances",
    subcategory: "Kitchen Appliances",
    brand: "Dyson",
    model: "V15 Detect",
    imageUrl: "",
    offerCount: 0,
  },
  {
    productId: "d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a",
    productType: "goods",
    title: "Levi's 501 Jeans",
    category: "Fashion & Accessories",
    subcategory: "Clothing",
    brand: "Levi's",
    model: "501 Original",
    imageUrl: "",
    offerCount: 1,
  },
  {
    productId: "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
    productType: "goods",
    title: "PlayStation 5",
    category: "Electronics",
    subcategory: "Gaming Consoles",
    brand: "Sony",
    model: "PS5",
    imageUrl: "",
    offerCount: 2,
  },
  {
    productId: "f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c",
    productType: "goods",
    title: "KitchenAid Stand Mixer",
    category: "Appliances",
    subcategory: "Kitchen Appliances",
    brand: "KitchenAid",
    model: "Artisan",
    imageUrl: "",
    offerCount: 0,
  },
  {
    productId: "a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d",
    productType: "goods",
    title: "AirPods Max",
    category: "Electronics",
    subcategory: "Audio (Headphones / Speakers)",
    brand: "Apple",
    model: "AirPods Max",
    imageUrl: "",
    offerCount: 1,
  },
  // ========== AUTOMOBILE ==========
  {
    productId: "auto-001-toyota-corolla",
    productType: "automobile",
    title: "Toyota Corolla",
    category: "Cars",
    subcategory: "Sedan",
    brand: "Toyota",
    model: "Corolla 2020",
    imageUrl: "",
    offerCount: 2,
  },
  {
    productId: "auto-002-honda-civic",
    productType: "automobile",
    title: "Honda Civic",
    category: "Cars",
    subcategory: "Sedan",
    brand: "Honda",
    model: "Civic 2021",
    imageUrl: "",
    offerCount: 1,
  },
  {
    productId: "auto-003-yamaha-mt07",
    productType: "automobile",
    title: "Yamaha MT-07",
    category: "Bikes / Motorcycles",
    subcategory: "Sports",
    brand: "Yamaha",
    model: "MT-07 2022",
    imageUrl: "",
    offerCount: 1,
  },
  {
    productId: "auto-004-vw-transporter",
    productType: "automobile",
    title: "VW Transporter T6",
    category: "Vans & Commercial",
    subcategory: "Cargo Van",
    brand: "Volkswagen",
    model: "Transporter T6",
    imageUrl: "",
    offerCount: 0,
  },
  // ========== HOME & SPACES ==========
  {
    productId: "home-001-2room-apt",
    productType: "home-spaces",
    title: "Apartments - 2 Room",
    category: "Apartments",
    subcategory: "2 Room",
    imageUrl: "",
    offerCount: 3,
  },
  {
    productId: "home-002-studio-apt",
    productType: "home-spaces",
    title: "Apartments - Studio",
    category: "Apartments",
    subcategory: "Studio",
    imageUrl: "",
    offerCount: 2,
  },
  {
    productId: "home-003-parking",
    productType: "home-spaces",
    title: "Parking Spaces - Car Parking (Covered)",
    category: "Parking Spaces",
    subcategory: "Car Parking (Covered)",
    imageUrl: "",
    offerCount: 1,
  },
  {
    productId: "home-004-storage",
    productType: "home-spaces",
    title: "Storage Spaces - Small Storage",
    category: "Storage Spaces",
    subcategory: "Small Storage",
    imageUrl: "",
    offerCount: 0,
  },
];

// ==========================================
// Mock Offers (status is NOT on offers - it's on hooks)
// ==========================================
export const MOCK_OFFERS: Offer[] = [
  // iPhone 13 Pro offers
  {
    offerId: "1a2b3c4d-e5f6-4a7b-8c9d-000000000001",
    productId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000001",
    title: "iPhone 13 Pro 256GB - Space Gray",
    description: "Great condition, minor scratches on the back. Battery health 89%.",
    hookedCount: 2,
    outgoingHookCount: 1,
    readyForCommit: false,
    offerInfo: [
      { fieldId: "condition", fieldName: "Condition", fieldType: "single_select", value: "Good" },
      { fieldId: "color", fieldName: "Color", fieldType: "text", value: "Space Gray" },
      { fieldId: "purchase_date", fieldName: "Purchase Month & Year", fieldType: "date_select", value: "03/2022" },
      { fieldId: "battery_health", fieldName: "Battery Health", fieldType: "text", value: "89%" },
      { fieldId: "warranty_status", fieldName: "Warranty Status", fieldType: "single_select", value: "Expired" },
      { fieldId: "included_items", fieldName: "Included Items", fieldType: "multi_select", value: ["Original Box", "Charger/Cable"] },
      { fieldId: "visible_damages", fieldName: "Visible Damages", fieldType: "multi_select", value: ["Scratches"] },
      { fieldId: "functional_issues", fieldName: "Functional Issues", fieldType: "multi_select", value: ["None"] },
    ],
    ...defaultOfferWorkflow,
  },
  {
    offerId: "1a2b3c4d-e5f6-4a7b-8c9d-000000000002",
    productId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000002",
    title: "iPhone 13 Pro 128GB - Gold",
    description: "Used for 1 year, no screen damage. Factory reset done.",
    hookedCount: 1,
    outgoingHookCount: 0,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  {
    offerId: "1a2b3c4d-e5f6-4a7b-8c9d-000000000003",
    productId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000003",
    title: "iPhone 13 Pro 512GB - Sierra Blue",
    description: "Pristine condition, always used with a case. Battery health 94%.",
    hookedCount: 0,
    outgoingHookCount: 2,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  // MacBook Air M2 offers
  {
    offerId: "2b3c4d5e-f6a7-4b8c-9d0e-000000000001",
    productId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000004",
    title: "MacBook Air M2 8GB/256GB - Midnight",
    description: "Bought 6 months ago. Light use, mostly for browsing.",
    hookedCount: 3,
    outgoingHookCount: 1,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  {
    offerId: "2b3c4d5e-f6a7-4b8c-9d0e-000000000002",
    productId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000005",
    title: "MacBook Air M2 16GB/512GB - Starlight",
    description: "Heavy dev use for 1 year. Keyboard in good shape.",
    hookedCount: 1,
    outgoingHookCount: 0,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  // Samsung Galaxy S23
  {
    offerId: "3c4d5e6f-a7b8-4c9d-0e1f-000000000001",
    productId: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000006",
    title: "Samsung Galaxy S23 128GB - Phantom Black",
    description: "Excellent condition. Used with case since day one.",
    hookedCount: 0,
    outgoingHookCount: 1,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  // IKEA KALLAX offers
  {
    offerId: "4d5e6f7a-b8c9-4d0e-1f2a-000000000001",
    productId: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000007",
    title: "KALLAX 4x4 White - Good Condition",
    description: "Some wear on the edges. All shelves intact.",
    hookedCount: 1,
    outgoingHookCount: 2, // Hooked to iPhone 13 Pro and MacBook Air M2
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  {
    offerId: "4d5e6f7a-b8c9-4d0e-1f2a-000000000002",
    productId: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000008",
    title: "KALLAX 2x2 Oak Effect - Like New",
    description: "Barely used, in excellent shape. Perfect for small spaces.",
    hookedCount: 0,
    outgoingHookCount: 0,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  // Nike Air Max 90
  {
    offerId: "5e6f7a8b-c9d0-4e1f-2a3b-000000000001",
    productId: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000009",
    title: "Nike Air Max 90 Size 10 - White/Black",
    description: "Worn a handful of times. Soles in great condition.",
    hookedCount: 1,
    outgoingHookCount: 1,
    readyForCommit: true,
    pickupReadyDate: "20/03/26",
    pickupAddress: {
      country: "Netherlands",
      city: "Amsterdam",
      state: "North Holland",
      zip: "1012 AB",
      addressLine1: "Damrak 1",
    },
    ...defaultOfferWorkflow,
    lockLevel: 1 as LockLevel, // Reserved - demo for pickup readiness flow
  },
  // Sony WH-1000XM5
  {
    offerId: "6f7a8b9c-d0e1-4f2a-3b4c-000000000001",
    productId: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000010",
    title: "Sony WH-1000XM5 - Black",
    description: "Superb noise cancellation. 8 months old.",
    hookedCount: 2,
    outgoingHookCount: 0,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  {
    offerId: "6f7a8b9c-d0e1-4f2a-3b4c-000000000002",
    productId: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000011",
    title: "Sony WH-1000XM5 - Silver",
    description: "Minor wear on headband. Perfect sound quality.",
    hookedCount: 0,
    outgoingHookCount: 1,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  // Canon EOS R6
  {
    offerId: "7a8b9c0d-e1f2-4a3b-4c5d-000000000001",
    productId: "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000012",
    title: "Canon EOS R6 Body Only - Low Shutter Count",
    description: "12k shutter count. No issues. Sensor cleaned recently.",
    hookedCount: 0,
    outgoingHookCount: 0,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  // Levi's 501
  {
    offerId: "8b9c0d1e-f2a3-4b4c-5d6e-000000000001",
    productId: "d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000013",
    title: "Levi's 501 W32/L32 - Dark Wash",
    description: "Worn less than 10 times. Classic fit. No fading or damage.",
    hookedCount: 0,
    outgoingHookCount: 0,
    readyForCommit: true,
    ...defaultOfferWorkflow,
    lockLevel: 2 as LockLevel, // Processing - demo for committed state
    readyState: true,
  },
  // PlayStation 5
  {
    offerId: "9c0d1e2f-a3b4-4c5d-6e7f-000000000001",
    productId: "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000014",
    title: "PS5 Disc Edition - 2 Controllers",
    description: "Lightly used, excellent condition. Includes 2 DualSense controllers.",
    hookedCount: 3,
    outgoingHookCount: 2,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
  {
    offerId: "9c0d1e2f-a3b4-4c5d-6e7f-000000000002",
    productId: "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000015",
    title: "PS5 Digital Edition - Mint",
    description: "Never dropped, always on a stable surface. Digital only.",
    hookedCount: 1,
    outgoingHookCount: 0,
    readyForCommit: true,
    pickupAddress: {
      country: "Germany",
      city: "Berlin",
      zip: "10178",
      addressLine1: "Alexanderplatz 1",
    },
    ...defaultOfferWorkflow,
    lockLevel: 3 as LockLevel, // Exchanged - demo for closed offers
    readyState: true,
  },
  // AirPods Max
  {
    offerId: "0d1e2f3a-b4c5-4d6e-7f8a-000000000001",
    productId: "a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d",
    ownerUserId: "aaaabbbb-cccc-4ddd-eeee-000000000016",
    title: "AirPods Max - Space Gray",
    description: "Perfect condition, used for 3 months.",
    hookedCount: 1,
    outgoingHookCount: 0,
    readyForCommit: false,
    ...defaultOfferWorkflow,
  },
];

// ==========================================
// Mock Hooks (status is on the hook)
// Pre-populated with some demo hooks to show the "hooked products" feature
// ==========================================
export const MOCK_HOOKS: Hook[] = [
  // Nike Air Max offer is hooked to iPhone 15 Pro Max offer
  {
    hookId: "hook-demo-001",
    correlationId: "corr-demo-001",
    fromOfferId: "5e6f7a8b-c9d0-4e1f-2a3b-000000000001", // Nike Air Max 90
    toOfferId: "1a2b3c4d-e5f6-4a7b-8c9d-000000000001",   // iPhone 15 Pro Max
    status: "reserved",
    ...defaultHookWorkflow,
    lockLevel: 1 as LockLevel, // Reserved
  },
  // Nike Air Max offer is also hooked to MacBook Pro offer
  {
    hookId: "hook-demo-002",
    correlationId: "corr-demo-001",
    fromOfferId: "5e6f7a8b-c9d0-4e1f-2a3b-000000000001", // Nike Air Max 90
    toOfferId: "2b3c4d5e-f6a7-4b8c-9d0e-000000000001",   // MacBook Pro M3
    status: "searching",
    ...defaultHookWorkflow,
  },
  // PS5 offer is hooked to Samsung TV offer
  {
    hookId: "hook-demo-003",
    correlationId: "corr-demo-002",
    fromOfferId: "9c0d1e2f-a3b4-4c5d-6e7f-000000000002", // PS5 Digital Edition
    toOfferId: "4d5e6f7a-8b9c-4d0e-1f2a-000000000001",   // Samsung Neo QLED
    status: "exchanged",
    exchangedDate: "2024-03-15",
    ...defaultHookWorkflow,
    lockLevel: 3 as LockLevel, // Done
  },
  // MacBook Air M2 offer is hooked to Canon EOS R6 offer
  {
    hookId: "hook-demo-004",
    correlationId: "corr-demo-003",
    fromOfferId: "2b3c4d5e-f6a7-4b8c-9d0e-000000000001", // MacBook Air M2
    toOfferId: "7a8b9c0d-e1f2-4a3b-4c5d-000000000001",   // Canon EOS R6
    status: "searching",
    ...defaultHookWorkflow,
  },
  // KALLAX offer is hooked to iPhone 13 Pro offer (owner wants iPhone)
  {
    hookId: "hook-demo-005",
    correlationId: "corr-demo-004",
    fromOfferId: "4d5e6f7a-b8c9-4d0e-1f2a-000000000001", // KALLAX 4x4 White
    toOfferId: "1a2b3c4d-e5f6-4a7b-8c9d-000000000001",   // iPhone 13 Pro 256GB
    status: "searching",
    ...defaultHookWorkflow,
  },
  // KALLAX offer is also hooked to MacBook Air M2 offer (owner also wants MacBook)
  {
    hookId: "hook-demo-006",
    correlationId: "corr-demo-004",
    fromOfferId: "4d5e6f7a-b8c9-4d0e-1f2a-000000000001", // KALLAX 4x4 White
    toOfferId: "2b3c4d5e-f6a7-4b8c-9d0e-000000000001",   // MacBook Air M2
    status: "searching",
    ...defaultHookWorkflow,
  },
  // iPhone 13 Pro 256GB (offer 1) is hooked to Sony WH-1000XM5
  {
    hookId: "hook-demo-007",
    correlationId: "corr-demo-005",
    fromOfferId: "1a2b3c4d-e5f6-4a7b-8c9d-000000000001", // iPhone 13 Pro 256GB
    toOfferId: "6f7a8b9c-d0e1-4f2a-3b4c-000000000001",   // Sony WH-1000XM5
    status: "searching",
    ...defaultHookWorkflow,
  },
  // iPhone 13 Pro 512GB (offer 3) is hooked to PS5 Disc and Canon EOS R6
  {
    hookId: "hook-demo-008",
    correlationId: "corr-demo-006",
    fromOfferId: "1a2b3c4d-e5f6-4a7b-8c9d-000000000003", // iPhone 13 Pro 512GB
    toOfferId: "9c0d1e2f-a3b4-4c5d-6e7f-000000000001",   // PS5 Disc Edition
    status: "searching",
    ...defaultHookWorkflow,
  },
  {
    hookId: "hook-demo-009",
    correlationId: "corr-demo-006",
    fromOfferId: "1a2b3c4d-e5f6-4a7b-8c9d-000000000003", // iPhone 13 Pro 512GB
    toOfferId: "7a8b9c0d-e1f2-4a3b-4c5d-000000000001",   // Canon EOS R6
    status: "searching",
    ...defaultHookWorkflow,
  },
  // Samsung Galaxy S23 is hooked to AirPods Max
  {
    hookId: "hook-demo-010",
    correlationId: "corr-demo-007",
    fromOfferId: "3c4d5e6f-a7b8-4c9d-0e1f-000000000001", // Samsung Galaxy S23
    toOfferId: "0d1e2f3a-b4c5-4d6e-7f8a-000000000001",   // AirPods Max
    status: "searching",
    ...defaultHookWorkflow,
  },
  // Sony WH-1000XM5 Silver is hooked to Levi's 501 Jeans
  {
    hookId: "hook-demo-011",
    correlationId: "corr-demo-008",
    fromOfferId: "6f7a8b9c-d0e1-4f2a-3b4c-000000000002", // Sony WH-1000XM5 Silver
    toOfferId: "8b9c0d1e-f2a3-4b4c-5d6e-000000000001",   // Levi's 501
    status: "processing",
    ...defaultHookWorkflow,
    lockLevel: 2 as LockLevel, // Processing
  },
  // PS5 Disc Edition is hooked to MacBook Air M2 and iPhone 13 Pro
  {
    hookId: "hook-demo-012",
    correlationId: "corr-demo-009",
    fromOfferId: "9c0d1e2f-a3b4-4c5d-6e7f-000000000001", // PS5 Disc Edition
    toOfferId: "2b3c4d5e-f6a7-4b8c-9d0e-000000000001",   // MacBook Air M2
    status: "searching",
    ...defaultHookWorkflow,
  },
  {
    hookId: "hook-demo-013",
    correlationId: "corr-demo-009",
    fromOfferId: "9c0d1e2f-a3b4-4c5d-6e7f-000000000001", // PS5 Disc Edition
    toOfferId: "1a2b3c4d-e5f6-4a7b-8c9d-000000000001",   // iPhone 13 Pro 256GB
    status: "searching",
    ...defaultHookWorkflow,
  },
];

// ==========================================
// Mock Dashboard Stats
// ==========================================
export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalUsers: 1247,
  activeOffers: 15,
  activeHooks: 38,
  reservedCycles: 6,
  committedOffers: 23,
  totalProducts: 13,
};

// ==========================================
// Placeholder text suggestions by product category
// ==========================================
export const OFFER_TITLE_SUGGESTIONS: Record<string, string[]> = {
  Smartphones: [
    "e.g. iPhone 13 Pro 256GB - Space Gray, great condition",
    "e.g. Samsung Galaxy S23 128GB - Like new, unlocked",
  ],
  Laptops: [
    "e.g. MacBook Air M2 256GB - 45 battery cycles",
    "e.g. ThinkPad X1 Carbon - Work-ready, 16GB RAM",
  ],
  Headphones: [
    "e.g. Sony WH-1000XM5 Black - 8 months old",
    "e.g. AirPods Pro 2 - With MagSafe case",
  ],
  default: [
    "e.g. Describe your item clearly with brand, model, and condition",
  ],
};

export const OFFER_DESC_SUGGESTIONS: Record<string, string[]> = {
  Smartphones: [
    "Describe battery health, storage, color, any damage, and included accessories...",
  ],
  Laptops: [
    "Note RAM, storage, battery cycles, any cosmetic issues, and peripherals included...",
  ],
  Headphones: [
    "Mention sound quality, noise cancellation effectiveness, age, and included accessories...",
  ],
  default: [
    "Describe the condition honestly: any wear, damage, or missing parts. Include what comes with it.",
  ],
};

export function getOfferTitlePlaceholder(subcategory: string, index?: number): string {
  const suggestions = OFFER_TITLE_SUGGESTIONS[subcategory] || OFFER_TITLE_SUGGESTIONS.default;
  const i = index !== undefined ? index % suggestions.length : Math.floor(Math.random() * suggestions.length);
  return suggestions[i];
}

export function getOfferDescPlaceholder(subcategory: string, index?: number): string {
  const suggestions = OFFER_DESC_SUGGESTIONS[subcategory] || OFFER_DESC_SUGGESTIONS.default;
  const i = index !== undefined ? index % suggestions.length : Math.floor(Math.random() * suggestions.length);
  return suggestions[i];
}
