"use client";

/**
 * ============================================================================
 * ADD OFFER FLOW - Full-screen wizard for creating new offers
 * ============================================================================
 * 
 * This is a 4-step wizard to create an offer:
 * Step 1: Choose/create product (barter type, category, subcategory, brand, model)
 * Step 2: Add images (up to 6 images)
 * Step 3: Offer details (title, description, optional info fields)
 * Step 4: Pickup address
 * 
 * SUPABASE MAPPING:
 * =================
 * - categories table: id, product_type, name, icon, created_at
 * - subcategories table: id, category_id, name, icon, product_info (jsonb for spec fields), created_at
 * - brands table: id, name, logo_url, created_at
 * - products table: id, product_type, category, subcategory, brand, model, image_url, product_info (jsonb), created_at
 * - offers table: id, product_id, owner_user_id, title, description, images (jsonb), offer_info (jsonb), pickup_address (jsonb), status, created_at
 * 
 * When user creates new category/subcategory/brand/model:
 * - Create entry in respective table with is_verified = false
 * - Create internal Jira ticket for team to review and normalize
 * - Product spec fields and product image are NOT populated for unverified products
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { 
  X, ArrowLeft, Search, Plus, ChevronDown, ChevronRight, Check, 
  Package, Car, Home, ShoppingBag, Loader2, Trash2,
  Camera, QrCode, MapPin, ChevronLeft,
  // Category icons
  Cpu, Sofa, Shirt, Baby, Dumbbell, Wrench, BookOpen, Monitor, Palette,
  Smartphone, Laptop, Tablet, Headphones, Gamepad2, Watch, BedDouble, Table2, Armchair,
  Archive, Lamp, WashingMachine, Microwave, AirVent, CookingPot, Footprints,
  Gem, ToyBrick, Bike, Tent, Trophy, Drill, Shovel, Hammer, Book, Dice5, Film, Star,
  Printer, Guitar, Paintbrush, Box, Building2, Building, ParkingSquare, Warehouse, Lock,
  Refrigerator, CarFront, CarTaxiFront, Crown, Zap, Gauge, Wind, Fuel, Bus, Truck, Container, Caravan,
  Square, LayoutGrid, BedSingle, Users, ParkingCircle,
} from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { generateGuid } from "@/lib/guid";
import { toast } from "sonner";
import { getOfferTitlePlaceholder, getOfferDescPlaceholder } from "@/lib/mock-data";
import { getCountryNames, getCitiesForCountry } from "@/lib/countries-data";
import { 
  PRODUCT_TYPES, 
  getProductTypeCategories, 
  getSubcategories as getTypeSubcategories,
  getCategoryByName,
  type CategoryDefinition,
  type SubcategoryDefinition 
} from "@/lib/product-types";
import type { Product, OfferPickupAddress, OfferImage, OfferInfoFieldValue, ProductType } from "@/lib/types";
import { OfferInfoSection } from "./offer-info-section";
import { OfferCaptureQrModal } from "./offer-capture-qr-modal";
import { getOfferInfoFieldsForSubcategory, getProductInfo } from "@/lib/offer-info-fields";
import { useNavigationGuard } from "@/lib/navigation-guard";
import confetti from "canvas-confetti";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// =============================================================================
// TYPES
// =============================================================================
type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialProductType?: ProductType;
  initialProduct?: Product; // Pre-selected product when opening from product view
};

type Step = 1 | 2 | 3 | 4;

type AccordionType = "barter-type" | "category" | "subcategory" | "brand" | "model" | null;

// Icon map for dynamic icon rendering
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Car, Home, Cpu, Sofa, Shirt, Baby, Dumbbell, Wrench, BookOpen, Monitor, Palette,
  Smartphone, Laptop, Tablet, Headphones, Gamepad2, Watch, BedDouble, Table2, Armchair,
  Archive, Lamp, WashingMachine, Microwave, AirVent, CookingPot, Footprints,
  Gem, ToyBrick, Bike, Tent, Trophy, Drill, Shovel, Hammer, Book, Dice5, Film, Star,
  Printer, Guitar, Paintbrush, Box, Building2, Building, ParkingSquare, Warehouse, Lock,
  Refrigerator, CarFront, CarTaxiFront, Crown, Zap, Gauge, Wind, Fuel, Bus, Truck, Container, Caravan,
  Square, LayoutGrid, BedSingle, Users, ParkingCircle, Package,
};

// Barter type icons
const TYPE_ICONS: Record<ProductType, React.ComponentType<{ className?: string }>> = {
  goods: ShoppingBag,
  automobile: Car,
  "home-spaces": Home,
};

// Barter type colors
const TYPE_COLORS: Record<ProductType, { bg: string; text: string; border: string }> = {
  goods: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
  automobile: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30" },
  "home-spaces": { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/30" },
};

// Barter type descriptions
const TYPE_DESCRIPTIONS: Record<ProductType, string> = {
  goods: "Electronics, furniture, clothing & more",
  automobile: "Cars, bikes, boats & vehicles",
  "home-spaces": "Properties, rentals & spaces",
};

// =============================================================================
// HELPER: Get icon component from string name
// =============================================================================
function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconName] || Package;
}

// =============================================================================
// HELPER: Mobile detection
// =============================================================================
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// =============================================================================
// ACCORDION ITEM COMPONENT
// =============================================================================
function AccordionItem({
  title,
  subtitle,
  value,
  isOpen,
  isDisabled,
  onToggle,
  children,
  icon,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  isOpen: boolean;
  isDisabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`border border-border rounded-xl overflow-hidden transition-all ${isDisabled ? "opacity-50" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={isDisabled}
        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
          isOpen ? "bg-primary/5" : "hover:bg-secondary/50"
        } ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {value && !isOpen && (
            <span className="text-sm text-primary font-medium truncate max-w-[150px]">{value}</span>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-border p-4 bg-card">
          {children}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ICON GRID SELECTOR (for categories/subcategories)
// =============================================================================
function IconGridSelector({
  items,
  selectedId,
  onSelect,
  searchPlaceholder,
  onCreate,
  createLabel,
  showSearch = true,
}: {
  items: { id: string; name: string; icon: string }[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  searchPlaceholder?: string;
  onCreate?: (name: string) => void;
  createLabel?: string;
  showSearch?: boolean;
}) {
  const [search, setSearch] = useState("");
  
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const showCreate = onCreate && search.trim() && filteredItems.length === 0;

  return (
    <div className="space-y-3">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder || "Search..."}
            className="w-full rounded-lg border border-input bg-secondary pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {showCreate && (
            <button
              type="button"
              onClick={() => onCreate(search.trim())}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Create
            </button>
          )}
        </div>
      )}

      {/* Grid of items with icons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto">
        {filteredItems.map((item) => {
          const IconComp = getIconComponent(item.icon);
          const isSelected = selectedId === item.id || selectedId === item.name;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id, item.name)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all ${
                isSelected 
                  ? "bg-primary text-primary-foreground ring-2 ring-primary" 
                  : "bg-secondary/50 hover:bg-secondary text-foreground hover:ring-1 hover:ring-primary/30"
              }`}
            >
              <IconComp className="h-6 w-6" />
              <span className="text-xs font-medium leading-tight">{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Create button when no results */}
      {showCreate && (
        <button
          type="button"
          onClick={() => onCreate(search.trim())}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">{createLabel || `Create "${search.trim()}"`}</span>
        </button>
      )}

      {filteredItems.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
      )}
    </div>
  );
}

// =============================================================================
// BRAND/MODEL LIST SELECTOR (with logo/image)
// =============================================================================
function BrandModelSelector({
  items,
  selectedValue,
  onSelect,
  searchPlaceholder,
  onCreate,
  createLabel,
  type,
}: {
  items: { id: string; name: string; imageUrl?: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  searchPlaceholder?: string;
  onCreate?: (name: string) => void;
  createLabel?: string;
  type: "brand" | "model";
}) {
  const [search, setSearch] = useState("");
  
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const showCreate = onCreate && search.trim();

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder || "Search or type new..."}
          className="w-full rounded-lg border border-input bg-secondary pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {showCreate && filteredItems.length === 0 && (
          <button
            type="button"
            onClick={() => onCreate(search.trim())}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Create
          </button>
        )}
      </div>

      {/* List of items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto">
        {filteredItems.map((item) => {
          const isSelected = selectedValue === item.name;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.name)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all ${
                isSelected 
                  ? "bg-primary text-primary-foreground ring-2 ring-primary" 
                  : "bg-secondary/50 hover:bg-secondary text-foreground hover:ring-1 hover:ring-primary/30"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center ${isSelected ? "bg-primary-foreground/20" : "bg-background"}`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                )}
              </div>
              <span className="text-xs font-medium leading-tight truncate w-full">{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Create option when typing */}
      {showCreate && filteredItems.length === 0 && (
        <button
          type="button"
          onClick={() => onCreate(search.trim())}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">{createLabel || `Create "${search.trim()}"`}</span>
        </button>
      )}

      {filteredItems.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground text-center py-4">No results found. Type to create new.</p>
      )}
    </div>
  );
}

// =============================================================================
// PRODUCT CARD PREVIEW (matches existing product card design)
// =============================================================================
function ProductCardPreview({
  product,
  offerCount,
}: {
  product: Product;
  offerCount: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden w-full h-[88px] card-shadow-primary">
      <div className="p-4 h-full">
        <div className="flex gap-3 h-full">
          {/* Product image - 64x64 */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground/40" />
            )}
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {product.subcategory} <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" /> {product.brand}
            </p>
            <p className="text-xs text-primary font-medium">
              {offerCount === 0 ? "No offers yet" : `Currently ${offerCount} ${offerCount === 1 ? "offer" : "offers"} within this product`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// IMAGE GRID (2x3 with portrait preview)
// =============================================================================
function ImageGrid({
  images,
  selectedIndex,
  onSelectImage,
  onDeleteImage,
  onAddImage,
  maxImages = 6,
  isMobile,
}: {
  images: OfferImage[];
  selectedIndex: number;
  onSelectImage: (index: number) => void;
  onDeleteImage: (index: number) => void;
  onAddImage: () => void;
  maxImages?: number;
  isMobile: boolean;
}) {
  const selectedImage = images[selectedIndex];
  
  // Thumbnail size: balanced for mobile usability
  const thumbSize = isMobile ? "w-[72px] h-[72px]" : "w-16 h-16";

  return (
    <div className="flex gap-4">
      {/* Portrait preview - NO delete button here */}
      <div className="flex-shrink-0">
        <div className={`relative rounded-xl overflow-hidden bg-secondary border-2 border-primary ${isMobile ? "w-[140px] h-[180px]" : "w-[180px] h-[220px]"}`}>
          {selectedImage ? (
            <img 
              src={selectedImage.url} 
              alt="Main preview" 
              className="w-full h-full object-cover" 
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Camera className="h-8 w-8 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">Main Image</span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail grid 2 rows x 3 cols */}
      <div className="flex-1">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: maxImages }).map((_, index) => {
            const image = images[index];
            const isSelected = index === selectedIndex;
            
            if (image) {
              return (
                <div 
                  key={image.imageId} 
                  className={`relative ${thumbSize} rounded-lg overflow-hidden cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "ring-1 ring-border hover:ring-primary/50"
                  }`}
                  onClick={() => onSelectImage(index)}
                >
                  <img 
                    src={image.url} 
                    alt={`Image ${index + 1}`} 
                    className="w-full h-full object-cover" 
                    crossOrigin="anonymous"
                  />
                  {/* Delete button on thumbnail only */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteImage(index); }}
                    className="absolute top-0.5 right-0.5 p-1 rounded-full bg-destructive/90 text-white hover:bg-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            }
            
            // Empty slot (next available)
            if (index === images.length && images.length < maxImages) {
              return (
                <button
                  key={`empty-${index}`}
                  type="button"
                  onClick={onAddImage}
                  className={`${thumbSize} rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors`}
                >
                  <Plus className="h-5 w-5 text-primary" />
                </button>
              );
            }

            // Future empty slot
            return (
              <div
                key={`future-${index}`}
                className={`${thumbSize} rounded-lg border border-border bg-secondary/30 flex items-center justify-center`}
              >
                <span className="text-xs text-muted-foreground">{index + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PROGRESS SIDEBAR (Desktop - Collapsible)
// =============================================================================
function ProgressSidebar({
  currentStep,
  selections,
  onStepClick,
  isCollapsed,
  onToggleCollapse,
  productSpecFields,
}: {
  currentStep: Step;
  selections: {
    barterType?: { id: ProductType; name: string };
    category?: { id: string; name: string };
    subcategory?: { id: string; name: string };
    brand?: string;
    model?: string;
    productImage?: string;
    offerTitle?: string;
    offerImage?: string;
  };
  onStepClick: (step: Step) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  productSpecFields: { fieldName: string; value: string }[];
}) {
  const steps = [
    { number: 1, title: "Product", completed: currentStep > 1 },
    { number: 2, title: "Images", completed: currentStep > 2 },
    { number: 3, title: "Details", completed: currentStep > 3 },
    { number: 4, title: "Address", completed: currentStep > 4 },
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 bg-card border-r border-border p-2 flex flex-col h-full">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-secondary transition-colors mb-4"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="space-y-3">
          {steps.map((step) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.completed;
            const isClickable = step.number <= currentStep;
            
            return (
              <button
                key={step.number}
                onClick={() => isClickable && onStepClick(step.number as Step)}
                disabled={!isClickable}
                className={`w-full flex items-center justify-center p-2 rounded-lg transition-all ${
                  isActive 
                    ? "bg-primary/10" 
                    : isCompleted 
                      ? "hover:bg-secondary cursor-pointer" 
                      : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : isCompleted 
                      ? "bg-primary/15 text-primary" 
                      : "bg-secondary text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.number}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-card border-r border-border p-4 flex flex-col h-full overflow-y-auto">
      {/* Collapse button */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="self-end p-2 rounded-lg hover:bg-secondary transition-colors mb-2"
      >
        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Step indicators */}
      <div className="space-y-2 mb-4">
        {steps.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.completed;
          const isClickable = step.number <= currentStep;
          
          return (
            <button
              key={step.number}
              onClick={() => isClickable && onStepClick(step.number as Step)}
              disabled={!isClickable}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                isActive 
                  ? "bg-primary/10 border border-primary/30" 
                  : isCompleted 
                    ? "bg-secondary/50 hover:bg-secondary cursor-pointer" 
                    : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : isCompleted 
                    ? "bg-primary/15 text-primary" 
                    : "bg-secondary text-muted-foreground"
              }`}>
                {isCompleted ? <Check className="h-3 w-3" /> : step.number}
              </div>
              <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-border my-3" />

      {/* Selected values - compact */}
      <div className="flex-1 space-y-2">
        {selections.barterType && (
          <div className={`flex items-center gap-2 p-2 rounded-lg ${TYPE_COLORS[selections.barterType.id].bg}`}>
            {(() => { const Icon = TYPE_ICONS[selections.barterType.id]; return <Icon className={`h-4 w-4 ${TYPE_COLORS[selections.barterType.id].text}`} />; })()}
            <span className={`text-xs font-medium ${TYPE_COLORS[selections.barterType.id].text}`}>{selections.barterType.name}</span>
          </div>
        )}

        {selections.category && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <span className="text-xs text-muted-foreground">Category:</span>
            <span className="text-xs font-medium text-foreground truncate">{selections.category.name}</span>
          </div>
        )}

        {selections.subcategory && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <span className="text-xs text-muted-foreground">Sub:</span>
            <span className="text-xs font-medium text-foreground truncate">{selections.subcategory.name}</span>
          </div>
        )}

        {selections.brand && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <span className="text-xs text-muted-foreground">Brand:</span>
            <span className="text-xs font-medium text-foreground truncate">{selections.brand}</span>
          </div>
        )}

        {selections.model && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <span className="text-xs text-muted-foreground">Model:</span>
            <span className="text-xs font-medium text-foreground truncate">{selections.model}</span>
          </div>
        )}

        {/* Product specs (show fields after subcategory selected) */}
        {selections.subcategory && productSpecFields.length > 0 && (
          <div className="p-2 rounded-lg bg-secondary/30 space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Specifications</p>
            {productSpecFields.slice(0, 4).map((spec, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-muted-foreground truncate">{spec.fieldName}</span>
                <span className={`font-medium truncate ml-2 ${spec.value ? "text-foreground" : "text-muted-foreground/50"}`}>
                  {spec.value || "—"}
                </span>
              </div>
            ))}
            {productSpecFields.length > 4 && (
              <p className="text-[10px] text-muted-foreground">+{productSpecFields.length - 4} more</p>
            )}
          </div>
        )}

        {/* Offer title */}
        {selections.offerTitle && (
          <div className="p-2 rounded-lg bg-secondary/50">
            <p className="text-[10px] text-muted-foreground uppercase">Title</p>
            <p className="text-xs font-medium text-foreground truncate">{selections.offerTitle}</p>
          </div>
        )}

        {/* Offer image thumbnail */}
        {selections.offerImage && (
          <div className="p-2 rounded-lg bg-secondary/50">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Main Image</p>
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-background">
              <img src={selections.offerImage} alt="Offer" className="w-full h-full object-cover" crossOrigin="anonymous" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MOBILE PROGRESS INDICATOR
// =============================================================================
function MobileProgressIndicator({ currentStep, onBack }: { currentStep: Step; onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      {onBack && currentStep > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        <div className="w-9" />
      )}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-2 rounded-full transition-all ${
              step === currentStep 
                ? "w-8 bg-primary" 
                : step < currentStep 
                  ? "w-2 bg-primary" 
                  : "w-2 bg-secondary"
            }`}
          />
        ))}
      </div>
      <div className="w-9" />
    </div>
  );
}

// =============================================================================
// MOBILE CAMERA CAPTURE
// =============================================================================
function MobileCameraCapture({
  onCapture,
  disabled,
}: {
  onCapture: (dataUrl: string) => void;
  disabled?: boolean;
}) {
  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        onCapture(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <label className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-input bg-background text-foreground transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary cursor-pointer"}`}>
      <Camera className="h-5 w-5" />
      <span className="font-medium">Capture Image</span>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        disabled={disabled}
        className="hidden"
      />
    </label>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function AddOfferFlow({ open, onClose, onSuccess, initialProductType, initialProduct }: Props) {
  const { auth, products, addProduct, addOffer, getBrands, getOffersByProduct } = useBarterStore();
  const { registerBlocker, unregisterBlocker } = useNavigationGuard();
  const BLOCKER_ID = "offer-creation-flow";
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Sidebar collapse state (desktop)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Step 1: Product selection
  const [openAccordion, setOpenAccordion] = useState<AccordionType>("barter-type");
  const [selectedBarterType, setSelectedBarterType] = useState<ProductType | null>(initialProductType || null);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<{ id: string; name: string } | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCustomProduct, setIsCustomProduct] = useState(false); // True if any field was manually created

  // Step 2: Images
  const [offerImages, setOfferImages] = useState<OfferImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showQrModal, setShowQrModal] = useState(false);

  // Step 3: Offer details
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerInfo, setOfferInfo] = useState<OfferInfoFieldValue[]>([]);
  const [showOfferInfo, setShowOfferInfo] = useState(false);

  // Step 4: Pickup address
  const [sameAsProfile, setSameAsProfile] = useState(false);
  const [pickupCountry, setPickupCountry] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupState, setPickupState] = useState("");
  const [pickupZip, setPickupZip] = useState("");
  const [pickupAddressLine1, setPickupAddressLine1] = useState("");
  const [pickupAddressLine2, setPickupAddressLine2] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Get data from store
  const brands = getBrands();
  const countryNames = getCountryNames();
  const availableCities = pickupCountry ? getCitiesForCountry(pickupCountry) : [];

  // Get categories and subcategories
  const categories = useMemo(() => {
    if (!selectedBarterType) return [];
    return getProductTypeCategories(selectedBarterType);
  }, [selectedBarterType]);

  const subcategories = useMemo(() => {
    if (!selectedBarterType || !selectedCategory) return [];
    return getTypeSubcategories(selectedBarterType, selectedCategory.id);
  }, [selectedBarterType, selectedCategory]);

  // Get unique brands for selected subcategory
  const availableBrands = useMemo(() => {
    return products
      .filter(p => {
        if (selectedBarterType && p.productType !== selectedBarterType) return false;
        if (selectedCategory && p.category !== selectedCategory.name) return false;
        if (selectedSubcategory && p.subcategory !== selectedSubcategory.name) return false;
        return p.brand;
      })
      .map(p => ({ id: p.brand!, name: p.brand!, imageUrl: undefined })) // TODO: Add brand logo from brands table
      .filter((v, i, a) => a.findIndex(b => b.name === v.name) === i)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedBarterType, selectedCategory, selectedSubcategory]);

  // Get unique models for selected brand
  const availableModels = useMemo(() => {
    return products
      .filter(p => {
        if (selectedBarterType && p.productType !== selectedBarterType) return false;
        if (selectedCategory && p.category !== selectedCategory.name) return false;
        if (selectedSubcategory && p.subcategory !== selectedSubcategory.name) return false;
        if (selectedBrand && p.brand !== selectedBrand) return false;
        return p.title;
      })
      .map(p => ({ id: p.productId, name: p.title, imageUrl: p.imageUrl }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedBarterType, selectedCategory, selectedSubcategory, selectedBrand]);

  // Product spec fields (empty until model selected, then populated)
  const productSpecFields = useMemo(() => {
    if (selectedProduct) {
      return getProductInfo(selectedProduct.productId);
    }
    if (selectedSubcategory) {
      // Get fields from subcategory but without values
      const fields = getOfferInfoFieldsForSubcategory(selectedSubcategory.name);
      return fields.map((f: { fieldName: string }) => ({ fieldName: f.fieldName, value: "" }));
    }
    return [];
  }, [selectedProduct, selectedSubcategory]);

  // Offer count for selected product
  const productOfferCount = useMemo(() => {
    if (!selectedProduct) return 0;
    return getOffersByProduct(selectedProduct.productId).length;
  }, [selectedProduct, getOffersByProduct]);

  // Check if form has data (for dirty tracking)
  const hasData = useMemo(() => {
    return selectedBarterType !== null || 
           offerImages.length > 0 || 
           offerTitle.trim() !== "" || 
           offerDescription.trim() !== "";
  }, [selectedBarterType, offerImages, offerTitle, offerDescription]);

  // Step 1 complete check
  const step1Complete = useMemo(() => {
    if (selectedBarterType === "home-spaces") {
      return selectedBarterType && selectedCategory && selectedSubcategory;
    }
    return selectedBarterType && selectedCategory && selectedSubcategory && selectedBrand && selectedModel && selectedProduct;
  }, [selectedBarterType, selectedCategory, selectedSubcategory, selectedBrand, selectedModel, selectedProduct]);

  // Step 2 complete check
  const step2Complete = offerImages.length > 0;

  // Step 3 complete check
  const step3Complete = offerTitle.trim() !== "" && offerDescription.trim() !== "";

  // Step 4 complete check
  const step4Complete = pickupCountry && pickupCity && pickupState && pickupZip && pickupAddressLine1;

  // Can create offer
  const canCreate = step1Complete && step2Complete && step3Complete && step4Complete;

  // Reset all state
  const resetAll = useCallback(() => {
    setCurrentStep(1);
    setOpenAccordion("barter-type");
    setSelectedBarterType(initialProductType || null);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedProduct(null);
    setIsCustomProduct(false);
    setOfferImages([]);
    setSelectedImageIndex(0);
    setOfferTitle("");
    setOfferDescription("");
    setOfferInfo([]);
    setShowOfferInfo(false);
    setSameAsProfile(false);
    setPickupCountry("");
    setPickupCity("");
    setPickupState("");
    setPickupZip("");
    setPickupAddressLine1("");
    setPickupAddressLine2("");
    setLoading(false);
    setSidebarCollapsed(false);
  }, [initialProductType]);

  // Initialize from initialProduct if provided
  useEffect(() => {
    if (open && initialProduct) {
      setSelectedBarterType(initialProduct.productType);
      setSelectedCategory({ id: initialProduct.category, name: initialProduct.category });
      if (initialProduct.subcategory) {
        setSelectedSubcategory({ id: initialProduct.subcategory, name: initialProduct.subcategory });
      }
      setSelectedBrand(initialProduct.brand || "");
      setSelectedModel(initialProduct.title);
      setSelectedProduct(initialProduct);
      setOpenAccordion(null);
    }
  }, [open, initialProduct]);

  // Reset on close
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (!prevOpenRef.current && open) {
      if (!initialProduct) {
        resetAll();
      }
    }
    prevOpenRef.current = open;
  }, [open, resetAll, initialProduct]);

  // Navigation blocker
  useEffect(() => {
    if (open && hasData) {
      registerBlocker({
        id: BLOCKER_ID,
        type: "offer-creation",
        message: "You have unsaved changes. Are you sure you want to close?",
      });
    } else {
      unregisterBlocker(BLOCKER_ID);
    }
    return () => unregisterBlocker(BLOCKER_ID);
  }, [open, hasData, registerBlocker, unregisterBlocker]);

  // Handle close with confirmation
  const handleCloseAttempt = useCallback(() => {
    if (hasData) {
      setShowDiscardDialog(true);
    } else {
      onClose();
    }
  }, [hasData, onClose]);

  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    unregisterBlocker(BLOCKER_ID);
    resetAll();
    onClose();
  }, [unregisterBlocker, resetAll, onClose]);

  // Handle same as profile checkbox
  const handleSameAsProfile = useCallback((checked: boolean) => {
    setSameAsProfile(checked);
    if (checked && auth.user?.profileAddress) {
      setPickupCountry(auth.user.profileAddress.country || "");
      setPickupCity(auth.user.profileAddress.city || "");
      setPickupState(auth.user.profileAddress.state || "");
      setPickupZip(auth.user.profileAddress.zip || "");
      setPickupAddressLine1(auth.user.profileAddress.addressLine1 || "");
      setPickupAddressLine2(auth.user.profileAddress.addressLine2 || "");
    }
  }, [auth.user]);

  // Handle image capture
  const handleImageCapture = useCallback((dataUrl: string) => {
    if (offerImages.length >= 6) return;
    const newImage: OfferImage = {
      imageId: generateGuid(),
      url: dataUrl,
      order: offerImages.length,
      uploadedAt: new Date(),
    };
    setOfferImages(prev => [...prev, newImage]);
    setSelectedImageIndex(offerImages.length);
  }, [offerImages]);

  // Handle image delete
  const handleImageDelete = useCallback((index: number) => {
    setOfferImages(prev => {
      const newImages = prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i }));
      return newImages;
    });
    setSelectedImageIndex(prev => Math.max(0, Math.min(prev, offerImages.length - 2)));
  }, [offerImages.length]);

  // Handle create offer
  const handleCreateOffer = useCallback(async () => {
    if (!canCreate || !auth.user || !selectedProduct) return;

    setLoading(true);

    // Build pickup address
    const pickupAddress: OfferPickupAddress = {
      country: pickupCountry,
      city: pickupCity,
      state: pickupState,
      zip: pickupZip,
      addressLine1: pickupAddressLine1,
      addressLine2: pickupAddressLine2 || undefined,
    };

    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));

    // Add the offer
    addOffer({
      offerId: generateGuid(),
      productId: selectedProduct.productId,
      ownerUserId: auth.user.userId,
      title: offerTitle.trim(),
      description: offerDescription.trim(),
      hookedCount: 0,
      outgoingHookCount: 0,
      readyForCommit: false,
      pickupAddress,
      images: offerImages,
      offerInfo: offerInfo.length > 0 ? offerInfo : undefined,
      // Workflow fields - initialized for new offers
      readyState: false,
      lockLevel: 0,
      notificationState: 0,
      isActive: true,
    });

    // Fire confetti
    const colors = ["#FBBF24", "#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6"];
    const duration = isMobile ? 2000 : 3000;
    const particleCount = isMobile ? 100 : 200;
    
    confetti({
      particleCount,
      spread: isMobile ? 60 : 120,
      origin: { y: 0.6 },
      colors,
      disableForReducedMotion: true,
    });

    if (!isMobile) {
      // Additional bursts for desktop
      setTimeout(() => {
        confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors });
      }, 250);
      setTimeout(() => {
        confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors });
      }, 400);
    }

    unregisterBlocker(BLOCKER_ID);

    toast.success("Your offer has been created! Start hooking up to 3 offers you want in return.", {
      duration: 5000,
    });

    setLoading(false);
    
    // Close and navigate after confetti
    setTimeout(() => {
      resetAll();
      onClose();
      onSuccess?.();
    }, isMobile ? 1500 : 2000);
  }, [
    canCreate, auth.user, selectedProduct, pickupCountry, pickupCity, pickupState, pickupZip,
    pickupAddressLine1, pickupAddressLine2, offerTitle, offerDescription, offerImages, offerInfo,
    addOffer, unregisterBlocker, resetAll, onClose, onSuccess, isMobile
  ]);

  // Step navigation
  const goToStep = useCallback((step: Step) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  const nextStep = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  }, [currentStep]);

  // Handle category/subcategory selection
  const handleSelectCategory = useCallback((id: string, name: string) => {
    if (id && name) {
      setSelectedCategory({ id, name });
      setSelectedSubcategory(null);
      setSelectedBrand("");
      setSelectedModel("");
      setSelectedProduct(null);
      setOpenAccordion("subcategory");
    }
  }, []);

  const handleSelectSubcategory = useCallback((id: string, name: string) => {
    if (id && name) {
      setSelectedSubcategory({ id, name });
      setSelectedBrand("");
      setSelectedModel("");
      setSelectedProduct(null);
      if (selectedBarterType === "home-spaces") {
        setOpenAccordion(null);
      } else {
        setOpenAccordion("brand");
      }
    }
  }, [selectedBarterType]);

  const handleSelectBrand = useCallback((brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel("");
    setSelectedProduct(null);
    setOpenAccordion("model");
  }, []);

  const handleSelectModel = useCallback((model: string) => {
    setSelectedModel(model);
    // Find the product
    const product = products.find(p => 
      p.productType === selectedBarterType &&
      p.category === selectedCategory?.name &&
      p.subcategory === selectedSubcategory?.name &&
      p.brand === selectedBrand &&
      p.title === model
    );
    setSelectedProduct(product || null);
    setOpenAccordion(null);
  }, [products, selectedBarterType, selectedCategory, selectedSubcategory, selectedBrand]);

  // Create custom category/subcategory/brand/model
  const handleCreateCategory = useCallback((name: string) => {
    setSelectedCategory({ id: `custom-${generateGuid()}`, name });
    setSelectedSubcategory(null);
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedProduct(null);
    setIsCustomProduct(true);
    setOpenAccordion("subcategory");
    toast.info(`New category "${name}" will be reviewed by our team.`);
  }, []);

  const handleCreateSubcategory = useCallback((name: string) => {
    setSelectedSubcategory({ id: `custom-${generateGuid()}`, name });
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedProduct(null);
    setIsCustomProduct(true);
    if (selectedBarterType === "home-spaces") {
      setOpenAccordion(null);
    } else {
      setOpenAccordion("brand");
    }
    toast.info(`New subcategory "${name}" will be reviewed by our team.`);
  }, [selectedBarterType]);

  const handleCreateBrand = useCallback((name: string) => {
    setSelectedBrand(name);
    setSelectedModel("");
    setSelectedProduct(null);
    setIsCustomProduct(true);
    setOpenAccordion("model");
    toast.info(`New brand "${name}" will be reviewed by our team.`);
  }, []);

  const handleCreateModel = useCallback((name: string) => {
    setSelectedModel(name);
    setIsCustomProduct(true);
    // Create a temporary product (will need backend to create actual product)
    const tempProduct: Product = {
      productId: `temp-${generateGuid()}`,
      productType: selectedBarterType!,
      category: selectedCategory!.name,
      subcategory: selectedSubcategory!.name,
      brand: selectedBrand,
      title: name,
      offerCount: 0,
    };
    setSelectedProduct(tempProduct);
    setOpenAccordion(null);
    toast.info(`New model "${name}" will be reviewed by our team. Product specifications will be added after review.`);
  }, [selectedBarterType, selectedCategory, selectedSubcategory, selectedBrand]);

  if (!open) return null;

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Desktop: Keep GlobalNav visible */}
      <div className="hidden lg:block flex-shrink-0 border-b border-border bg-background">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-primary">BarterX</span>
            <span className="text-sm text-muted-foreground">/ Add New Offer</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: Header with back/close */}
      <div className="lg:hidden flex-shrink-0 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            onClick={currentStep > 1 ? prevStep : handleCloseAttempt}
            className="p-2 -ml-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-base font-semibold text-foreground">Add Offer</span>
          <button
            type="button"
            onClick={handleCloseAttempt}
            className="p-2 -mr-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <MobileProgressIndicator currentStep={currentStep} />
      </div>

      {/* Desktop: Header bar matching workspace */}
      <div className="hidden lg:block flex-shrink-0 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="flex h-12 items-center justify-between px-6">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep}: {currentStep === 1 ? "Choose Product" : currentStep === 2 ? "Add Images" : currentStep === 3 ? "Offer Details" : "Pickup Address"}
          </span>
          <span className="text-sm text-muted-foreground">
            {auth.user?.profileAddress?.city}, {auth.user?.profileAddress?.country}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Progress sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <ProgressSidebar
            currentStep={currentStep}
            selections={{
              barterType: selectedBarterType ? { id: selectedBarterType, name: PRODUCT_TYPES.find(t => t.id === selectedBarterType)?.name || "" } : undefined,
              category: selectedCategory || undefined,
              subcategory: selectedSubcategory || undefined,
              brand: selectedBrand || undefined,
              model: selectedModel || undefined,
              productImage: selectedProduct?.imageUrl || undefined,
              offerTitle: offerTitle || undefined,
              offerImage: offerImages[0]?.url || undefined,
            }}
            onStepClick={goToStep}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            productSpecFields={productSpecFields}
          />
        </div>

        {/* Main form area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 lg:p-6 space-y-6">
            
            {/* =================================================================
                STEP 1: Choose Product
            ================================================================= */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Choose or Create Product</h2>
                
                {/* Barter Type Accordion */}
                <AccordionItem
                  title="Barter Type"
                  subtitle="Select the type of barter"
                  value={selectedBarterType ? PRODUCT_TYPES.find(t => t.id === selectedBarterType)?.name : undefined}
                  isOpen={openAccordion === "barter-type"}
                  isDisabled={false}
                  onToggle={() => setOpenAccordion(openAccordion === "barter-type" ? null : "barter-type")}
                  icon={selectedBarterType ? (() => { const Icon = TYPE_ICONS[selectedBarterType]; return <Icon className={`h-5 w-5 ${TYPE_COLORS[selectedBarterType].text}`} />; })() : undefined}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PRODUCT_TYPES.map((type) => {
                      const Icon = TYPE_ICONS[type.id];
                      const isSelected = selectedBarterType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setSelectedBarterType(type.id);
                            setSelectedCategory(null);
                            setSelectedSubcategory(null);
                            setSelectedBrand("");
                            setSelectedModel("");
                            setSelectedProduct(null);
                            setOpenAccordion("category");
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            isSelected 
                              ? `${TYPE_COLORS[type.id].border} ${TYPE_COLORS[type.id].bg}` 
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <Icon className={`h-8 w-8 ${isSelected ? TYPE_COLORS[type.id].text : "text-muted-foreground"}`} />
                          <span className={`text-sm font-medium ${isSelected ? TYPE_COLORS[type.id].text : "text-foreground"}`}>
                            {type.name.replace(" Barter", "")}
                          </span>
                          <span className={`text-xs text-center ${isSelected ? TYPE_COLORS[type.id].text : "text-muted-foreground"}`}>
                            {TYPE_DESCRIPTIONS[type.id]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </AccordionItem>

                {/* Category Accordion */}
                <AccordionItem
                  title="Category"
                  subtitle="Select or create a category"
                  value={selectedCategory?.name}
                  isOpen={openAccordion === "category"}
                  isDisabled={!selectedBarterType}
                  onToggle={() => setOpenAccordion(openAccordion === "category" ? null : "category")}
                >
                  <IconGridSelector
                    items={categories.map(c => ({ id: c.id, name: c.name, icon: c.icon }))}
                    selectedId={selectedCategory?.id || ""}
                    onSelect={handleSelectCategory}
                    searchPlaceholder="Search or type new category..."
                    onCreate={handleCreateCategory}
                    createLabel="Create new category"
                  />
                </AccordionItem>

                {/* Subcategory Accordion */}
                <AccordionItem
                  title="Subcategory"
                  subtitle="Select or create a subcategory"
                  value={selectedSubcategory?.name}
                  isOpen={openAccordion === "subcategory"}
                  isDisabled={!selectedCategory}
                  onToggle={() => setOpenAccordion(openAccordion === "subcategory" ? null : "subcategory")}
                >
                  <IconGridSelector
                    items={subcategories.map(s => ({ id: s.id, name: s.name, icon: s.icon }))}
                    selectedId={selectedSubcategory?.id || ""}
                    onSelect={handleSelectSubcategory}
                    searchPlaceholder="Search or type new subcategory..."
                    onCreate={handleCreateSubcategory}
                    createLabel="Create new subcategory"
                  />
                </AccordionItem>

                {/* Brand Accordion (skip for home-spaces) */}
                {selectedBarterType !== "home-spaces" && (
                  <AccordionItem
                    title="Brand"
                    subtitle="Select or create a brand"
                    value={selectedBrand}
                    isOpen={openAccordion === "brand"}
                    isDisabled={!selectedSubcategory}
                    onToggle={() => setOpenAccordion(openAccordion === "brand" ? null : "brand")}
                  >
                    <BrandModelSelector
                      items={availableBrands}
                      selectedValue={selectedBrand}
                      onSelect={handleSelectBrand}
                      searchPlaceholder="Search or type new brand..."
                      onCreate={handleCreateBrand}
                      createLabel="Create new brand"
                      type="brand"
                    />
                  </AccordionItem>
                )}

                {/* Model Accordion (skip for home-spaces) */}
                {selectedBarterType !== "home-spaces" && (
                  <AccordionItem
                    title="Model"
                    subtitle="Select or create a model"
                    value={selectedModel}
                    isOpen={openAccordion === "model"}
                    isDisabled={!selectedBrand}
                    onToggle={() => setOpenAccordion(openAccordion === "model" ? null : "model")}
                  >
                    <BrandModelSelector
                      items={availableModels}
                      selectedValue={selectedModel}
                      onSelect={handleSelectModel}
                      searchPlaceholder="Search or type new model..."
                      onCreate={handleCreateModel}
                      createLabel="Create new model"
                      type="model"
                    />
                  </AccordionItem>
                )}

                {/* Next button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!step1Complete}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Images
                  </button>
                </div>
              </div>
            )}

            {/* =================================================================
                STEP 2: Add Images
            ================================================================= */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Add Images</h2>

                {/* Product card preview */}
                {selectedProduct && (
                  <ProductCardPreview product={selectedProduct} offerCount={productOfferCount} />
                )}

                {/* Image grid */}
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add up to 6 images. First image will be the main display image.
                  </p>

                  <ImageGrid
                    images={offerImages}
                    selectedIndex={selectedImageIndex}
                    onSelectImage={setSelectedImageIndex}
                    onDeleteImage={handleImageDelete}
                    onAddImage={() => {
                      if (isMobile) {
                        // Trigger file input for mobile
                        document.getElementById("mobile-camera-input")?.click();
                      } else {
                        setShowQrModal(true);
                      }
                    }}
                    maxImages={6}
                    isMobile={isMobile}
                  />

                  {/* Capture options */}
                  {offerImages.length < 6 && (
                    <div className="space-y-3">
                      {isMobile ? (
                        <>
                          <MobileCameraCapture onCapture={handleImageCapture} />
                          <input
                            id="mobile-camera-input"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const dataUrl = ev.target?.result as string;
                                  if (dataUrl) handleImageCapture(dataUrl);
                                };
                                reader.readAsDataURL(file);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowQrModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-input bg-background text-foreground hover:bg-secondary transition-colors"
                        >
                          <QrCode className="h-5 w-5" />
                          <span className="font-medium">Capture from Phone</span>
                        </button>
                      )}
                    </div>
                  )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-secondary transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!step2Complete}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Details
                  </button>
                </div>
              </div>
            )}

            {/* =================================================================
                STEP 3: Offer Details
            ================================================================= */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Offer Details</h2>

                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Offer Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    placeholder={selectedProduct?.subcategory ? getOfferTitlePlaceholder(selectedProduct.subcategory) : "Enter offer title..."}
                    className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={offerDescription}
                    onChange={(e) => setOfferDescription(e.target.value)}
                    placeholder={selectedProduct?.subcategory ? getOfferDescPlaceholder(selectedProduct.subcategory) : "Describe your offer in detail..."}
                    rows={7}
                    className="w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[140px]"
                  />
                </div>

                {/* Optional offer info */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowOfferInfo(!showOfferInfo)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">Additional Details (Optional)</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showOfferInfo ? "rotate-180" : ""}`} />
                  </button>
                  {showOfferInfo && selectedSubcategory && (
                    <div className="border-t border-border p-4">
                      <OfferInfoSection
                        subcategory={selectedSubcategory.name}
                        values={offerInfo}
                        onChange={setOfferInfo}
                      />
                    </div>
                  )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-secondary transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!step3Complete}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Address
                  </button>
                </div>
              </div>
            )}

            {/* =================================================================
                STEP 4: Pickup Address
            ================================================================= */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Pickup Address</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This is where the buyer will pick up the item after a successful exchange.
                  </p>
                </div>

                {/* Same as profile checkbox - brand yellow accent */}
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={sameAsProfile}
                    onChange={(e) => handleSameAsProfile(e.target.checked)}
                    className="h-5 w-5 rounded border-primary text-primary focus:ring-primary/50 accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Same as registered address</span>
                </label>

                {/* Address form with darker container (like login form) */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="grid grid-cols-2 gap-3">
                  {/* Country */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Country <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={pickupCountry}
                      onChange={(e) => {
                        setPickupCountry(e.target.value);
                        setPickupCity("");
                      }}
                      className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select country</option>
                      {countryNames.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      City <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={pickupCity}
                      onChange={(e) => setPickupCity(e.target.value)}
                      disabled={!pickupCountry}
                      className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      <option value="">Select city</option>
                      {availableCities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      State <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={pickupState}
                      onChange={(e) => setPickupState(e.target.value)}
                      placeholder="Enter state"
                      className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Zip */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Zip/Postal Code <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={pickupZip}
                      onChange={(e) => setPickupZip(e.target.value)}
                      placeholder="Enter zip code"
                      className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Address Line 1 */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Address Line 1 <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={pickupAddressLine1}
                      onChange={(e) => setPickupAddressLine1(e.target.value)}
                      placeholder="Street address"
                      className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Address Line 2 <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={pickupAddressLine2}
                      onChange={(e) => setPickupAddressLine2(e.target.value)}
                      placeholder="Apartment, suite, etc."
                      className="h-11 w-full rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-secondary transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateOffer}
                    disabled={!canCreate || loading}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Offer"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal for desktop image capture */}
      {showQrModal && (
        <OfferCaptureQrModal
          draftData={{
            title: offerTitle,
            description: offerDescription,
            productId: selectedProduct?.productId,
            productTitle: selectedProduct?.title,
          }}
          currentImageCount={offerImages.length}
          maxImages={6}
          onClose={() => setShowQrModal(false)}
          onImagesUpdated={setOfferImages}
          existingImages={offerImages}
        />
      )}

      {/* Discard confirmation dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close? Your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardDialog(false)}>
              Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
