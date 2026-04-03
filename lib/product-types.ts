/**
 * ============================================================================
 * PRODUCT TYPES DATA
 * ============================================================================
 * 
 * Defines the three product types, their categories, and subcategories.
 * Offers can ONLY hook within the same product type.
 */

import type { ProductType } from "./types";

// Subcategory definition with icon
export type SubcategoryDefinition = {
  id: string;
  name: string;
  icon: string; // Lucide icon name
};

// Category definition with icon
export type CategoryDefinition = {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  subcategories: SubcategoryDefinition[];
};

// Product type definition
export type ProductTypeDefinition = {
  id: ProductType;
  name: string;
  description: string;
  icon: string;
  color: string; // Tailwind color class
  categories: CategoryDefinition[];
  isActive?: boolean; // Default true - whether the type is active/visible
  isOfferCreationEnabled?: boolean; // Default true - whether offers can be created
  availabilityNote?: string; // Shown when offer creation is disabled
};

// ============================================================================
// GOODS BARTER CATEGORIES & SUBCATEGORIES
// ============================================================================
const GOODS_CATEGORIES: CategoryDefinition[] = [
  {
    id: "electronics",
    name: "Electronics",
    icon: "Cpu",
    subcategories: [
      { id: "phones", name: "Phones", icon: "Smartphone" },
      { id: "laptops", name: "Laptops", icon: "Laptop" },
      { id: "tablets", name: "Tablets", icon: "Tablet" },
      { id: "audio", name: "Audio (Headphones / Speakers)", icon: "Headphones" },
      { id: "cameras", name: "Cameras", icon: "Camera" },
      { id: "gaming-consoles", name: "Gaming Consoles", icon: "Gamepad2" },
      { id: "smart-devices", name: "Smart Devices", icon: "Watch" },
    ],
  },
  {
    id: "home-furniture",
    name: "Home & Furniture",
    icon: "Sofa",
    subcategories: [
      { id: "sofas", name: "Sofas", icon: "Sofa" },
      { id: "beds", name: "Beds", icon: "BedDouble" },
      { id: "tables", name: "Tables", icon: "Table" },
      { id: "chairs", name: "Chairs", icon: "Armchair" },
      { id: "storage-units", name: "Storage Units", icon: "Archive" },
      { id: "home-decor", name: "Home Décor", icon: "Lamp" },
    ],
  },
  {
    id: "appliances",
    name: "Appliances",
    icon: "Refrigerator",
    subcategories: [
      { id: "refrigerators", name: "Refrigerators", icon: "Refrigerator" },
      { id: "washing-machines", name: "Washing Machines", icon: "WashingMachine" },
      { id: "microwaves", name: "Microwaves", icon: "Microwave" },
      { id: "air-conditioners", name: "Air Conditioners", icon: "AirVent" },
      { id: "kitchen-appliances", name: "Kitchen Appliances", icon: "CookingPot" },
    ],
  },
  {
    id: "fashion-accessories",
    name: "Fashion & Accessories",
    icon: "Shirt",
    subcategories: [
      { id: "clothing", name: "Clothing", icon: "Shirt" },
      { id: "shoes", name: "Shoes", icon: "Footprints" },
      { id: "bags", name: "Bags / Handbags", icon: "ShoppingBag" },
      { id: "watches", name: "Watches", icon: "Watch" },
      { id: "jewelry", name: "Jewelry", icon: "Gem" },
    ],
  },
  {
    id: "baby-kids",
    name: "Baby & Kids",
    icon: "Baby",
    subcategories: [
      { id: "strollers", name: "Strollers", icon: "Baby" },
      { id: "cribs", name: "Cribs", icon: "BedSingle" },
      { id: "toys", name: "Toys", icon: "ToyBrick" },
      { id: "car-seats", name: "Car Seats", icon: "CarFront" },
      { id: "kids-furniture", name: "Kids Furniture", icon: "Armchair" },
    ],
  },
  {
    id: "sports-outdoors",
    name: "Sports & Outdoors",
    icon: "Dumbbell",
    subcategories: [
      { id: "bicycles", name: "Bicycles (Non-motorized)", icon: "Bike" },
      { id: "gym-equipment", name: "Gym Equipment", icon: "Dumbbell" },
      { id: "camping-gear", name: "Camping Gear", icon: "Tent" },
      { id: "sports-equipment", name: "Sports Equipment", icon: "Trophy" },
    ],
  },
  {
    id: "tools-equipment",
    name: "Tools & Equipment",
    icon: "Wrench",
    subcategories: [
      { id: "power-tools", name: "Power Tools", icon: "Drill" },
      { id: "gardening-tools", name: "Gardening Tools", icon: "Shovel" },
      { id: "diy-equipment", name: "DIY Equipment", icon: "Hammer" },
    ],
  },
  {
    id: "books-media",
    name: "Books, Media & Collectibles",
    icon: "BookOpen",
    subcategories: [
      { id: "books", name: "Books", icon: "Book" },
      { id: "board-games", name: "Board Games", icon: "Dice5" },
      { id: "movies", name: "Movies", icon: "Film" },
      { id: "collectibles", name: "Collectibles", icon: "Star" },
    ],
  },
  {
    id: "office-work",
    name: "Office & Work Setup",
    icon: "Monitor",
    subcategories: [
      { id: "office-chairs", name: "Office Chairs", icon: "Armchair" },
      { id: "desks", name: "Desks", icon: "Table2" },
      { id: "monitors", name: "Monitors", icon: "Monitor" },
      { id: "printers", name: "Printers", icon: "Printer" },
    ],
  },
  {
    id: "hobby-creative",
    name: "Hobby & Creative",
    icon: "Palette",
    subcategories: [
      { id: "musical-instruments", name: "Musical Instruments", icon: "Guitar" },
      { id: "art-supplies", name: "Art Supplies", icon: "Paintbrush" },
      { id: "photography-gear", name: "Photography Gear", icon: "Camera" },
    ],
  },
  {
    id: "miscellaneous",
    name: "Miscellaneous",
    icon: "Package",
    subcategories: [
      { id: "other-items", name: "Other Items", icon: "Box" },
    ],
  },
];

// ============================================================================
// AUTOMOBILE EXCHANGE CATEGORIES & SUBCATEGORIES
// ============================================================================
const AUTOMOBILE_CATEGORIES: CategoryDefinition[] = [
  {
    id: "cars",
    name: "Cars",
    icon: "Car",
    subcategories: [
      { id: "hatchback", name: "Hatchback", icon: "Car" },
      { id: "sedan", name: "Sedan", icon: "CarFront" },
      { id: "suv", name: "SUV", icon: "CarTaxiFront" },
      { id: "luxury", name: "Luxury", icon: "Crown" },
      { id: "electric-car", name: "Electric", icon: "Zap" },
    ],
  },
  {
    id: "bikes",
    name: "Bikes / Motorcycles",
    icon: "Bike",
    subcategories: [
      { id: "commuter", name: "Commuter", icon: "Bike" },
      { id: "sports-bike", name: "Sports", icon: "Gauge" },
      { id: "cruiser", name: "Cruiser", icon: "Wind" },
      { id: "electric-bike", name: "Electric", icon: "Zap" },
    ],
  },
  {
    id: "scooters",
    name: "Scooters",
    icon: "Bike",
    subcategories: [
      { id: "petrol-scooter", name: "Petrol", icon: "Fuel" },
      { id: "electric-scooter", name: "Electric", icon: "Zap" },
    ],
  },
  {
    id: "vans-commercial",
    name: "Vans & Commercial",
    icon: "Bus",
    subcategories: [
      { id: "passenger-van", name: "Passenger Van", icon: "Bus" },
      { id: "cargo-van", name: "Cargo Van", icon: "Package" },
    ],
  },
  {
    id: "trucks",
    name: "Trucks",
    icon: "Truck",
    subcategories: [
      { id: "light-truck", name: "Light Truck", icon: "Truck" },
      { id: "heavy-truck", name: "Heavy Truck", icon: "Container" },
    ],
  },
  {
    id: "trailers",
    name: "Trailers",
    icon: "Container",
    subcategories: [
      { id: "utility-trailer", name: "Utility Trailer", icon: "Container" },
      { id: "cargo-trailer", name: "Cargo Trailer", icon: "Package" },
    ],
  },
  {
    id: "caravans",
    name: "Caravans / Campers",
    icon: "Caravan",
    subcategories: [
      { id: "towable-camper", name: "Towable Camper", icon: "Caravan" },
      { id: "motorhome", name: "Motorhome", icon: "Bus" },
    ],
  },
];

// ============================================================================
// HOME & SPACES EXCHANGE CATEGORIES & SUBCATEGORIES
// ============================================================================
const HOME_SPACES_CATEGORIES: CategoryDefinition[] = [
  {
    id: "apartments",
    name: "Apartments",
    icon: "Building2",
    subcategories: [
      { id: "studio", name: "Studio", icon: "Square" },
      { id: "1-room", name: "1 Room", icon: "LayoutGrid" },
      { id: "2-room", name: "2 Room", icon: "LayoutGrid" },
      { id: "3-room", name: "3 Room", icon: "LayoutGrid" },
      { id: "4-plus-room", name: "4+ Room", icon: "LayoutGrid" },
    ],
  },
  {
    id: "houses",
    name: "Houses",
    icon: "Home",
    subcategories: [
      { id: "1-room-house", name: "1 Room House", icon: "Home" },
      { id: "2-room-house", name: "2 Room House", icon: "Home" },
      { id: "3-room-house", name: "3 Room House", icon: "Home" },
      { id: "4-plus-room-house", name: "4+ Room House", icon: "Home" },
      { id: "villa-bungalow", name: "Villa / Bungalow", icon: "Castle" },
      { id: "townhouse", name: "Townhouse / Row House", icon: "Building" },
    ],
  },
  {
    id: "rooms-coliving",
    name: "Rooms / Co-living",
    icon: "BedDouble",
    subcategories: [
      { id: "private-room", name: "Private Room", icon: "BedSingle" },
      { id: "shared-room-2", name: "Shared Room (2 Sharing)", icon: "BedDouble" },
      { id: "shared-room-3", name: "Shared Room (3+ Sharing)", icon: "Users" },
      { id: "coliving-space", name: "Co-living Space", icon: "Users" },
      { id: "pg-hostel", name: "PG / Hostel", icon: "Building" },
    ],
  },
  {
    id: "parking-spaces",
    name: "Parking Spaces",
    icon: "ParkingSquare",
    subcategories: [
      { id: "car-parking-covered", name: "Car Parking (Covered)", icon: "ParkingSquare" },
      { id: "car-parking-open", name: "Car Parking (Open)", icon: "ParkingCircle" },
      { id: "bike-parking", name: "Bike Parking", icon: "Bike" },
      { id: "ev-charging", name: "EV Charging Spot", icon: "Zap" },
    ],
  },
  {
    id: "storage-spaces",
    name: "Storage Spaces",
    icon: "Warehouse",
    subcategories: [
      { id: "small-storage", name: "Small Storage", icon: "Box" },
      { id: "medium-storage", name: "Medium Storage", icon: "Package" },
      { id: "large-storage", name: "Large Storage", icon: "Warehouse" },
      { id: "locker-storage", name: "Locker Storage", icon: "Lock" },
    ],
  },
];

// ============================================================================
// RENTALS CATEGORIES & SUBCATEGORIES
// ============================================================================
const RENTALS_CATEGORIES: CategoryDefinition[] = [
  {
    id: "apartments",
    name: "Apartments",
    icon: "Building2",
    subcategories: [
      { id: "studio", name: "Studio", icon: "Square" },
      { id: "1-bedroom", name: "1 Bedroom", icon: "LayoutGrid" },
      { id: "2-bedroom", name: "2 Bedroom", icon: "LayoutGrid" },
      { id: "3-plus-bedroom", name: "3+ Bedroom", icon: "LayoutGrid" },
    ],
  },
  {
    id: "houses",
    name: "Houses",
    icon: "Home",
    subcategories: [
      { id: "single-family", name: "Single Family", icon: "Home" },
      { id: "townhouse", name: "Townhouse", icon: "Building" },
      { id: "duplex", name: "Duplex", icon: "Building2" },
      { id: "villa", name: "Villa", icon: "Castle" },
    ],
  },
  {
    id: "rooms-co-living",
    name: "Rooms / Co-living",
    icon: "BedDouble",
    subcategories: [
      { id: "private-room", name: "Private Room", icon: "BedSingle" },
      { id: "shared-room", name: "Shared Room", icon: "BedDouble" },
      { id: "co-living-space", name: "Co-living Space", icon: "Users" },
      { id: "pg-hostel", name: "PG/Hostel", icon: "Building" },
    ],
  },
  {
    id: "parking-spaces",
    name: "Parking Spaces",
    icon: "ParkingSquare",
    subcategories: [
      { id: "covered-parking", name: "Covered Parking", icon: "ParkingSquare" },
      { id: "open-parking", name: "Open Parking", icon: "ParkingCircle" },
      { id: "garage", name: "Garage", icon: "Warehouse" },
    ],
  },
  {
    id: "storage-spaces",
    name: "Storage Spaces",
    icon: "Warehouse",
    subcategories: [
      { id: "small-unit", name: "Small Unit", icon: "Box" },
      { id: "medium-unit", name: "Medium Unit", icon: "Package" },
      { id: "large-unit", name: "Large Unit", icon: "Warehouse" },
      { id: "climate-controlled", name: "Climate Controlled", icon: "Thermometer" },
    ],
  },
];

// ============================================================================
// MINI JOBS CATEGORIES & SUBCATEGORIES
// ============================================================================
const MINI_JOBS_CATEGORIES: CategoryDefinition[] = [
  {
    id: "retail-store-help",
    name: "Retail & Store Help",
    icon: "ShoppingBag",
    subcategories: [
      { id: "cashier", name: "Cashier", icon: "Calculator" },
      { id: "stock-clerk", name: "Stock Clerk", icon: "Package" },
      { id: "sales-assistant", name: "Sales Assistant", icon: "Users" },
    ],
  },
  {
    id: "food-cafe-work",
    name: "Food & Cafe Work",
    icon: "Coffee",
    subcategories: [
      { id: "server-waiter", name: "Server/Waiter", icon: "UtensilsCrossed" },
      { id: "barista", name: "Barista", icon: "Coffee" },
      { id: "kitchen-helper", name: "Kitchen Helper", icon: "CookingPot" },
    ],
  },
  {
    id: "delivery-runner-jobs",
    name: "Delivery & Runner Jobs",
    icon: "Bike",
    subcategories: [
      { id: "food-delivery", name: "Food Delivery", icon: "UtensilsCrossed" },
      { id: "package-delivery", name: "Package Delivery", icon: "Package" },
      { id: "errands-runner", name: "Errands/Runner", icon: "Footprints" },
    ],
  },
  {
    id: "cleaning-housekeeping",
    name: "Cleaning & Housekeeping",
    icon: "Sparkles",
    subcategories: [
      { id: "house-cleaning", name: "House Cleaning", icon: "Home" },
      { id: "office-cleaning", name: "Office Cleaning", icon: "Building" },
      { id: "laundry-service", name: "Laundry Service", icon: "Shirt" },
    ],
  },
  {
    id: "warehouse-packing",
    name: "Warehouse & Packing",
    icon: "Package",
    subcategories: [
      { id: "packer", name: "Packer", icon: "Package" },
      { id: "loader-unloader", name: "Loader/Unloader", icon: "Truck" },
      { id: "inventory-clerk", name: "Inventory Clerk", icon: "ClipboardList" },
    ],
  },
  {
    id: "admin-office-support",
    name: "Admin & Office Support",
    icon: "FileText",
    subcategories: [
      { id: "data-entry", name: "Data Entry", icon: "Keyboard" },
      { id: "reception", name: "Reception", icon: "Phone" },
      { id: "filing-organizing", name: "Filing/Organizing", icon: "FolderOpen" },
    ],
  },
  {
    id: "events-temporary-help",
    name: "Events & Temporary Help",
    icon: "Calendar",
    subcategories: [
      { id: "event-staff", name: "Event Staff", icon: "Users" },
      { id: "catering-help", name: "Catering Help", icon: "UtensilsCrossed" },
      { id: "setup-breakdown", name: "Setup/Breakdown", icon: "Hammer" },
    ],
  },
];

// ============================================================================
// OWNERSHIP CATEGORIES & SUBCATEGORIES
// ============================================================================
const OWNERSHIP_CATEGORIES: CategoryDefinition[] = [
  {
    id: "real-estate",
    name: "Real Estate",
    icon: "Home",
    subcategories: [
      { id: "apartment", name: "Apartment", icon: "Building2" },
      { id: "house", name: "House", icon: "Home" },
      { id: "land-plot", name: "Land/Plot", icon: "Map" },
      { id: "vacation-property", name: "Vacation Property", icon: "Palmtree" },
    ],
  },
  {
    id: "vehicles",
    name: "Vehicles",
    icon: "Car",
    subcategories: [
      { id: "car", name: "Car", icon: "Car" },
      { id: "motorcycle", name: "Motorcycle", icon: "Bike" },
      { id: "boat", name: "Boat", icon: "Ship" },
      { id: "rv-camper", name: "RV/Camper", icon: "Caravan" },
    ],
  },
  {
    id: "commercial-property",
    name: "Commercial Property",
    icon: "Building",
    subcategories: [
      { id: "office-space", name: "Office Space", icon: "Building2" },
      { id: "retail-space", name: "Retail Space", icon: "Store" },
      { id: "warehouse", name: "Warehouse", icon: "Warehouse" },
      { id: "industrial", name: "Industrial", icon: "Factory" },
    ],
  },
];

// ============================================================================
// PRODUCT TYPE DEFINITIONS
// ============================================================================
export const PRODUCT_TYPES: ProductTypeDefinition[] = [
  {
    id: "goods",
    name: "General Goods Barter",
    description: "Barter any items across different categories",
    icon: "ShoppingBag",
    color: "text-blue-500",
    categories: GOODS_CATEGORIES,
  },
  {
    id: "automobile",
    name: "Automobile Barter",
    description: "Barter vehicles within automobile categories",
    icon: "Car",
    color: "text-orange-500",
    categories: AUTOMOBILE_CATEGORIES,
    isActive: false, // Deactivated
  },
  {
    id: "home-spaces",
    name: "Homes & Spaces Barter",
    description: "Barter living spaces and rentals",
    icon: "Home",
    color: "text-green-500",
    categories: HOME_SPACES_CATEGORIES,
    isActive: false, // Deactivated
  },
  {
    id: "rentals",
    name: "Rentals",
    description: "Find and list rental properties and spaces",
    icon: "Building2",
    color: "text-emerald-500",
    categories: RENTALS_CATEGORIES,
    isOfferCreationEnabled: false,
    availabilityNote: "Launching soon",
  },
  {
    id: "mini-jobs",
    name: "Mini Jobs",
    description: "Short-term and temporary work opportunities",
    icon: "Briefcase",
    color: "text-purple-500",
    categories: MINI_JOBS_CATEGORIES,
    isOfferCreationEnabled: false,
    availabilityNote: "Launching soon",
  },
  {
    id: "ownership",
    name: "Ownership",
    description: "Exchange real estate, vehicles, and property ownership",
    icon: "Key",
    color: "text-amber-500",
    categories: OWNERSHIP_CATEGORIES,
    isOfferCreationEnabled: false,
    availabilityNote: "Launching soon",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getProductType(id: ProductType): ProductTypeDefinition | undefined {
  return PRODUCT_TYPES.find((pt) => pt.id === id);
}

// Get only active product types (isActive !== false)
export function getActiveProductTypes(): ProductTypeDefinition[] {
  return PRODUCT_TYPES.filter((pt) => pt.isActive !== false);
}

// Check if offer creation is enabled for a product type
export function isOfferCreationEnabled(id: ProductType): boolean {
  const pt = getProductType(id);
  return pt?.isOfferCreationEnabled !== false;
}

// Get availability note for a product type
export function getAvailabilityNote(id: ProductType): string | undefined {
  return getProductType(id)?.availabilityNote;
}

export function getProductTypeCategories(productType: ProductType): CategoryDefinition[] {
  const pt = getProductType(productType);
  return pt?.categories || [];
}

export function getCategory(productType: ProductType, categoryId: string): CategoryDefinition | undefined {
  const categories = getProductTypeCategories(productType);
  return categories.find((c) => c.id === categoryId);
}

export function getCategoryByName(productType: ProductType, categoryName: string): CategoryDefinition | undefined {
  const categories = getProductTypeCategories(productType);
  return categories.find((c) => c.name === categoryName);
}

export function getSubcategories(productType: ProductType, categoryId: string): SubcategoryDefinition[] {
  const category = getCategory(productType, categoryId);
  return category?.subcategories || [];
}

export function getSubcategory(productType: ProductType, categoryId: string, subcategoryId: string): SubcategoryDefinition | undefined {
  const subcategories = getSubcategories(productType, categoryId);
  return subcategories.find((s) => s.id === subcategoryId);
}

export function getSubcategoryByName(productType: ProductType, categoryId: string, subcategoryName: string): SubcategoryDefinition | undefined {
  const subcategories = getSubcategories(productType, categoryId);
  return subcategories.find((s) => s.name === subcategoryName);
}

export function getProductTypeName(id: ProductType): string {
  return getProductType(id)?.name || id;
}

export function getProductTypeColor(id: ProductType): string {
  return getProductType(id)?.color || "text-foreground";
}

// Check if two offers can hook (must be same product type)
export function canOffersHook(productType1: ProductType, productType2: ProductType): boolean {
  return productType1 === productType2;
}
