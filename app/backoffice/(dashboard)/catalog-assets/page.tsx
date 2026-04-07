"use client";

/**
 * ============================================================================
 * CATALOG ASSETS - Back Office Product Data Management
 * ============================================================================
 * Browse products and manage:
 * - Category icons
 * - Sub-category icons
 * - Brand logos
 * - Model/product images
 * - Product info field values
 * 
 * This is the entry/browse screen only. Detail/edit screens TBD.
 */

import { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, Package, X, ChevronDown } from "lucide-react";
import {
  // Category icons
  Cpu, Sofa, Refrigerator, Shirt, Baby, Dumbbell, Wrench, BookOpen, Monitor, Paintbrush,
  Car, Bike, Bus, Truck, Container, Caravan,
  Building2, Home, BedDouble, ParkingSquare, Warehouse,
  // Subcategory icons
  Smartphone, Laptop, Tablet, Headphones, Camera, Gamepad2, Watch,
  Table, Armchair, Archive, Lamp, WashingMachine, Microwave, AirVent, CookingPot,
  Footprints, ShoppingBag, Gem, BedSingle, ToyBrick, CarFront,
  Tent, Trophy, Drill, Shovel, Hammer, Book, Dice5, Film, Star, Table2, Printer, Guitar,
  Box, CarTaxiFront, Crown, Zap, Gauge, Wind, Fuel, Users, Castle, Building,
  ParkingCircle, Lock, Square, LayoutGrid,
  Briefcase, Key,
} from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import type { Product, ProductType } from "@/lib/types";
import { getProductTypeCategories, getCategoryByName, getProductTypes, type CategoryDefinition, type SubcategoryDefinition } from "@/lib/product-types";

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // Cross-product
  electronics: Cpu,
  "home-furniture": Sofa,
  appliances: Refrigerator,
  "fashion-accessories": Shirt,
  "baby-kids": Baby,
  "sports-outdoors": Dumbbell,
  "tools-equipment": Wrench,
  "books-media": BookOpen,
  "office-work": Monitor,
  "hobby-creative": Paintbrush,
  miscellaneous: Package,
  // Automobile
  cars: Car,
  bikes: Bike,
  scooters: Bike,
  "vans-commercial": Bus,
  trucks: Truck,
  trailers: Container,
  caravans: Caravan,
  // Home & Spaces
  apartments: Building2,
  houses: Home,
  "rooms-coliving": BedDouble,
  "parking-spaces": ParkingSquare,
  "storage-spaces": Warehouse,
};

// Icon mapping for subcategories
const SUBCATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Smartphone, Laptop, Tablet, Headphones, Camera, Gamepad2, Watch,
  Sofa, BedDouble, Table, Armchair, Archive, Lamp,
  Refrigerator, WashingMachine, Microwave, AirVent, CookingPot,
  Shirt, Footprints, ShoppingBag, Gem,
  Baby, BedSingle, ToyBrick, CarFront,
  Bike, Dumbbell, Tent, Trophy,
  Drill, Shovel, Hammer,
  Book, Dice5, Film, Star,
  Table2, Monitor, Printer,
  Guitar, Paintbrush,
  Package, Box,
  Car, CarTaxiFront, Crown, Zap, Gauge, Wind, Fuel,
  Bus, Truck, Container, Caravan,
  Building2, Home, Castle, Building, Users,
  ParkingSquare, ParkingCircle, Warehouse, Lock, Square, LayoutGrid,
  Cpu,
};

// Barter type tabs configuration
const BARTER_TYPES: Array<{
  id: ProductType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { id: "goods", label: "Goods", icon: ShoppingBag, color: "text-blue-500" },
  { id: "rentals", label: "Rentals", icon: Building2, color: "text-emerald-500" },
  { id: "mini-jobs", label: "Mini Jobs", icon: Briefcase, color: "text-purple-500" },
  { id: "automobile", label: "Automobile", icon: Car, color: "text-orange-500" },
  { id: "home-spaces", label: "Homes & Spaces", icon: Home, color: "text-green-500" },
  { id: "ownership", label: "Ownership", icon: Key, color: "text-amber-500" },
];

// Simple product image component
function ProductImageBox({ src, alt }: { src?: string | null; alt: string }) {
  if (src) {
    return (
      <div className="h-14 w-14 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border border-border">
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain"
          crossOrigin="anonymous"
        />
      </div>
    );
  }
  return (
    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border border-border">
      <Package className="h-6 w-6 text-muted-foreground/40" />
    </div>
  );
}

export default function CatalogAssetsPage() {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const [activeBarterType, setActiveBarterType] = useState<ProductType>("goods");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<"category" | "subcategory" | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Fetch products for the active barter type
  const { data: products = [], isLoading, error } = useProducts({ barterType: activeBarterType });
  
  // Get categories for current barter type
  const categories = useMemo(() => getProductTypeCategories(activeBarterType), [activeBarterType]);
  
  // Get subcategories for selected categories
  const subcategories = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    const allSubcategories: SubcategoryDefinition[] = [];
    selectedCategories.forEach(catName => {
      const categoryDef = getCategoryByName(activeBarterType, catName);
      if (categoryDef) {
        allSubcategories.push(...categoryDef.subcategories);
      }
    });
    return allSubcategories;
  }, [activeBarterType, selectedCategories]);
  
  // Reset filters when barter type changes
  useEffect(() => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setExpandedSection(null);
    setSelectedProduct(null);
  }, [activeBarterType]);

  // ---------------------------------------------------------------------------
  // FILTER LOGIC
  // ---------------------------------------------------------------------------
  const hasActiveFilters = selectedCategories.length > 0 || selectedSubcategories.length > 0;
  const activeFilterCount = [
    selectedCategories.length > 0,
    selectedSubcategories.length > 0,
  ].filter(Boolean).length;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.productType !== activeBarterType) return false;
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(p.subcategory)) return false;
      return true;
    });
  }, [products, activeBarterType, searchQuery, selectedCategories, selectedSubcategories]);

  function clearAllFilters() {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setExpandedSection(null);
  }

  function handleSelectCategory(categoryName: string) {
    const isSelected = selectedCategories.includes(categoryName);
    let newCategories: string[];
    let newSubcategories = selectedSubcategories;
    
    if (isSelected) {
      newCategories = selectedCategories.filter(c => c !== categoryName);
      const categoryDef = getCategoryByName(activeBarterType, categoryName);
      if (categoryDef) {
        const subNames = categoryDef.subcategories.map(s => s.name);
        newSubcategories = selectedSubcategories.filter(s => !subNames.includes(s));
      }
    } else {
      newCategories = [...selectedCategories, categoryName];
      setExpandedSection("subcategory");
    }
    
    setSelectedCategories(newCategories);
    setSelectedSubcategories(newSubcategories);
  }

  function handleSelectSubcategory(subcategoryName: string) {
    const isSelected = selectedSubcategories.includes(subcategoryName);
    if (isSelected) {
      setSelectedSubcategories(selectedSubcategories.filter(s => s !== subcategoryName));
    } else {
      setSelectedSubcategories([...selectedSubcategories, subcategoryName]);
    }
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Catalog Assets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and manage product catalog data: images, icons, and field values
        </p>
      </div>

      {/* Barter Type Tabs - same design as main app */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {BARTER_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = activeBarterType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setActiveBarterType(type.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? `bg-secondary/80 ${type.color}`
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? type.color : ""}`} />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Search + Filter Toggle Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-3 transition-colors ${
            showFilters || hasActiveFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-input bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Filters</span>
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible Filters Panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card">
          {/* Filter Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <h3 className="text-sm font-medium text-foreground">Filters</h3>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="text-xs text-primary hover:underline">
                  Clear all
                </button>
              )}
              <button onClick={() => setShowFilters(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category Accordion */}
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === "category" ? null : "category")}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">Category</span>
                {selectedCategories.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {selectedCategories.map(cat => (
                      <span key={cat} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${expandedSection === "category" ? "rotate-180" : ""}`} />
            </button>
            
            {expandedSection === "category" && categories.length > 0 && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {categories.map((cat: CategoryDefinition) => {
                    const CatIcon = CATEGORY_ICONS[cat.id] || Package;
                    const isSelected = selectedCategories.includes(cat.name);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat.name)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50"
                        }`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isSelected ? "bg-primary/20" : "bg-secondary"}`}>
                          <CatIcon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-foreground"}`} />
                        </div>
                        <span className={`text-[10px] font-medium text-center leading-tight ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Subcategory Accordion */}
          {selectedCategories.length > 0 && subcategories.length > 0 && (
            <div>
              <button
                onClick={() => setExpandedSection(expandedSection === "subcategory" ? null : "subcategory")}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary/30 transition-colors border-t border-border"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">Subcategory</span>
                  {selectedSubcategories.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {selectedSubcategories.map(sub => (
                        <span key={sub} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${expandedSection === "subcategory" ? "rotate-180" : ""}`} />
              </button>
              
              {expandedSection === "subcategory" && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {subcategories.map((sub: SubcategoryDefinition) => {
                      const SubIcon = SUBCATEGORY_ICONS[sub.icon] || Package;
                      const isSelected = selectedSubcategories.includes(sub.name);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleSelectSubcategory(sub.name)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50"
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isSelected ? "bg-primary/20" : "bg-secondary"}`}>
                            <SubIcon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-foreground"}`} />
                          </div>
                          <span className={`text-[10px] font-medium text-center leading-tight ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                            {sub.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Product Grid - same card style as main app but without offers count */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="p-4 min-h-[88px]">
                <div className="flex gap-3">
                  <div className="h-14 w-14 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-border rounded-lg bg-card">
          <Package className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">Failed to load products. Please try again.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-border rounded-lg bg-card">
          <Package className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">
            {products.length === 0 ? "No products in this barter type yet." : "No products match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {filteredProducts.map((product) => (
            <div
              key={product.productId}
              className={`rounded-xl border bg-card overflow-hidden cursor-pointer transition-colors hover:border-primary/30 w-full ${
                selectedProduct?.productId === product.productId 
                  ? "border-primary ring-1 ring-primary/30" 
                  : "border-border"
              }`}
              onClick={() => setSelectedProduct(
                selectedProduct?.productId === product.productId ? null : product
              )}
            >
              <div className="p-4 min-h-[88px]">
                <div className="flex gap-3">
                  <ProductImageBox src={product.imageUrl} alt={product.title} />

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {product.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {product.subcategory} · {product.brand}
                    </p>
                    {/* Product info indicators */}
                    <div className="flex gap-2 mt-1">
                      {product.imageUrl && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">
                          Has Image
                        </span>
                      )}
                      {!product.imageUrl && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                          No Image
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected product indicator (placeholder for future detail panel) */}
      {selectedProduct && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg bg-card border border-border shadow-lg">
          <div className="flex items-center gap-3">
            <ProductImageBox src={selectedProduct.imageUrl} alt={selectedProduct.title} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {selectedProduct.title}
              </p>
              <p className="text-xs text-muted-foreground">
                Selected for editing (coming next)
              </p>
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      {!isLoading && !error && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filteredProducts.length} of {products.filter(p => p.productType === activeBarterType).length} products
        </p>
      )}
    </div>
  );
}
