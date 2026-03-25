"use client";

import React from "react";
import { useState, useMemo } from "react";
import { X, Loader2, Search, Plus, ChevronLeft, Package, ChevronDown, Repeat, Car, Home, Smartphone, Shirt, Sofa, Dumbbell, BookOpen, Gamepad2, Wrench, Baby, Dog, Bike, Truck, Container, Building2, BedDouble, ParkingSquare, Warehouse, Caravan, Cpu, Laptop, Tablet, Headphones, Camera, Watch, Table, Armchair, Archive, Lamp, Refrigerator, WashingMachine, Microwave, AirVent, CookingPot, Footprints, ShoppingBag, Gem, BedSingle, ToyBrick, CarFront, Tent, Trophy, Drill, Shovel, Hammer, Book, Dice5, Film, Star, Table2, Monitor, Printer, Guitar, Paintbrush, Box, CarTaxiFront, Crown, Zap, Gauge, Wind, Fuel, Bus, Users, Castle, Building, ParkingCircle, Lock, Square, LayoutGrid } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { generateGuid } from "@/lib/guid";
import { toast } from "sonner";
import {
  getOfferTitlePlaceholder,
  getOfferDescPlaceholder,
} from "@/lib/mock-data";
import { getCountryNames, getCitiesForCountry } from "@/lib/countries-data";
import { PRODUCT_TYPES, getProductTypeCategories, getSubcategories as getTypeSubcategories, type SubcategoryDefinition } from "@/lib/product-types";
import type { Product, OfferPickupAddress, OfferImage, OfferInfoFieldValue, ProductType } from "@/lib/types";
import { OfferImageSection } from "./offer-image-section";
import { OfferInfoSection } from "./offer-info-section";

type Props = {
  open: boolean;
  onClose: () => void;
  initialProductType?: ProductType;
};

type Step = "select-type" | "select-category" | "select-product" | "offer-details";

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

// Icon mapping for all subcategory icons (mapped by lucide icon name)
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Camera,
  Gamepad2,
  Watch,
  Sofa,
  BedDouble,
  Table,
  Armchair,
  Archive,
  Lamp,
  Refrigerator,
  WashingMachine,
  Microwave,
  AirVent,
  CookingPot,
  Shirt,
  Footprints,
  ShoppingBag,
  Gem,
  Baby,
  BedSingle,
  ToyBrick,
  CarFront,
  Bike,
  Dumbbell,
  Tent,
  Trophy,
  Drill,
  Shovel,
  Hammer,
  Book,
  Dice5,
  Film,
  Star,
  Table2,
  Monitor,
  Printer,
  Guitar,
  Paintbrush,
  Package,
  Box,
  Car,
  CarTaxiFront,
  Crown,
  Zap,
  Gauge,
  Wind,
  Fuel,
  Bus,
  Truck,
  Container,
  Caravan,
  Building2,
  Home,
  Castle,
  Building,
  Users,
  ParkingSquare,
  ParkingCircle,
  Warehouse,
  Lock,
  Square,
  LayoutGrid,
  Cpu,
};

// Product type icons
const TYPE_ICONS: Record<ProductType, React.ComponentType<{ className?: string }>> = {
  "cross-product": Repeat,
  automobile: Car,
  "home-spaces": Home,
};

// Product type colors
const TYPE_COLORS: Record<ProductType, { bg: string; text: string; border: string }> = {
  "cross-product": { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
  automobile: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30" },
  "home-spaces": { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/30" },
};

export function AddOfferModal({ open, onClose, initialProductType }: Props) {
  const {
    auth,
    products,
    addProduct,
    addOffer,
    getBrands,
  } = useBarterStore();

  // New multi-step flow
  const [step, setStep] = useState<Step>(initialProductType ? "select-category" : "select-type");
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(initialProductType || null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product filters (local to this modal)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBrand, setFilterBrand] = useState("");

  // New product fields
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");

  // Offer fields
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  
  // Offer images
  const [offerImages, setOfferImages] = useState<OfferImage[]>([]);
  
  // Offer info fields (varies by subcategory)
  const [offerInfo, setOfferInfo] = useState<OfferInfoFieldValue[]>([]);
  
  // Pickup address fields
  const [pickupCountry, setPickupCountry] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupState, setPickupState] = useState("");
  const [pickupZip, setPickupZip] = useState("");
  const [pickupAddressLine1, setPickupAddressLine1] = useState("");
  const [pickupAddressLine2, setPickupAddressLine2] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const brands = getBrands();
  
  // Get available countries and cities
  const countryNames = getCountryNames();
  const availableCities = pickupCountry ? getCitiesForCountry(pickupCountry) : [];

  // Get categories for selected product type
  const categories = useMemo(() => {
    if (!selectedProductType) return [];
    return getProductTypeCategories(selectedProductType);
  }, [selectedProductType]);

  // Get subcategories for selected category
  const subcategories = useMemo(() => {
    if (!selectedProductType || !selectedCategory) return [];
    return getTypeSubcategories(selectedProductType, selectedCategory);
  }, [selectedProductType, selectedCategory]);

  // Get selected category name for filtering
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory) return "";
    const cat = categories.find(c => c.id === selectedCategory);
    return cat?.name || selectedCategory;
  }, [selectedCategory, categories]);

  // Filter products by type, category, subcategory
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedProductType && p.productType !== selectedProductType) return false;
      // Match by category name (products store category name, not id)
      if (selectedCategoryName && p.category !== selectedCategoryName) return false;
      if (selectedSubcategory && p.subcategory !== selectedSubcategory) return false;
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterBrand && p.brand !== filterBrand) return false;
      return true;
    });
  }, [products, selectedProductType, selectedCategoryName, selectedSubcategory, searchQuery, filterBrand]);

  function resetAll() {
    setStep(initialProductType ? "select-category" : "select-type");
    setSelectedProductType(initialProductType || null);
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedProduct(null);
    setSearchQuery("");
    setFilterBrand("");
    setShowNewProduct(false);
    setNewBrand("");
    setNewModel("");
    setOfferTitle("");
    setOfferDescription("");
    setOfferImages([]);
    setOfferInfo([]);
    setPickupCountry("");
    setPickupCity("");
    setPickupState("");
    setPickupZip("");
    setPickupAddressLine1("");
    setPickupAddressLine2("");
    setErrors({});
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  function handleSelectType(type: ProductType) {
    setSelectedProductType(type);
    setStep("select-category");
  }

  function handleSelectCategory(categoryId: string) {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(""); // Reset subcategory when category changes
    // Don't move to next step - let user select subcategory and click Continue
  }

  function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setStep("offer-details");
  }

  function handleBack() {
    if (step === "offer-details") {
      setStep("select-product");
      setSelectedProduct(null);
    } else if (step === "select-product") {
      setStep("select-category");
      setSelectedCategory("");
      setSelectedSubcategory("");
    } else if (step === "select-category") {
      if (initialProductType) {
        handleClose();
      } else {
        setStep("select-type");
        setSelectedProductType(null);
      }
    }
    setErrors({});
  }

  function handleCreateNewProduct() {
    const errs: Record<string, string> = {};
    if (!selectedProductType) errs.type = "Product type is required.";
    if (!selectedCategory) errs.category = "Category is required.";
    
    // Brand/Model only required for cross-product and automobile
    if (selectedProductType !== "home-spaces") {
      if (!newBrand.trim()) errs.newBrand = "Brand is required.";
      if (!newModel.trim()) errs.newModel = "Model is required.";
    }
    
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const categoryData = categories.find(c => c.id === selectedCategory);
    const categoryName = categoryData?.name || selectedCategory;
    
    const newProduct: Product = {
      productId: generateGuid(),
      productType: selectedProductType!,
      title: selectedProductType === "home-spaces" 
        ? `${categoryName}${selectedSubcategory ? ` - ${selectedSubcategory}` : ""}`
        : `${newBrand.trim()} ${newModel.trim()}`,
      category: categoryName,
      subcategory: selectedSubcategory || undefined,
      brand: selectedProductType !== "home-spaces" ? newBrand.trim() : undefined,
      model: selectedProductType !== "home-spaces" ? newModel.trim() : undefined,
      imageUrl: "",
      offerCount: 0,
    };

    addProduct(newProduct);
    setSelectedProduct(newProduct);
    setStep("offer-details");
  }

  async function handleSaveOffer(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!offerTitle.trim()) errs.offerTitle = "Offer title is required.";
    if (!offerDescription.trim()) errs.offerDescription = "Offer description is required.";
    if (!pickupCountry) errs.pickupCountry = "Country is required.";
    if (!pickupCity) errs.pickupCity = "City is required.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!selectedProduct) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const pickupAddress: OfferPickupAddress = {
      country: pickupCountry,
      city: pickupCity,
      state: pickupState.trim() || undefined,
      zip: pickupZip.trim() || undefined,
      addressLine1: pickupAddressLine1.trim() || undefined,
      addressLine2: pickupAddressLine2.trim() || undefined,
    };

    addOffer({
      offerId: generateGuid(),
      productId: selectedProduct.productId,
      ownerUserId: auth.user!.userId,
      title: offerTitle.trim(),
      description: offerDescription.trim(),
      hookedCount: 0,
      outgoingHookCount: 0,
      readyForCommit: false,
      pickupAddress,
      images: offerImages,
      offerInfo: offerInfo.length > 0 ? offerInfo : undefined,
    });

    setLoading(false);
    toast.success("Your offer has been added.");
    handleClose();
  }

  if (!open) return null;

  const subcategoryForPlaceholder = selectedProduct?.subcategory || selectedSubcategory || "default";

  // Get step title
  const getStepTitle = () => {
    switch (step) {
      case "select-type": return "Select Exchange Type";
      case "select-category": return "Select Category";
      case "select-product": return "Select Product";
      case "offer-details": return "Offer Details";
    }
  };

  // Get step number
  const getStepNumber = () => {
    switch (step) {
      case "select-type": return 1;
      case "select-category": return 2;
      case "select-product": return 3;
      case "offer-details": return 4;
    }
  };

  return (
    <>
      {/* Backdrop - respects sidebar on desktop */}
      <div
        className="fixed inset-0 lg:left-56 z-40 bg-background/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Modal - wider on desktop with Apple-style clean layout, centered in content area */}
      <div className="fixed z-50 inset-4 lg:inset-auto lg:left-[calc(50%+7rem)] lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-2xl xl:max-w-3xl rounded-2xl border border-border bg-card shadow-2xl lg:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header - Apple-style clean header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            {step !== "select-type" && (
              <button
                onClick={handleBack}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Step {getStepNumber()} of 4</p>
              <h3 className="text-lg font-semibold text-foreground">{getStepTitle()}</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content - generous padding on larger screens */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          {/* Step 1: Select Product Type */}
          {step === "select-type" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Choose the type of exchange for your offer. Items can only be exchanged within the same type.
              </p>
              {PRODUCT_TYPES.map((type) => {
                const IconComponent = TYPE_ICONS[type.id];
                const colors = TYPE_COLORS[type.id];
                return (
                  <button
                    key={type.id}
                    onClick={() => handleSelectType(type.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:scale-[1.01] ${colors.border} ${colors.bg}`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.bg}`}>
                      <IconComponent className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <div className="text-left flex-1">
                      <p className={`text-sm font-semibold ${colors.text}`}>{type.name}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                    <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Select Category - Horizontal scroll with icons */}
          {step === "select-category" && selectedProductType && (
            <div>
              {/* Selected type indicator - clickable to change */}
              <button
                onClick={() => {
                  setStep("select-type");
                  setSelectedCategory("");
                  setSelectedSubcategory("");
                }}
                className={`mb-4 p-3 rounded-lg ${TYPE_COLORS[selectedProductType].bg} flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity`}
              >
                {React.createElement(TYPE_ICONS[selectedProductType], { 
                  className: `h-5 w-5 ${TYPE_COLORS[selectedProductType].text}` 
                })}
                <span className={`text-sm font-medium ${TYPE_COLORS[selectedProductType].text} flex-1`}>
                  {PRODUCT_TYPES.find(t => t.id === selectedProductType)?.name}
                </span>
                <span className="text-xs text-muted-foreground">Change</span>
              </button>

              <p className="text-sm text-muted-foreground mb-4">
                Select a category for your offer.
              </p>

              {/* Category grid - responsive: scroll on mobile, grid on desktop */}
              <div className="overflow-x-auto -mx-5 px-5 pb-2 lg:overflow-visible lg:mx-0 lg:px-0">
                <div className="flex gap-3 min-w-max lg:min-w-0 lg:grid lg:grid-cols-4 xl:grid-cols-5">
                  {categories.map((category) => {
                    const IconComponent = CATEGORY_ICONS[category.id] || Package;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleSelectCategory(category.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all min-w-[100px] lg:min-w-0 ${
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50"
                        }`}
                      >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                          isSelected ? "bg-primary/20" : "bg-secondary"
                        }`}>
                          <IconComponent className={`h-6 w-6 ${isSelected ? "text-primary" : "text-foreground"}`} />
                        </div>
                        <span className={`text-xs font-medium text-center ${isSelected ? "text-primary" : "text-foreground"}`}>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subcategory selection with icons - responsive grid */}
              {selectedCategory && subcategories.length > 0 && (
                <div className="mt-5">
                  <label className="mb-3 block text-sm font-medium text-foreground">
                    Select Subcategory <span className="text-destructive">*</span>
                  </label>
                  <div className="overflow-x-auto -mx-5 px-5 pb-2 lg:overflow-visible lg:mx-0 lg:px-0">
                    <div className="flex gap-2 min-w-max lg:min-w-0 lg:grid lg:grid-cols-5 xl:grid-cols-6">
                      {subcategories.map((sub: SubcategoryDefinition) => {
                        const SubIcon = ICON_MAP[sub.icon] || Package;
                        const isSelected = selectedSubcategory === sub.name;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubcategory(sub.name)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all min-w-[80px] lg:min-w-0 ${
                              isSelected 
                                ? "border-primary bg-primary/10" 
                                : "border-border bg-secondary/30 hover:border-primary/30"
                            }`}
                          >
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              isSelected ? "bg-primary/20" : "bg-secondary"
                            }`}>
                              <SubIcon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-foreground"}`} />
                            </div>
                            <span className={`text-[10px] font-medium text-center leading-tight max-w-[70px] lg:max-w-full ${isSelected ? "text-primary" : "text-foreground"}`}>
                              {sub.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Continue button - requires both category and subcategory */}
              {selectedCategory && (
                <div className="mt-6">
                  <button
                    onClick={() => setStep("select-product")}
                    disabled={subcategories.length > 0 && !selectedSubcategory}
                    className={`w-full rounded-lg py-3 text-sm font-medium transition-colors ${
                      subcategories.length > 0 && !selectedSubcategory
                        ? "bg-primary/40 text-primary-foreground/60 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    Continue
                  </button>
                  {subcategories.length > 0 && !selectedSubcategory && (
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                      Please select a subcategory to continue
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Product */}
          {step === "select-product" && (
            <div>
              {/* Context breadcrumb */}
              <div className={`mb-4 p-3 rounded-lg ${selectedProductType ? TYPE_COLORS[selectedProductType].bg : "bg-secondary"} flex items-center gap-2 text-sm`}>
                {selectedProductType && React.createElement(TYPE_ICONS[selectedProductType], { 
                  className: `h-4 w-4 ${TYPE_COLORS[selectedProductType].text}` 
                })}
                <span className={selectedProductType ? TYPE_COLORS[selectedProductType].text : "text-foreground"}>
                  {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                </span>
                {selectedSubcategory && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{selectedSubcategory}</span>
                  </>
                )}
              </div>

              {/* Search and filter - side by side on desktop */}
              <div className="flex flex-col lg:flex-row gap-2 mb-4">
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
                {selectedProductType !== "home-spaces" && (
                  <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="h-10 lg:w-48 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All brands</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Product list - grid on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-60 lg:max-h-72 overflow-y-auto mb-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.productId}
                    onClick={() => handleSelectProduct(product)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3 text-left transition-colors hover:border-primary/30"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.subcategory && `${product.subcategory}`}
                        {product.brand && ` / ${product.brand}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{product.offerCount} offers</span>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No products found. Create a new one below.
                  </p>
                )}
              </div>

              {/* Create new product */}
              {!showNewProduct ? (
                <button
                  onClick={() => setShowNewProduct(true)}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground w-full"
                >
                  <Plus className="h-4 w-4" />
                  Create new product
                </button>
              ) : (
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    New product
                  </h4>
                  
                  {/* Show category info */}
                  <div className="mb-3 p-2 rounded bg-secondary text-xs text-muted-foreground">
                    Category: {categories.find(c => c.id === selectedCategory)?.name}
                    {selectedSubcategory && ` / ${selectedSubcategory}`}
                  </div>
                  
                  {/* Only show brand/model for non-home-spaces */}
                  {selectedProductType !== "home-spaces" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Brand *</label>
                        <input
                          type="text"
                          value={newBrand}
                          onChange={(e) => setNewBrand(e.target.value)}
                          list="brand-suggestions"
                          placeholder="e.g. Toyota"
                          className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <datalist id="brand-suggestions">
                          {brands.map((b) => <option key={b} value={b} />)}
                        </datalist>
                        {errors.newBrand && <p className="mt-0.5 text-xs text-destructive">{errors.newBrand}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Model *</label>
                        <input
                          type="text"
                          value={newModel}
                          onChange={(e) => setNewModel(e.target.value)}
                          placeholder="e.g. Corolla"
                          className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {errors.newModel && <p className="mt-0.5 text-xs text-destructive">{errors.newModel}</p>}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setShowNewProduct(false)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateNewProduct}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Create & continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Offer details */}
          {step === "offer-details" && (
            <form onSubmit={handleSaveOffer}>
              {selectedProduct && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary overflow-hidden">
                    {selectedProduct.imageUrl ? (
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedProduct.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedProduct.subcategory}
                      {selectedProduct.brand && ` / ${selectedProduct.brand}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Title and Description - side by side on large desktop */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Offer title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={offerTitle}
                    onChange={(e) => {
                      setOfferTitle(e.target.value);
                      if (errors.offerTitle) setErrors((p) => ({ ...p, offerTitle: "" }));
                    }}
                    placeholder={getOfferTitlePlaceholder(subcategoryForPlaceholder)}
                    className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.offerTitle && <p className="mt-1 text-xs text-destructive">{errors.offerTitle}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Offer description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={offerDescription}
                    onChange={(e) => {
                      setOfferDescription(e.target.value);
                      if (errors.offerDescription) setErrors((p) => ({ ...p, offerDescription: "" }));
                    }}
                    placeholder={getOfferDescPlaceholder(subcategoryForPlaceholder)}
                    className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  {errors.offerDescription && <p className="mt-1 text-xs text-destructive">{errors.offerDescription}</p>}
                </div>
              </div>

              {/* Offer Images Section */}
              <OfferImageSection
                images={offerImages}
                onImagesChange={setOfferImages}
                draftData={{
                  title: offerTitle,
                  description: offerDescription,
                  productId: selectedProduct?.productId,
                  productTitle: selectedProduct?.title,
                }}
              />

              {/* Offer Info Section */}
              <OfferInfoSection
                subcategory={subcategoryForPlaceholder}
                offerInfo={offerInfo}
                onOfferInfoChange={setOfferInfo}
              />

              {/* Pickup Location Section */}
              <div className="mb-4 rounded-lg border border-border bg-secondary/30 p-4 lg:p-5">
                <h4 className="mb-3 text-sm font-medium text-foreground">
                  Pickup Location <span className="text-destructive">*</span>
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Country *</label>
                    <div className="relative">
                      <select
                        value={pickupCountry}
                        onChange={(e) => {
                          setPickupCountry(e.target.value);
                          setPickupCity("");
                          if (errors.pickupCountry) setErrors((p) => ({ ...p, pickupCountry: "" }));
                        }}
                        className="h-9 w-full appearance-none rounded-lg border border-input bg-secondary pl-2.5 pr-8 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select country</option>
                        {countryNames.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    {errors.pickupCountry && <p className="mt-0.5 text-xs text-destructive">{errors.pickupCountry}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">City *</label>
                    <div className="relative">
                      <select
                        value={pickupCity}
                        onChange={(e) => {
                          setPickupCity(e.target.value);
                          if (errors.pickupCity) setErrors((p) => ({ ...p, pickupCity: "" }));
                        }}
                        disabled={!pickupCountry}
                        className="h-9 w-full appearance-none rounded-lg border border-input bg-secondary pl-2.5 pr-8 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      >
                        <option value="">Select city</option>
                        {availableCities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    {errors.pickupCity && <p className="mt-0.5 text-xs text-destructive">{errors.pickupCity}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">State/Province</label>
                    <input
                      type="text"
                      value={pickupState}
                      onChange={(e) => setPickupState(e.target.value)}
                      placeholder="Optional"
                      className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Zip/Postal Code</label>
                    <input
                      type="text"
                      value={pickupZip}
                      onChange={(e) => setPickupZip(e.target.value)}
                      placeholder="Optional"
                      className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Address Line 1</label>
                    <input
                      type="text"
                      value={pickupAddressLine1}
                      onChange={(e) => setPickupAddressLine1(e.target.value)}
                      placeholder="Street address"
                      className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Address Line 2</label>
                    <input
                      type="text"
                      value={pickupAddressLine2}
                      onChange={(e) => setPickupAddressLine2(e.target.value)}
                      placeholder="Apartment, suite, etc."
                      className="h-9 w-full rounded-lg border border-input bg-secondary px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Offer"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
