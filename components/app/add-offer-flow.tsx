"use client";

/**
 * ============================================================================
 * ADD OFFER FLOW - Full-screen wizard for creating new offers
 * ============================================================================
 * 
 * This is a 4-step wizard to create an offer:
 * Step 1: Choose/create product (barter type, category, subcategory, brand, model)
 * Step 2: Add images (up to 7 images, optional)
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
  Package, Car, Home, ShoppingBag, Loader2, Trash2, GripVertical,
  Camera, QrCode, MapPin, ChevronLeft, Info,
  // Category icons
  Cpu, Sofa, Shirt, Baby, Dumbbell, Wrench, BookOpen, Monitor, Palette,
  Smartphone, Laptop, Tablet, Headphones, Gamepad2, Watch, BedDouble, Table2, Armchair,
  Archive, Lamp, WashingMachine, Microwave, AirVent, CookingPot, Footprints,
  Gem, ToyBrick, Bike, Tent, Trophy, Drill, Shovel, Hammer, Book, Dice5, Film, Star,
  Printer, Guitar, Paintbrush, Box, Building2, Building, ParkingSquare, Warehouse, Lock,
  Refrigerator, CarFront, CarTaxiFront, Crown, Zap, Gauge, Wind, Fuel, Bus, Truck, Container, Caravan,
  Square, LayoutGrid, BedSingle, Users, ParkingCircle, Briefcase, Key,
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
import type { Product, Offer, OfferPickupAddress, OfferImage, OfferInfoFieldValue, OfferInfoFieldDefinition, ProductType } from "@/lib/types";
import { OfferInfoSection } from "./offer-info-section";
import { OfferCaptureQrModal } from "./offer-capture-qr-modal";
import { ProductImage } from "./product-image";
import { getProductInfo } from "@/lib/offer-info-fields";
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
type Step = 1 | 2 | 3 | 4;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialProductType?: ProductType;
  initialProduct?: Product; // Pre-selected product when opening from product view
  // Embedded mode - renders content only (no overlay), step controlled by parent
  embedded?: boolean;
  currentStep?: Step;
  onStepChange?: (step: Step) => void;
  // Callback to expose the cancel attempt handler to parent (for sidebar cancel button)
  onRegisterCancelHandler?: (handler: () => void) => void;
  // Edit mode - pre-populate with existing offer, Step 1 locked, Save instead of Create
  editOffer?: Offer;
};

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
  rentals: Building2,
  "mini-jobs": Briefcase,
  ownership: Key,
};

// Barter type colors
const TYPE_COLORS: Record<ProductType, { bg: string; text: string; border: string }> = {
  goods: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
  automobile: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30" },
  "home-spaces": { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/30" },
  rentals: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
  "mini-jobs": { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30" },
  ownership: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
};

// Barter type descriptions
const TYPE_DESCRIPTIONS: Record<ProductType, string> = {
  goods: "Electronics, furniture, clothing & more",
  automobile: "Cars, bikes, boats & vehicles",
  "home-spaces": "Properties, rentals & spaces",
  rentals: "Apartments, houses, rooms & parking",
  "mini-jobs": "Short-term work opportunities",
  ownership: "Real estate & vehicle ownership",
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

      {/* List of items - polished brand tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto">
        {filteredItems.map((item) => {
          const isSelected = selectedValue === item.name;
          const isApple = item.name.toLowerCase() === "apple";
          const isSamsung = item.name.toLowerCase() === "samsung";
          const hasLogo = isApple || isSamsung;
          
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.name)}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl text-center transition-all ${
                isSelected 
                  ? "bg-primary text-primary-foreground ring-2 ring-primary shadow-md" 
                  : "bg-secondary/50 hover:bg-secondary text-foreground hover:ring-1 hover:ring-primary/30 hover:shadow-sm"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center ${
                isSelected ? "bg-primary-foreground/20" : hasLogo ? "bg-background" : "bg-secondary"
              }`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : isApple ? (
                  <svg className={`w-7 h-7 ${isSelected ? "text-primary-foreground" : "text-foreground"}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                ) : isSamsung ? (
                  <span className={`text-lg font-bold tracking-tight ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>S</span>
                ) : (
                  <Package className={`h-6 w-6 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                )}
              </div>
              <span className="text-sm font-medium leading-tight truncate w-full">{item.name}</span>
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
// PRODUCT CARD PREVIEW (matches existing product card design from products-tab)
// =============================================================================
function ProductCardPreview({
  product,
  offerCount,
}: {
  product: Product;
  offerCount: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden w-full card-shadow-blue">
      <div className="p-4 min-h-[88px]">
                  <div className="flex gap-3">
                  {/* Product image - 64x64 to match products-tab, white background */}
                  <ProductImage src={product.imageUrl} alt={product.title} size="md" />

          {/* Product info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-sm font-medium text-foreground line-clamp-2">{product.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              {product.subcategory} <span className="inline-block w-1 h-1 rounded-full bg-primary" /> {product.brand}
            </p>
            <p className="text-xs text-cyan-400 font-medium mt-0.5">
              {offerCount === 0 ? "No offers yet" : `${offerCount} ${offerCount === 1 ? "offer" : "offers"} available`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// IMAGE GRID (Main + 6 thumbnails = 7 max, with drag-drop reordering)
// =============================================================================
function ImageGrid({
  images,
  selectedIndex,
  onSelectImage,
  onDeleteImage,
  onReorderImages,
  onAddImage,
  onOpenEnlarged,
  maxImages = 7,
}: {
  images: OfferImage[];
  selectedIndex: number;
  onSelectImage: (index: number) => void;
  onDeleteImage: (index: number) => void;
  onReorderImages: (images: OfferImage[]) => void;
  onAddImage: () => void;
  onOpenEnlarged?: () => void;
  maxImages?: number;
  isMobile: boolean;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const mainImage = images[0]; // First image is always main

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newImages = [...images];
      const [draggedImage] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, draggedImage);
      onReorderImages(newImages);
      // Update selection to follow the moved image
      onSelectImage(dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Render a draggable thumbnail
  const renderThumbnail = (index: number) => {
    const image = images[index];
    const isSelected = index === selectedIndex;
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index;

    if (image) {
      return (
        <div 
          key={image.imageId}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragLeave}
          className={`relative aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
            isDragging ? "opacity-50 scale-95" : ""
          } ${isDragOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} ${
            isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "ring-1 ring-border hover:ring-primary/50"
          }`}
          onClick={() => onSelectImage(index)}
        >
          <img 
            src={image.url} 
            alt={`Image ${index + 1}`} 
            className="w-full h-full object-cover pointer-events-none" 
            crossOrigin="anonymous"
          />
          {/* Delete button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteImage(index); }}
            className="absolute top-1 right-1 p-1.5 rounded-full bg-destructive/90 text-white hover:bg-destructive transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {/* Drag indicator */}
          <div className="absolute bottom-1 left-1 p-1 rounded bg-black/50">
            <GripVertical className="h-3 w-3 text-white/70" />
          </div>
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
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
            dragOverIndex === index ? "border-primary bg-primary/10" : "border-primary/30 hover:border-primary hover:bg-primary/5"
          }`}
        >
          <Plus className="h-6 w-6 text-primary" />
        </button>
      );
    }

    // Future empty slot
    return (
      <div
        key={`future-${index}`}
        className="aspect-square rounded-lg border border-border bg-secondary/30 flex items-center justify-center"
      >
        <span className="text-sm text-muted-foreground">{index + 1}</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Main/Portrait image - spans 3 rows, dominant left column */}
      <div 
        className="row-span-3"
        onDragOver={(e) => handleDragOver(e, 0)}
        onDragLeave={handleDragLeave}
      >
        <div 
          className={`relative w-full h-full min-h-[280px] md:min-h-[320px] rounded-xl overflow-hidden bg-secondary border-2 transition-all ${
            dragOverIndex === 0 ? "border-primary ring-2 ring-primary/50" : "border-primary"
          } ${mainImage ? "cursor-pointer" : ""}`}
          onClick={() => mainImage && onOpenEnlarged?.()}
          draggable={!!mainImage}
          onDragStart={() => mainImage && handleDragStart(0)}
          onDragEnd={handleDragEnd}
        >
          {mainImage ? (
            <>
              <img 
                src={mainImage.url} 
                alt="Main preview" 
                className="w-full h-full object-cover pointer-events-none" 
                crossOrigin="anonymous"
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs flex items-center gap-1">
                <GripVertical className="h-3 w-3" />
                Drag to reorder
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Camera className="h-12 w-12 text-muted-foreground/40" />
              <span className="text-sm text-muted-foreground">Main Image</span>
            </div>
          )}
        </div>
      </div>

      {/* Right column - 3 rows with 2 thumbnails each (indices 1-6) */}
      {[0, 1, 2].map((row) => {
        const slot1Index = row * 2 + 1;
        const slot2Index = row * 2 + 2;
        
        return (
          <div key={row} className="grid grid-cols-2 gap-2">
            {slot1Index < maxImages && renderThumbnail(slot1Index)}
            {slot2Index < maxImages && renderThumbnail(slot2Index)}
          </div>
        );
      })}
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
  isEditMode = false,
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
  isEditMode?: boolean;
}) {
  const steps = [
    { number: 1, title: "Product", completed: currentStep > 1, locked: isEditMode },
    { number: 2, title: "Images", completed: currentStep > 2, locked: false },
    { number: 3, title: "Details", completed: currentStep > 3, locked: false },
    { number: 4, title: "Address", completed: currentStep > 4, locked: false },
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
            const isLocked = step.locked;
            const isClickable = step.number <= currentStep && !isLocked;
            
            return (
              <button
                key={step.number}
                onClick={() => isClickable && onStepClick(step.number as Step)}
                disabled={!isClickable}
                className={`w-full flex items-center justify-center p-2 rounded-lg transition-all ${
                  isLocked
                    ? "bg-secondary/50 cursor-not-allowed"
                    : isActive 
                      ? "bg-primary/10" 
                      : isCompleted 
                        ? "hover:bg-secondary cursor-pointer" 
                        : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                  isLocked
                    ? "bg-muted text-muted-foreground"
                    : isActive 
                      ? "bg-primary text-primary-foreground" 
                      : isCompleted 
                        ? "bg-primary/15 text-primary" 
                        : "bg-secondary text-muted-foreground"
                }`}>
                  {isLocked ? <Lock className="h-3 w-3" /> : isCompleted ? <Check className="h-3.5 w-3.5" /> : step.number}
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
          const isLocked = step.locked;
          const isClickable = step.number <= currentStep && !isLocked;
          
          return (
            <button
              key={step.number}
              onClick={() => isClickable && onStepClick(step.number as Step)}
              disabled={!isClickable}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                isLocked
                  ? "bg-secondary/30 cursor-not-allowed border border-border/50"
                  : isActive 
                    ? "bg-primary/10 border border-primary/30" 
                    : isCompleted 
                      ? "bg-secondary/50 hover:bg-secondary cursor-pointer" 
                      : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                isLocked
                  ? "bg-muted text-muted-foreground"
                  : isActive 
                    ? "bg-primary text-primary-foreground" 
                    : isCompleted 
                      ? "bg-primary/15 text-primary" 
                      : "bg-secondary text-muted-foreground"
              }`}>
                {isLocked ? <Lock className="h-3 w-3" /> : isCompleted ? <Check className="h-3 w-3" /> : step.number}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${isLocked ? "text-muted-foreground" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.title}
                </span>
                {isLocked && (
                  <p className="text-xs text-muted-foreground/70 truncate">Locked in edit mode</p>
                )}
              </div>
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
      {/* Back button always visible - closes flow with confirmation on any step */}
      {onBack ? (
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
export function AddOfferFlow({ 
  open, 
  onClose, 
  onSuccess, 
  initialProductType, 
  initialProduct,
  embedded = false,
  currentStep: controlledStep,
  onStepChange,
  onRegisterCancelHandler,
  editOffer,
}: Props) {
  const { auth, products, addProduct, addOffer, updateOffer, getBrands, getOffersByProduct, getProductById } = useBarterStore();
  
  // Edit mode flag
  const isEditMode = !!editOffer;
  const { registerBlocker, unregisterBlocker } = useNavigationGuard();
  const BLOCKER_ID = "offer-creation-flow";
  
  // Ref to hold the latest cancel handler for external access
  const cancelHandlerRef = useRef<() => void>(() => {});
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Sidebar collapse state (desktop) - not used in embedded mode
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Step state - controlled by parent in embedded mode
  const [internalStep, setInternalStep] = useState<Step>(1);
  const currentStep = embedded && controlledStep !== undefined ? controlledStep : internalStep;
  const setCurrentStep = (step: Step) => {
    if (embedded && onStepChange) {
      onStepChange(step);
    } else {
      setInternalStep(step);
    }
  };

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
  const [showEnlargedImage, setShowEnlargedImage] = useState(false);

  // Step 3: Offer details
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerInfo, setOfferInfo] = useState<OfferInfoFieldValue[]>([]);
  const [showOfferInfo, setShowOfferInfo] = useState(false);
  const [offerFieldDefinitions, setOfferFieldDefinitions] = useState<OfferInfoFieldDefinition[]>([]);
  const [loadingOfferFields, setLoadingOfferFields] = useState(false);

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
  const step2Complete = true; // Images are optional

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
    setOfferFieldDefinitions([]);
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

  // Fetch offer field definitions from database when subcategory changes
  const loadOfferFields = useCallback(async (subcategoryName: string | undefined) => {
    if (!subcategoryName) {
      console.log("[v0] loadOfferFields - no subcategory, returning empty fields");
      setOfferFieldDefinitions([]);
      return;
    }
    
    setLoadingOfferFields(true);
    try {
      // First lookup subcategory by name to get the ID
      const subResponse = await fetch(`/api/data/subcategories?name=${encodeURIComponent(subcategoryName)}`);
      if (!subResponse.ok) {
        console.log("[v0] loadOfferFields - failed to fetch subcategory");
        setOfferFieldDefinitions([]);
        return;
      }
      const subData = await subResponse.json();
      const subcategoryId = subData.subcategories?.[0]?.subcategoryId;
      
      if (!subcategoryId) {
        console.log("[v0] loadOfferFields - subcategory not found:", subcategoryName);
        setOfferFieldDefinitions([]);
        return;
      }
      
      console.log("[v0] loadOfferFields - fetching offer fields for subcategoryId:", subcategoryId, "field_scope: offer");
      
      // Fetch offer fields from the database (field_scope = 'offer')
      const response = await fetch(`/api/data/subcategories/${subcategoryId}/fields?scope=offer`);
      if (!response.ok) {
        console.log("[v0] loadOfferFields - failed to fetch fields");
        setOfferFieldDefinitions([]);
        return;
      }
      
      const data = await response.json();
      const fields = data.offerFields || [];
      
      console.log("[v0] loadOfferFields - loaded", fields.length, "offer fields for subcategory:", subcategoryName);
      
  // Map database fields to OfferInfoFieldDefinition format
  // Use optionLabel for display (human-readable), which is what the user sees
  const mappedFields: OfferInfoFieldDefinition[] = fields.map((f: { fieldId: string; fieldLabel: string; fieldType: string; isRequired: boolean; options?: { optionValue: string; optionLabel: string }[] }) => ({
  fieldId: f.fieldId,
  fieldName: f.fieldLabel,
  fieldType: mapDbFieldType(f.fieldType),
  options: f.options?.map((o: { optionValue: string; optionLabel: string }) => o.optionLabel),
  required: f.isRequired,
  }));
  
  console.log("[v0] loadOfferFields - mapped fields:", mappedFields.map(f => ({ name: f.fieldName, type: f.fieldType, options: f.options })));
      
      setOfferFieldDefinitions(mappedFields);
    } catch (error) {
      console.error("[v0] loadOfferFields error:", error);
      setOfferFieldDefinitions([]);
    } finally {
      setLoadingOfferFields(false);
    }
  }, []);
  
  // Map database field types to OfferInfoFieldType
  // DB types: text, number, select, multiselect, boolean, date, textarea
  // Frontend types: text, number, date_select, single_select, multi_select, attachment
  function mapDbFieldType(dbType: string): "text" | "number" | "date_select" | "single_select" | "multi_select" | "attachment" {
    switch (dbType) {
      case "text":
      case "textarea":
        return "text";
      case "number":
        return "number";
      case "date":
        return "date_select";
      case "select":
        return "single_select";
      case "multiselect":
        return "multi_select";
      case "boolean":
        return "single_select"; // Boolean rendered as Yes/No single select
      default:
        console.log("[v0] Unknown field type:", dbType, "- defaulting to text");
        return "text";
    }
  }
  
  // Load offer fields when subcategory is selected
  useEffect(() => {
    if (selectedSubcategory?.name) {
      loadOfferFields(selectedSubcategory.name);
    } else {
      setOfferFieldDefinitions([]);
    }
  }, [selectedSubcategory?.name, loadOfferFields]);

  // Initialize from initialProduct if provided (not in edit mode)
  useEffect(() => {
    if (open && initialProduct && !editOffer) {
      setSelectedBarterType(initialProduct.productType);
      setSelectedCategory({ id: initialProduct.category, name: initialProduct.category });
      if (initialProduct.subcategory) {
        setSelectedSubcategory({ id: initialProduct.subcategory, name: initialProduct.subcategory });
      }
      setSelectedBrand(initialProduct.brand || "");
      setSelectedModel(initialProduct.title);
      setSelectedProduct(initialProduct);
      setOpenAccordion(null);
      // Start at Step 2 since Step 1 data is already populated
      setCurrentStep(2);
    }
  }, [open, initialProduct, editOffer]);

  // Initialize from editOffer for edit mode
  useEffect(() => {
    if (open && editOffer) {
      const editProduct = getProductById(editOffer.productId);
      if (editProduct) {
        // Set Step 1 data (locked in edit mode)
        setSelectedBarterType(editProduct.productType);
        setSelectedCategory({ id: editProduct.category, name: editProduct.category });
        if (editProduct.subcategory) {
          setSelectedSubcategory({ id: editProduct.subcategory, name: editProduct.subcategory });
        }
        setSelectedBrand(editProduct.brand || "");
        setSelectedModel(editProduct.title);
        setSelectedProduct(editProduct);
        setOpenAccordion(null);
        
        // Set Step 2 data (images)
        setOfferImages(editOffer.images || []);
        
        // Set Step 3 data (details)
        setOfferTitle(editOffer.title);
        setOfferDescription(editOffer.description);
        setOfferInfo(editOffer.offerInfo || []);
        setShowOfferInfo((editOffer.offerInfo?.length || 0) > 0);
        
  // Set Step 4 data (address)
  // DB stores as postalCode, but type uses zip - handle both
  if (editOffer.pickupAddress) {
  const addr = editOffer.pickupAddress as { country?: string; city?: string; state?: string; zip?: string; postalCode?: string; addressLine1?: string; addressLine2?: string };
  setPickupCountry(addr.country || "");
  setPickupCity(addr.city || "");
  setPickupState(addr.state || "");
  setPickupZip(addr.postalCode || addr.zip || "");
  setPickupAddressLine1(addr.addressLine1 || "");
  setPickupAddressLine2(addr.addressLine2 || "");
  }
        
        // Start at Step 2 (Step 1 is locked in edit mode)
        setCurrentStep(2);
      }
    }
  }, [open, editOffer, getProductById]);

  // Reset on close
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (!prevOpenRef.current && open) {
      if (!initialProduct && !editOffer) {
        resetAll();
      }
    }
    prevOpenRef.current = open;
  }, [open, resetAll, initialProduct, editOffer]);

  // Navigation blocker
  useEffect(() => {
    if (open && hasData) {
      registerBlocker({
        id: BLOCKER_ID,
        type: isEditMode ? "offer-editing" : "offer-creation",
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

  // Keep the ref updated with the latest handler
  cancelHandlerRef.current = handleCloseAttempt;
  
  // Register cancel handler with parent for external trigger (e.g., sidebar cancel button)
  // We register a stable wrapper function that calls the ref, avoiding re-registration loops
  useEffect(() => {
    if (embedded && onRegisterCancelHandler) {
      onRegisterCancelHandler(() => cancelHandlerRef.current());
    }
  }, [embedded, onRegisterCancelHandler]);

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

  // Handle create or save offer (depending on edit mode)
  const handleCreateOffer = useCallback(async () => {
    console.log("[v0] handleCreateOffer called - canCreate:", canCreate, "auth.user:", !!auth.user, "selectedProduct:", !!selectedProduct);
    
    if (!canCreate || !auth.user || !selectedProduct) {
      console.log("[v0] handleCreateOffer early return - missing:", !canCreate ? "canCreate" : "", !auth.user ? "auth.user" : "", !selectedProduct ? "selectedProduct" : "");
      return;
    }

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

    if (isEditMode && editOffer) {
      // UPDATE existing offer via API
      try {
        // Convert offerInfo array to JSONB object { field_id: { value, label } }
        const offerInfoJsonb: Record<string, { value: unknown; label: string }> = {};
        offerInfo.forEach(field => {
          if (field.fieldId && field.value !== null && field.value !== undefined) {
            offerInfoJsonb[field.fieldId] = {
              value: field.value,
              label: field.fieldName,
            };
          }
        });
        
        // Build pickup address for DB
        const pickupAddressJsonb = {
          country: pickupCountry,
          city: pickupCity,
          state: pickupState,
          postalCode: pickupZip,
          addressLine1: pickupAddressLine1,
          addressLine2: pickupAddressLine2 || "",
        };
        
        console.log("[v0] Updating offer with offerInfo:", offerInfoJsonb, "pickupAddress:", pickupAddressJsonb);
        
        const response = await fetch(`/api/data/offers/${editOffer.offerId}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "x-user-id": auth.user.userId,
          },
          credentials: "include",
          body: JSON.stringify({
            title: offerTitle.trim(),
            description: offerDescription.trim(),
            offerInfo: Object.keys(offerInfoJsonb).length > 0 ? offerInfoJsonb : undefined,
            pickupAddress: pickupAddressJsonb,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to update offer");
        }
        
        // Also update local store
        updateOffer(editOffer.offerId, {
          title: offerTitle.trim(),
          description: offerDescription.trim(),
          pickupAddress,
          images: offerImages,
          offerInfo: offerInfo.length > 0 ? offerInfo : undefined,
        });

        unregisterBlocker(BLOCKER_ID);
        toast.success("Your offer has been saved successfully.", { duration: 3000 });
        setLoading(false);
        resetAll();
        onClose();
        onSuccess?.();
      } catch (error) {
        console.error("[v0] Failed to update offer:", error);
        toast.error("Failed to save offer. Please try again.");
        setLoading(false);
      }
    } else {
      // CREATE new offer via API
      try {
        console.log("[v0] Creating offer - productId:", selectedProduct.productId, "userId:", auth.user.userId);
        
        const isTempProduct = selectedProduct.productId.startsWith('temp-');
        let apiOfferId: string | null = null;
        let tempProductId: string | null = null;
        let isPendingReview = false;
        
        if (isTempProduct) {
          // Create temp product in DB first, then create offer linked to it
          console.log("[v0] Creating temp product in DB");
          
          const tempProductResponse = await fetch("/api/data/temp-products", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "x-user-id": auth.user.userId,
            },
            credentials: "include",
            body: JSON.stringify({
              barterTypeId: selectedProduct.barterTypeId,
              categoryId: selectedProduct.categoryId,
              subcategoryId: selectedProduct.subcategoryId,
              brandName: selectedProduct.brand || null,
              modelName: selectedProduct.model || null,
              title: selectedProduct.title,
              description: selectedProduct.description || null,
            }),
          });
          
          if (!tempProductResponse.ok) {
            const error = await tempProductResponse.json().catch(() => ({}));
            throw new Error(error.error || "Failed to create custom product");
          }
          
          const tempProductData = await tempProductResponse.json();
          tempProductId = tempProductData.tempProduct.temp_product_id;
          isPendingReview = true;
          console.log("[v0] Temp product created:", tempProductId);
          
          // Also add to local store for immediate display
          addProduct(selectedProduct);
          
          // Convert offerInfo array to JSONB object { field_id: { value, label } }
          const offerInfoJsonbTemp: Record<string, { value: unknown; label: string }> = {};
          offerInfo.forEach(field => {
            if (field.fieldId && field.value !== null && field.value !== undefined) {
              offerInfoJsonbTemp[field.fieldId] = {
                value: field.value,
                label: field.fieldName,
              };
            }
          });
          
          // Build pickup address for DB
          const pickupAddressJsonbTemp = {
            country: pickupCountry,
            city: pickupCity,
            state: pickupState,
            postalCode: pickupZip,
            addressLine1: pickupAddressLine1,
            addressLine2: pickupAddressLine2 || "",
          };
          
          // Create offer linked to temp product
          const offerResponse = await fetch("/api/data/offers", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "x-user-id": auth.user.userId,
            },
            credentials: "include",
            body: JSON.stringify({
              tempProductId: tempProductId,
              userId: auth.user.userId,
              title: offerTitle.trim(),
              description: offerDescription.trim(),
              condition: "good",
              offerInfo: Object.keys(offerInfoJsonbTemp).length > 0 ? offerInfoJsonbTemp : undefined,
              pickupAddress: pickupAddressJsonbTemp,
            }),
          });
          
          if (!offerResponse.ok) {
            const error = await offerResponse.json().catch(() => ({}));
            throw new Error(error.error || "Failed to create offer");
          }
          
          const offerData = await offerResponse.json();
          apiOfferId = offerData.offer?.offerId;
          console.log("[v0] Offer created with temp product:", apiOfferId);
        } else {
          // Create offer for existing catalog product
          console.log("[v0] Calling POST /api/data/offers");
          
          // Convert offerInfo array to JSONB object { field_id: { value, label } }
          const offerInfoJsonb: Record<string, { value: unknown; label: string }> = {};
          offerInfo.forEach(field => {
            if (field.fieldId && field.value !== null && field.value !== undefined) {
              offerInfoJsonb[field.fieldId] = {
                value: field.value,
                label: field.fieldName,
              };
            }
          });
          
          // Build pickup address for DB
          const pickupAddressJsonb = {
            country: pickupCountry,
            city: pickupCity,
            state: pickupState,
            postalCode: pickupZip,
            addressLine1: pickupAddressLine1,
            addressLine2: pickupAddressLine2 || "",
          };
          
          const response = await fetch("/api/data/offers", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "x-user-id": auth.user.userId,
            },
            credentials: "include",
            body: JSON.stringify({
              productId: selectedProduct.productId,
              userId: auth.user.userId,
              title: offerTitle.trim(),
              description: offerDescription.trim(),
              condition: "good",
              offerInfo: Object.keys(offerInfoJsonb).length > 0 ? offerInfoJsonb : undefined,
              pickupAddress: pickupAddressJsonb,
            }),
          });

          console.log("[v0] Offer API response status:", response.status);
          
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error("[v0] Offer API error:", error);
            throw new Error(error.error || "Failed to create offer");
          }

          const data = await response.json();
          console.log("[v0] Offer created via API:", data.offer?.offerId);
          apiOfferId = data.offer?.offerId;
        }
        
        // Add to local store with the returned offer data
        const newOffer: Offer = {
          offerId: apiOfferId || generateGuid(),
          productId: isTempProduct ? selectedProduct.productId : selectedProduct.productId,
          tempProductId: tempProductId || undefined,
          isPendingReview,
          ownerUserId: auth.user.userId,
          title: offerTitle.trim(),
          description: offerDescription.trim(),
          hookedCount: 0,
          outgoingHookCount: 0,
          readyForCommit: false,
          pickupAddress,
          images: offerImages,
          offerInfo: offerInfo.length > 0 ? offerInfo : undefined,
          readyState: false,
          lockLevel: 0,
          notificationState: 0,
          isActive: true,
        };
        addOffer(newOffer);

        // Fire confetti (only for create)
      const colors = ["#FBBF24", "#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6"];
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
      } catch (error) {
        console.error("[v0] Failed to create offer:", error);
        toast.error("Failed to create offer. Please try again.");
        setLoading(false);
      }
    }
  }, [
    canCreate, auth.user, selectedProduct, pickupCountry, pickupCity, pickupState, pickupZip,
    pickupAddressLine1, pickupAddressLine2, offerTitle, offerDescription, offerImages, offerInfo,
    addOffer, addProduct, updateOffer, unregisterBlocker, resetAll, onClose, onSuccess, isMobile, isEditMode, editOffer
  ]);

  // Step navigation
  const goToStep = useCallback((step: Step) => {
    // In edit mode, Step 1 is locked - can't go back to it
    if (isEditMode && step === 1) return;
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  }, [currentStep, isEditMode]);

  const nextStep = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    // In edit mode, can't go back to Step 1
    const minStep = isEditMode ? 2 : 1;
    if (currentStep > minStep) {
      setCurrentStep((currentStep - 1) as Step);
    }
  }, [currentStep, isEditMode]);

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
  // EMBEDDED MODE - Renders content only, no overlay wrapper
  // Parent controls step via props and sidebar is handled by workspace
  // ==========================================================================
  if (embedded) {
    // Minimum step for edit mode (can't go back to step 1)
    const minStep = isEditMode ? 2 : 1;
    
    return (
      <>
        {/* Desktop: Header with back/close button */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={currentStep > minStep ? prevStep : onClose}
              className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label={currentStep > minStep ? "Go back" : "Close"}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{isEditMode ? "Edit Offer" : "Add New Offer"}</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep}: {currentStep === 1 ? "Choose Product" : currentStep === 2 ? "Add Images" : currentStep === 3 ? "Offer Details" : "Pickup Address"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseAttempt}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile: Show progress indicator - back arrow always exits flow with confirmation */}
        <div className="lg:hidden mb-4">
          <MobileProgressIndicator currentStep={currentStep} onBack={handleCloseAttempt} />
        </div>

        {/* Step content - same as overlay mode but without wrapper */}
        <div className="max-w-3xl mx-auto space-y-6">
          {/* STEP 1: Choose Product */}
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
                  {PRODUCT_TYPES.filter((type) => type.isActive !== false).map((type) => {
                    const Icon = TYPE_ICONS[type.id];
                    const isSelected = selectedBarterType === type.id;
                    const isComingSoon = type.isOfferCreationEnabled === false;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        disabled={isComingSoon}
                        onClick={() => {
                          if (isComingSoon) return;
                          setSelectedBarterType(type.id);
                          setSelectedCategory(null);
                          setSelectedSubcategory(null);
                          setSelectedBrand("");
                          setSelectedModel("");
                          setSelectedProduct(null);
                          setOpenAccordion("category");
                        }}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          isComingSoon
                            ? "opacity-60 cursor-not-allowed border-border"
                            : isSelected 
                              ? `${TYPE_COLORS[type.id].border} ${TYPE_COLORS[type.id].bg}` 
                              : "border-border hover:border-primary/30"
                        }`}
                      >
                        {isComingSoon && (
                          <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                            Soon
                          </span>
                        )}
                        <Icon className={`h-8 w-8 ${isComingSoon ? "text-muted-foreground" : isSelected ? TYPE_COLORS[type.id].text : "text-muted-foreground"}`} />
                        <span className={`text-sm font-medium ${isComingSoon ? "text-muted-foreground" : isSelected ? TYPE_COLORS[type.id].text : "text-foreground"}`}>
                          {type.name.replace(" Barter", "")}
                        </span>
                        <span className={`text-xs text-center ${isComingSoon ? "text-muted-foreground" : isSelected ? TYPE_COLORS[type.id].text : "text-muted-foreground"}`}>
                          {TYPE_DESCRIPTIONS[type.id] || type.description}
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
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <span>Capture Images</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Images */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Add Images</h2>
              
              {/* Product Card Preview */}
              {selectedProduct && (
                <ProductCardPreview product={selectedProduct} offerCount={productOfferCount} />
              )}

              {/* Image grid */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add up to 7 images. First image will be the main display image.
                </p>

                <ImageGrid
                  images={offerImages}
                  selectedIndex={selectedImageIndex}
                  onSelectImage={setSelectedImageIndex}
                  onDeleteImage={handleImageDelete}
                  onReorderImages={setOfferImages}
                  onAddImage={() => {
                    if (isMobile) {
                      document.getElementById("mobile-camera-input")?.click();
                    } else {
                      setShowQrModal(true);
                    }
                  }}
                  onOpenEnlarged={() => setShowEnlargedImage(true)}
                  maxImages={7}
                  isMobile={isMobile}
                />

                {/* Capture options */}
                {offerImages.length < 7 && (
                  <div className="flex flex-wrap gap-2">
                    {isMobile ? (
                      <>
                        <input
                          id="mobile-camera-input"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                handleImageCapture(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById("mobile-camera-input")?.click()}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                          <span>Take Photo</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                      >
                        <QrCode className="h-4 w-4" />
                        <span>Scan to Capture</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Step 1</span>
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!step2Complete}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Details</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Offer Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Offer Details</h2>
              
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder={selectedProduct?.subcategory ? getOfferTitlePlaceholder(selectedProduct.subcategory) : "Enter offer title..."}
                  className="w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  placeholder={selectedProduct?.subcategory ? getOfferDescPlaceholder(selectedProduct.subcategory) : "Describe your offer in detail..."}
                  rows={7}
                  className="w-full rounded-lg border border-input bg-secondary px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[140px]"
                />
              </div>

              {/* Optional Info Fields - Only show if offer fields are defined in backoffice */}
              {offerFieldDefinitions.length > 0 && (
                <OfferInfoSection
                  subcategoryId={selectedSubcategory?.id || ""}
                  fieldDefinitions={offerFieldDefinitions}
                  values={offerInfo}
                  onChange={setOfferInfo}
                />
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Step 2</span>
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!step3Complete}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <span>Add Address</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Pickup Address */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Pickup Address</h2>
              
              {/* Same as profile checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:bg-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={sameAsProfile}
                  onChange={(e) => handleSameAsProfile(e.target.checked)}
                  className="w-4 h-4 rounded border-input accent-primary"
                />
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Same as my profile address</span>
                </div>
              </label>

              {/* Address form */}
              <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-muted-foreground">Country <span className="text-red-500">*</span></label>
                    <select
                      value={pickupCountry}
                      onChange={(e) => { setPickupCountry(e.target.value); setPickupCity(""); }}
                      className="mt-1 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select country</option>
                      {getCountryNames().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-muted-foreground">City <span className="text-red-500">*</span></label>
                    <select
                      value={pickupCity}
                      onChange={(e) => setPickupCity(e.target.value)}
                      disabled={!pickupCountry}
                      className="mt-1 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      <option value="">Select city</option>
                      {pickupCountry && getCitiesForCountry(pickupCountry).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-muted-foreground">State/Province <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={pickupState}
                      onChange={(e) => setPickupState(e.target.value)}
                      placeholder="Enter state or province"
                      className="mt-1 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-muted-foreground">ZIP/Postal Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={pickupZip}
                      onChange={(e) => setPickupZip(e.target.value)}
                      placeholder="Enter ZIP or postal code"
                      className="mt-1 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Address Line 1 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={pickupAddressLine1}
                      onChange={(e) => setPickupAddressLine1(e.target.value)}
                      placeholder="Street address"
                      className="mt-1 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Address Line 2</label>
                    <input
                      type="text"
                      value={pickupAddressLine2}
                      onChange={(e) => setPickupAddressLine2(e.target.value)}
                      placeholder="Apartment, suite, etc. (optional)"
                      className="mt-1 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Step 3</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateOffer}
                  disabled={!canCreate || loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
<span>{loading ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Offer" : "Create Offer")}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Discard dialog */}
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

        {/* Enlarged Image Editor Modal */}
        {showEnlargedImage && offerImages[selectedImageIndex] && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <button
                type="button"
                onClick={() => setShowEnlargedImage(false)}
                className="flex items-center gap-2 text-white hover:text-white/80"
              >
                <X className="h-5 w-5" />
                <span className="text-sm font-medium">Close</span>
              </button>
              <span className="text-white/60 text-sm">Edit Image</span>
              <div className="w-16" />
            </div>
            
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              <img
                src={offerImages[selectedImageIndex].url}
                alt="Enlarged preview"
                className="max-w-full max-h-full object-contain rounded-lg"
                crossOrigin="anonymous"
              />
            </div>
            
            <div className="p-4 border-t border-white/10">
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => toast.info("Crop feature coming soon")}
                  className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <LayoutGrid className="h-5 w-5" />
                  <span className="text-xs">Crop</span>
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Reposition feature coming soon")}
                  className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-xs">Reposition</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEnlargedImage(false);
                    if (isMobile) {
                      document.getElementById("mobile-camera-input")?.click();
                    } else {
                      setShowQrModal(true);
                    }
                  }}
                  className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-xs">Retake</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
            maxImages={7}
            onClose={() => setShowQrModal(false)}
            onImagesUpdated={setOfferImages}
            existingImages={offerImages}
          />
        )}
      </>
    );
  }

  // ==========================================================================
  // OVERLAY MODE - Legacy full screen overlay
  // ==========================================================================
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Desktop: Keep GlobalNav visible */}
      <div className="hidden lg:block flex-shrink-0 border-b border-border bg-background">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-primary">BarterX</span>
            <span className="text-sm text-muted-foreground">/ {isEditMode ? "Edit Offer" : "Add New Offer"}</span>
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

      {/* Mobile: Header with back/close - back arrow always exits flow with confirmation */}
      <div className="lg:hidden flex-shrink-0 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            onClick={handleCloseAttempt}
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
            isEditMode={isEditMode}
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
                    {PRODUCT_TYPES.filter((type) => type.isActive !== false).map((type) => {
                      const Icon = TYPE_ICONS[type.id];
                      const isSelected = selectedBarterType === type.id;
                      const isComingSoon = type.isOfferCreationEnabled === false;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          disabled={isComingSoon}
                          onClick={() => {
                            if (isComingSoon) return;
                            setSelectedBarterType(type.id);
                            setSelectedCategory(null);
                            setSelectedSubcategory(null);
                            setSelectedBrand("");
                            setSelectedModel("");
                            setSelectedProduct(null);
                            setOpenAccordion("category");
                          }}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            isComingSoon
                              ? "opacity-60 cursor-not-allowed border-border"
                              : isSelected 
                                ? `${TYPE_COLORS[type.id].border} ${TYPE_COLORS[type.id].bg}` 
                                : "border-border hover:border-primary/30"
                          }`}
                        >
                          {isComingSoon && (
                            <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                              Soon
                            </span>
                          )}
                          <Icon className={`h-8 w-8 ${isComingSoon ? "text-muted-foreground" : isSelected ? TYPE_COLORS[type.id].text : "text-muted-foreground"}`} />
                          <span className={`text-sm font-medium ${isComingSoon ? "text-muted-foreground" : isSelected ? TYPE_COLORS[type.id].text : "text-foreground"}`}>
                            {type.name.replace(" Barter", "")}
                          </span>
                          <span className={`text-xs text-center ${isComingSoon ? "text-muted-foreground" : isSelected ? TYPE_COLORS[type.id].text : "text-muted-foreground"}`}>
                            {TYPE_DESCRIPTIONS[type.id] || type.description}
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
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <span>Capture Images</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

                {/* =================================================================
                STEP 2: Add Images
                ================================================================= */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-foreground">{isEditMode ? "Edit Images" : "Add Images"}</h2>
                    
                    {/* Edit mode info note */}
                    {isEditMode && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-500">
                          You are editing an existing offer. The product cannot be changed. You can update images, details, and pickup address.
                        </p>
                      </div>
                    )}
                    
                    {/* Product card preview */}
                    {selectedProduct && (
                      <ProductCardPreview product={selectedProduct} offerCount={productOfferCount} />
                    )}

                {/* Image grid */}
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add up to 7 images. First image will be the main display image.
                  </p>

                  <ImageGrid
                    images={offerImages}
                    selectedIndex={selectedImageIndex}
                    onSelectImage={setSelectedImageIndex}
                    onDeleteImage={handleImageDelete}
                    onReorderImages={setOfferImages}
                    onAddImage={() => {
                      if (isMobile) {
                        // Trigger file input for mobile
                        document.getElementById("mobile-camera-input")?.click();
                      } else {
                        setShowQrModal(true);
                      }
                    }}
                    onOpenEnlarged={() => setShowEnlargedImage(true)}
                    maxImages={7}
                    isMobile={isMobile}
                  />

                  {/* Capture options */}
                  {offerImages.length < 7 && (
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

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Step 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!step2Complete}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <span>Continue to Details</span>
                    <ChevronRight className="h-4 w-4" />
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
                    className="w-full rounded-lg border border-input bg-secondary px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[140px]"
                  />
                </div>

                {/* Optional offer info - only show if offer fields are defined in backoffice */}
                {offerFieldDefinitions.length > 0 && (
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
                          subcategoryId={selectedSubcategory.id}
                          fieldDefinitions={offerFieldDefinitions}
                          values={offerInfo}
                          onChange={setOfferInfo}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Step 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!step3Complete}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <span>Add Address</span>
                    <ChevronRight className="h-4 w-4" />
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

                {/* Address form - dark container matching login/profile forms */}
                <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                  <div className="grid grid-cols-2 gap-4">
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
                    className="flex-1 py-3 rounded-xl border border-input bg-background text-foreground font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Step 3</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateOffer}
                    disabled={!canCreate || loading}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isEditMode ? "Saving..." : "Creating..."}
                      </>
                    ) : (
                      isEditMode ? "Save Offer" : "Create Offer"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enlarged Image Editor Modal */}
      {showEnlargedImage && offerImages[selectedImageIndex] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button
              type="button"
              onClick={() => setShowEnlargedImage(false)}
              className="flex items-center gap-2 text-white hover:text-white/80"
            >
              <X className="h-5 w-5" />
              <span className="text-sm font-medium">Close</span>
            </button>
            <span className="text-white/60 text-sm">Edit Image</span>
            <div className="w-16" />
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={offerImages[selectedImageIndex].url}
              alt="Enlarged preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              crossOrigin="anonymous"
            />
          </div>
          
          <div className="p-4 border-t border-white/10">
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  // Crop functionality placeholder
                  toast.info("Crop feature coming soon");
                }}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <LayoutGrid className="h-5 w-5" />
                <span className="text-xs">Crop</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  // Reposition functionality placeholder
                  toast.info("Reposition feature coming soon");
                }}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-xs">Reposition</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEnlargedImage(false);
                  if (isMobile) {
                    document.getElementById("mobile-camera-input")?.click();
                  } else {
                    setShowQrModal(true);
                  }
                }}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Camera className="h-5 w-5" />
                <span className="text-xs">Retake</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
              maxImages={7}
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
