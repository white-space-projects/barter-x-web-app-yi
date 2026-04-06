"use client";

/**
 * ============================================================================
 * PRODUCTS TAB - Browse products and their offers
 * ============================================================================
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { useBarterStore } from "@/lib/store";
import { getCitiesForCountry } from "@/lib/countries-data";
import { 
  Search, SlidersHorizontal, Package, MoreHorizontal, X, Eye, Plus, 
  ChevronDown, MapPin, Check,
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
import { AddOfferFlow } from "./add-offer-flow";
import { ArrowLeft } from "lucide-react";
import type { Product, ProductType } from "@/lib/types";
import { useProducts } from "@/hooks/use-products";
import { ProductShimmer } from "./product-shimmer";
import { getProductTypeCategories, getSubcategories as getTypeSubcategories, getCategoryByName, isOfferCreationEnabled, getAvailabilityNote, getProductType, type CategoryDefinition, type SubcategoryDefinition } from "@/lib/product-types";

type Props = {
  productType?: ProductType;
  onAddOfferWithProduct?: (product: Product) => void;
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

export function ProductsTab({ productType = "goods", onAddOfferWithProduct }: Props) {
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
  // Also reset selection when product type changes
  useEffect(() => {
    setActiveProductTypeForFilters(productType);
    // Reset any open product detail view when switching product types
    setSelectedProduct(null);
    setInlineAddProduct(null);
    setPanelViewMode("list");
  }, [productType, setActiveProductTypeForFilters]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inlineAddProduct, setInlineAddProduct] = useState<Product | null>(null);
  // Track ViewOffersPanel view mode to conditionally hide product header
  const [panelViewMode, setPanelViewMode] = useState<"list" | "details" | "edit" | "add">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [mobileActionProduct, setMobileActionProduct] = useState<Product | null>(null);
  const [expandedSection, setExpandedSection] = useState<"category" | "subcategory" | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Get user's location from profile for the "My Location" filter
  // For new users: use auto-detected location from login (auth.user.city/country)
  // For existing users with profile: use profileAddress (manually saved)
  const userCity = auth.user?.profileAddress?.city || auth.user?.city;
  const userCountry = auth.user?.profileAddress?.country || auth.user?.country;

  // Get cities for user's country
  const availableCities = useMemo(() => {
    if (!userCountry) return [];
    return getCitiesForCountry(userCountry);
  }, [userCountry]);

  // Close city dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
        setCitySearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const { data: products = [], isLoading, error } = useProducts({ barterType: productType });
  
  // Debug output
  useEffect(() => {
    console.log("[v0] ProductsTab: productType =", productType);
    console.log("[v0] ProductsTab: products count =", products.length);
    console.log("[v0] ProductsTab: isLoading =", isLoading);
    console.log("[v0] ProductsTab: error =", error);
    if (products.length > 0) {
      console.log("[v0] ProductsTab: first product =", products[0]);
    }
  }, [productType, products, isLoading, error]);
  
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

  // Get products that have offers from selected cities in user's country
  const productsWithLocalOffers = useMemo(() => {
    if (!userCountry) return new Set<string>();
    const selectedCities = productFilters.selectedCities;
    const localProductIds = new Set<string>();
    
    offers.forEach((offer) => {
      const offerCountry = offer.pickupAddress?.country?.toLowerCase();
      const offerCity = offer.pickupAddress?.city;
      
      // Must match user's country
      if (offerCountry !== userCountry.toLowerCase()) return;
      
      // If specific cities are selected, must match one of them
      if (selectedCities.length > 0) {
        if (!offerCity || !selectedCities.some(c => c.toLowerCase() === offerCity.toLowerCase())) {
          return;
        }
      }
      
      localProductIds.add(offer.productId);
    });
    return localProductIds;
  }, [offers, userCountry, productFilters.selectedCities]);

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
      selectedCities: [],
    });
    setExpandedSection(null);
    setShowCityDropdown(false);
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

  // If a product is selected, show ViewOffersPanel instead of product list
  if (selectedProduct) {
    return (
      <div className="w-full">
        {/* Header with back button - only show when in list mode */}
        {panelViewMode === "list" && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSelectedProduct(null)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground truncate">
                  Offers for {selectedProduct.title}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedProduct.subcategory} / {selectedProduct.brand}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                if (onAddOfferWithProduct) {
                  onAddOfferWithProduct(selectedProduct);
                } else {
                  setInlineAddProduct(selectedProduct);
                }
              }} 
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Offer
            </button>
          </div>
        )}
        
        {/* ViewOffersPanel content */}
        <ViewOffersPanel 
          product={selectedProduct} 
          onAddOffer={() => {
            if (onAddOfferWithProduct) {
              onAddOfferWithProduct(selectedProduct);
            } else {
              setInlineAddProduct(selectedProduct);
            }
          }}
          onViewModeChange={setPanelViewMode}
        />
        
        {/* Fallback AddOfferFlow if workspace doesn't provide callback */}
        {!onAddOfferWithProduct && (
          <AddOfferFlow
            open={!!inlineAddProduct}
            onClose={() => setInlineAddProduct(null)}
            initialProduct={inlineAddProduct || undefined}
          />
        )}
      </div>
    );
  }

  // Check if this barter type is coming soon
  const productTypeInfo = getProductType(productType);
  const isComingSoon = productTypeInfo?.isOfferCreationEnabled === false;
  const availabilityNote = productTypeInfo?.availabilityNote || "Coming Soon";

  // Coming Soon view for disabled barter types
  if (isComingSoon) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {productTypeInfo?.name || productType}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          {productTypeInfo?.description || "This feature is coming soon."}
        </p>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {availabilityNote}
        </span>
      </div>
    );
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
          <div className="mb-4 rounded-xl border border-border bg-card">
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
          <div className="p-4 border-b border-border overflow-visible">
            <div className="flex flex-wrap gap-2 overflow-visible">
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newValue = !productFilters.onlyMyLocation;
                      if (newValue && userCity) {
                        // When enabling, default select user's city
                        setProductFilters({
                          onlyMyLocation: true,
                          selectedCities: [userCity],
                        });
                      } else {
                        // When disabling, clear cities
                        setProductFilters({
                          onlyMyLocation: false,
                          selectedCities: [],
                        });
                        setShowCityDropdown(false);
                      }
                    }}
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-full border px-4 text-sm transition-colors ${
                      productFilters.onlyMyLocation
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {userCountry}
                  </button>

                  {/* City Dropdown - only show when country filter is active */}
                  {productFilters.onlyMyLocation && availableCities.length > 0 && (
                    <div className="relative" ref={cityDropdownRef}>
                      <button
                        onClick={() => setShowCityDropdown(!showCityDropdown)}
                        className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-primary bg-primary/10 text-primary px-3 text-sm transition-colors"
                      >
                        <span>
                          {productFilters.selectedCities.length === 0
                            ? "All cities"
                            : productFilters.selectedCities.length === 1
                            ? productFilters.selectedCities[0]
                            : `${productFilters.selectedCities.length} cities`}
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCityDropdown ? "rotate-180" : ""}`} />
                      </button>

                      {showCityDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-border bg-card shadow-xl z-50">
                          {/* Search bar */}
                          <div className="p-2 border-b border-border">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Search cities..."
                                value={citySearchQuery}
                                onChange={(e) => setCitySearchQuery(e.target.value)}
                                className="w-full h-8 pl-8 pr-3 rounded-lg border border-input bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                autoFocus
                              />
                            </div>
                          </div>
                          {/* City list - min height for 6 cities */}
                          <div className="p-2 max-h-[280px] min-h-[240px] overflow-y-auto">
                            {availableCities
                              .filter(city => city.toLowerCase().includes(citySearchQuery.toLowerCase()))
                              .map((city) => {
                                const isSelected = productFilters.selectedCities.includes(city);
                                const isUserCity = city === userCity;
                                return (
                                  <button
                                    key={city}
                                    onClick={() => {
                                      if (isSelected) {
                                        setProductFilters({
                                          selectedCities: productFilters.selectedCities.filter(c => c !== city),
                                        });
                                      } else {
                                        setProductFilters({
                                          selectedCities: [...productFilters.selectedCities, city],
                                        });
                                      }
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-left hover:bg-secondary/50 transition-colors"
                                  >
                                    <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                                      isSelected 
                                        ? "border-primary bg-primary" 
                                        : "border-input bg-secondary"
                                    }`}>
                                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                    </div>
                                    <span className={isSelected ? "text-foreground" : "text-muted-foreground"}>
                                      {city}
                                      {isUserCity && <span className="text-primary ml-1">(Your city)</span>}
                                    </span>
                                  </button>
                                );
                              })}
                            {availableCities.filter(city => city.toLowerCase().includes(citySearchQuery.toLowerCase())).length === 0 && (
                              <div className="text-sm text-muted-foreground text-center py-4">
                                No cities found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
      {isLoading ? (
        <ProductShimmer count={8} />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">Failed to load products. Please try again.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
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

      <AddOfferFlow
        open={!!inlineAddProduct}
        onClose={() => setInlineAddProduct(null)}
        initialProduct={inlineAddProduct || undefined}
      />
    </div>
  );
}
