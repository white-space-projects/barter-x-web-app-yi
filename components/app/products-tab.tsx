"use client";

/**
 * ============================================================================
 * PRODUCTS TAB - Browse products and their offers
 * ============================================================================
 */

import { useMemo, useState, useEffect } from "react";
import { useBarterStore } from "@/lib/store";
import { 
  Search, SlidersHorizontal, Package, MoreHorizontal, X, Eye, Plus, 
  ChevronDown, MapPin,
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
  ParkingCircle, Lock, Square, LayoutGrid
} from "lucide-react";
import { ViewOffersPanel } from "./view-offers-panel";
import { InlineAddOffer } from "./inline-add-offer";
import type { Product, ProductType } from "@/lib/types";
import { useProducts } from "@/hooks/use-products";
import { getProductTypeCategories, getSubcategories as getTypeSubcategories, getCategoryByName, type CategoryDefinition, type SubcategoryDefinition } from "@/lib/product-types";

type Props = {
  productType?: ProductType;
};

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

export function ProductsTab({ productType = "cross-product" }: Props) {
  const {
    auth,
    productFilters,
    setProductFilters,
    setActiveProductTypeForFilters,
    getMyOffers,
    getOfferById,
    hooks,
    offers,
  } = useBarterStore();

  // Sync the active product type with the store when it changes
  // This ensures filters are stored/retrieved per exchange type
  useEffect(() => {
    setActiveProductTypeForFilters(productType);
  }, [productType, setActiveProductTypeForFilters]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inlineAddProduct, setInlineAddProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileActionProduct, setMobileActionProduct] = useState<Product | null>(null);
  const [expandedSection, setExpandedSection] = useState<"category" | "subcategory" | null>(null);
  
  const { data: products = [], isLoading } = useProducts();
  
  // Get categories for the current product type
  const categories = useMemo(() => getProductTypeCategories(productType), [productType]);
  
  // Get subcategories for all selected categories
  const subcategories = useMemo(() => {
    if (productFilters.categories.length === 0) return [];
    const allSubcategories: SubcategoryDefinition[] = [];
    productFilters.categories.forEach(catName => {
      const categoryDef = getCategoryByName(productType, catName);
      if (categoryDef) {
        allSubcategories.push(...categoryDef.subcategories);
      }
    });
    return allSubcategories;
  }, [productType, productFilters.categories]);

  const hasActiveFilters = productFilters.onlyWithOffers || 
    productFilters.categories.length > 0 || 
    productFilters.subcategories.length > 0 || 
    productFilters.brand ||
    productFilters.directExchangeOpportunities ||
    productFilters.onlyMyLocation;

  const activeFilterCount = [
    productFilters.onlyWithOffers, 
    productFilters.categories.length > 0, 
    productFilters.subcategories.length > 0, 
    productFilters.brand, 
    productFilters.directExchangeOpportunities,
    productFilters.onlyMyLocation
  ].filter(Boolean).length;

  const myOffers = useMemo(() => getMyOffers(), [getMyOffers]);

  // Get user's location from profile for the "My Location" filter
  // Note: profileAddress is the manually saved address from profile page
  // auth.user.city/country is the auto-detected location from login - we DON'T use those here
  const userCity = auth.user?.profileAddress?.city;
  const userCountry = auth.user?.profileAddress?.country;

  // Get products that have offers from user's location
  const productsWithLocalOffers = useMemo(() => {
    if (!userCity || !userCountry) return new Set<string>();
    const localProductIds = new Set<string>();
    offers.forEach((offer) => {
      if (
        offer.pickupAddress?.city?.toLowerCase() === userCity.toLowerCase() &&
        offer.pickupAddress?.country?.toLowerCase() === userCountry.toLowerCase()
      ) {
        localProductIds.add(offer.productId);
      }
    });
    return localProductIds;
  }, [offers, userCity, userCountry]);

  const directExchangeProductIds = useMemo(() => {
    if (!productFilters.directExchangeOpportunities || myOffers.length === 0) {
      return new Set<string>();
    }
    const myHookedProductIds = new Set<string>();
    myOffers.forEach((myOffer) => {
      const myHooks = hooks.filter((h) => h.fromOfferId === myOffer.offerId);
      myHooks.forEach((hook) => {
        const targetOffer = getOfferById(hook.toOfferId);
        if (targetOffer) {
          myHookedProductIds.add(targetOffer.productId);
        }
      });
    });
    if (myHookedProductIds.size === 0) {
      return new Set<string>();
    }
    const opportunityProductIds = new Set<string>();
    offers.forEach((offer) => {
      if (myOffers.some((mo) => mo.offerId === offer.offerId)) {
        return;
      }
      const offerHooks = hooks.filter((h) => h.fromOfferId === offer.offerId);
      const isHookedToSameProducts = offerHooks.some((hook) => {
        const targetOffer = getOfferById(hook.toOfferId);
        return targetOffer && myHookedProductIds.has(targetOffer.productId);
      });
      if (isHookedToSameProducts) {
        opportunityProductIds.add(offer.productId);
      }
    });
    return opportunityProductIds;
  }, [productFilters.directExchangeOpportunities, myOffers, hooks, offers, getOfferById]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.productType !== productType) return false;
      if (
        productFilters.searchQuery &&
        !p.title.toLowerCase().includes(productFilters.searchQuery.toLowerCase())
      )
        return false;
      if (productFilters.onlyWithOffers && p.offerCount === 0) return false;
      if (productFilters.categories.length > 0 && !productFilters.categories.includes(p.category))
        return false;
      if (productFilters.subcategories.length > 0 && !productFilters.subcategories.includes(p.subcategory))
        return false;
      if (productFilters.brand && p.brand !== productFilters.brand) return false;
      if (productFilters.directExchangeOpportunities && !directExchangeProductIds.has(p.productId))
        return false;
      if (productFilters.onlyMyLocation && !productsWithLocalOffers.has(p.productId))
        return false;
      return true;
    });
  }, [products, productFilters, directExchangeProductIds, productsWithLocalOffers, productType]);

  function clearAllFilters() {
    setProductFilters({
      searchQuery: productFilters.searchQuery,
      onlyWithOffers: false,
      categories: [],
      subcategories: [],
      brand: "",
      directExchangeOpportunities: false,
      onlyMyLocation: false,
    });
    setExpandedSection(null);
  }

  function handleSelectCategory(categoryName: string) {
    const isSelected = productFilters.categories.includes(categoryName);
    let newCategories: string[];
    let newSubcategories = productFilters.subcategories;
    
    if (isSelected) {
      // Remove category and its subcategories
      newCategories = productFilters.categories.filter(c => c !== categoryName);
      const categoryDef = getCategoryByName(productType, categoryName);
      if (categoryDef) {
        const subNames = categoryDef.subcategories.map(s => s.name);
        newSubcategories = productFilters.subcategories.filter(s => !subNames.includes(s));
      }
    } else {
      // Add category
      newCategories = [...productFilters.categories, categoryName];
      // Auto-expand subcategories
      setExpandedSection("subcategory");
    }
    
    setProductFilters({ categories: newCategories, subcategories: newSubcategories });
  }

  function handleSelectSubcategory(subcategoryName: string) {
    const isSelected = productFilters.subcategories.includes(subcategoryName);
    if (isSelected) {
      setProductFilters({ subcategories: productFilters.subcategories.filter(s => s !== subcategoryName) });
    } else {
      setProductFilters({ subcategories: [...productFilters.subcategories, subcategoryName] });
    }
  }

  return (
    <div className="relative">
      {/* Search + Filter Toggle Row */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={productFilters.searchQuery}
            onChange={(e) =>
              setProductFilters({ searchQuery: e.target.value })
            }
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
        <div className="mb-4 rounded-xl border border-border bg-card overflow-hidden">
          {/* Filter Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <h3 className="text-sm font-medium text-foreground">Filters</h3>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="p-4 border-b border-border">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setProductFilters({
                    onlyWithOffers: !productFilters.onlyWithOffers,
                  })
                }
                className={`flex h-9 items-center justify-center rounded-full border px-4 text-sm transition-colors ${
                  productFilters.onlyWithOffers
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                With offers only
              </button>

              {userCountry && (
                <button
                  onClick={() =>
                    setProductFilters({
                      onlyMyLocation: !productFilters.onlyMyLocation,
                    })
                  }
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-full border px-4 text-sm transition-colors ${
                    productFilters.onlyMyLocation
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {userCountry}
                </button>
              )}

              <button
                onClick={() =>
                  setProductFilters({
                    directExchangeOpportunities: !productFilters.directExchangeOpportunities,
                  })
                }
                disabled={myOffers.length === 0}
                className={`flex h-9 items-center justify-center rounded-full border px-4 text-sm transition-colors ${
                  productFilters.directExchangeOpportunities
                    ? "border-primary bg-primary/10 text-primary"
                    : myOffers.length === 0
                    ? "border-input bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
                    : "border-input bg-secondary text-muted-foreground hover:text-foreground"
                }`}
                title={myOffers.length === 0 ? "Add an offer first to use this filter" : "Show products where you can request direct exchange"}
              >
                Direct Exchange
              </button>
            </div>
          </div>

          {/* Category Accordion */}
          <div className="border-b border-border">
            <button
              onClick={() => setExpandedSection(expandedSection === "category" ? null : "category")}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">Category</span>
                {productFilters.categories.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {productFilters.categories.map(cat => (
                      <span key={cat} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${expandedSection === "category" ? "rotate-180" : ""}`} />
            </button>
            
            {expandedSection === "category" && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {categories.map((category) => {
                    const IconComponent = CATEGORY_ICONS[category.id] || Package;
                    const isSelected = productFilters.categories.includes(category.name);
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleSelectCategory(category.name)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50"
                        }`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isSelected ? "bg-primary/20" : "bg-secondary"
                        }`}>
                          <IconComponent className={`h-5 w-5 ${isSelected ? "text-primary" : "text-foreground"}`} />
                        </div>
                        <span className={`text-[10px] font-medium text-center leading-tight ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Subcategory Accordion - only show if categories are selected */}
          {productFilters.categories.length > 0 && subcategories.length > 0 && (
            <div>
              <button
                onClick={() => setExpandedSection(expandedSection === "subcategory" ? null : "subcategory")}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">Subcategory</span>
                  {productFilters.subcategories.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {productFilters.subcategories.map(sub => (
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
                      const isSelected = productFilters.subcategories.includes(sub.name);
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
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            isSelected ? "bg-primary/20" : "bg-secondary"
                          }`}>
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

      {/* Product grid - 3 columns on laptop, 4 on larger screens */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">No products match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <div
              key={product.productId}
              className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-colors hover:border-primary/20 w-full card-shadow-blue"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="p-4 min-h-[88px]">
                <div className="flex gap-3">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {product.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {product.subcategory} · {product.brand}
                    </p>
                    <p className="text-xs text-primary italic">
                      {product.offerCount} offer{product.offerCount !== 1 ? "s" : ""} available
                    </p>
                  </div>

                  {/* 3-dots menu - mobile only */}
                  <div className="flex flex-col items-end justify-center flex-shrink-0 sm:hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileActionProduct(product);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Actions"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Action Sheet Overlay */}
      {mobileActionProduct && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm sm:hidden" 
            onClick={() => setMobileActionProduct(null)} 
          />
          <div className="fixed bottom-[72px] left-0 right-0 z-50 rounded-t-2xl border-t border-border bg-card p-4 pb-6 sm:hidden animate-in slide-in-from-bottom duration-200">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{mobileActionProduct.title}</p>
                <p className="text-xs text-muted-foreground">{mobileActionProduct.subcategory} · {mobileActionProduct.brand}</p>
              </div>
              <button
                onClick={() => setMobileActionProduct(null)}
                className="p-2 text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setSelectedProduct(mobileActionProduct);
                  setMobileActionProduct(null);
                }}
                className="flex items-center gap-3 w-full rounded-xl bg-secondary p-4 text-left transition-colors active:bg-secondary/70"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">View Offers</p>
                  <p className="text-xs text-muted-foreground">{mobileActionProduct.offerCount} offer{mobileActionProduct.offerCount !== 1 ? "s" : ""} available</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setInlineAddProduct(mobileActionProduct);
                  setMobileActionProduct(null);
                }}
                className="flex items-center gap-3 w-full rounded-xl bg-secondary p-4 text-left transition-colors active:bg-secondary/70"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Add Offer</p>
                  <p className="text-xs text-muted-foreground">Add your offer to this product</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {selectedProduct && (
        <ViewOffersPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddOffer={() => setInlineAddProduct(selectedProduct)}
        />
      )}

      {inlineAddProduct && (
        <InlineAddOffer
          product={inlineAddProduct}
          onClose={() => setInlineAddProduct(null)}
        />
      )}
    </div>
  );
}
