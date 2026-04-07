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
 * Features:
 * - Create new products (Step 1 flow from Add Offer)
 * - Product detail screen with assets management
 * - Dynamic product info form from field schema
 */

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { 
  Search, SlidersHorizontal, Package, X, ChevronDown, Plus, ArrowLeft, 
  Upload, Loader2, Check, Save, Image as ImageIcon
} from "lucide-react";
import {
  // Category icons
  Cpu, Sofa, Refrigerator, Shirt, Baby, Dumbbell, Wrench, BookOpen, Monitor, Paintbrush,
  Car, Bike, Bus, Truck, Container, Caravan,
  Building2, Home, BedDouble, ParkingSquare, Warehouse, ShoppingBag, Briefcase, Key,
  // Subcategory icons
  Smartphone, Laptop, Tablet, Headphones, Gamepad2, Watch, Camera,
  Table, Armchair, Archive, Lamp, WashingMachine, Microwave, AirVent, CookingPot,
  Footprints, Gem, BedSingle, ToyBrick, CarFront,
  Tent, Trophy, Drill, Shovel, Hammer, Book, Dice5, Film, Star, Table2, Printer, Guitar,
  Box, CarTaxiFront, Crown, Zap, Gauge, Wind, Fuel, Users, Castle, Building,
  ParkingCircle, Lock, Square, LayoutGrid,
} from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import type { Product, ProductType, OfferInfoFieldDefinition } from "@/lib/types";
import { 
  getProductTypeCategories, getCategoryByName, 
  type CategoryDefinition, type SubcategoryDefinition,
  PRODUCT_TYPES
} from "@/lib/product-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

// =============================================================================
// CONSTANTS
// =============================================================================
const SUPABASE_STORAGE_URL = "https://mdytcwlxlwvmioizaidu.supabase.co/storage/v1/object/public/product-images";

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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
  cars: Car,
  bikes: Bike,
  scooters: Bike,
  "vans-commercial": Bus,
  trucks: Truck,
  trailers: Container,
  caravans: Caravan,
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

// Barter type configuration
const BARTER_TYPES: Array<{
  id: ProductType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { id: "goods", label: "Goods", icon: ShoppingBag, color: "text-blue-500" },
  { id: "rentals", label: "Rentals", icon: Building2, color: "text-emerald-500" },
  { id: "mini-jobs", label: "Jobs", icon: Briefcase, color: "text-purple-500" },
];

// Barter type colors
const TYPE_COLORS: Record<ProductType, { bg: string; text: string; border: string }> = {
  goods: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
  automobile: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30" },
  "home-spaces": { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/30" },
  rentals: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
  "mini-jobs": { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30" },
  ownership: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
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

// Icon map for dynamic rendering
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Car, Home, Cpu, Sofa, Shirt, Baby, Dumbbell, Wrench, BookOpen, Monitor, Paintbrush,
  Smartphone, Laptop, Tablet, Headphones, Gamepad2, Watch, Camera, BedDouble, Table, Table2, Armchair,
  Archive, Lamp, WashingMachine, Microwave, AirVent, CookingPot, Footprints,
  Gem, ToyBrick, Bike, Tent, Trophy, Drill, Shovel, Hammer, Book, Dice5, Film, Star,
  Printer, Guitar, Box, Building2, Building, ParkingSquare, Warehouse, Lock,
  Refrigerator, CarFront, CarTaxiFront, Crown, Zap, Gauge, Wind, Fuel, Bus, Truck, Container, Caravan,
  Square, LayoutGrid, BedSingle, Users, ParkingCircle, Package,
};

function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconName] || Package;
}

// =============================================================================
// PRODUCT IMAGE BOX
// =============================================================================
function ProductImageBox({ src, alt, size = "md" }: { src?: string | null; alt: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-24 w-24",
  };
  
  if (src) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border border-border`}>
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
    <div className={`${sizeClasses[size]} rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border border-border`}>
      <Package className="h-6 w-6 text-muted-foreground/40" />
    </div>
  );
}

// =============================================================================
// ASSET UPLOAD BOX
// =============================================================================
function AssetUploadBox({
  label,
  imageUrl,
  onUpload,
  uploading,
  entityType,
}: {
  label: string;
  imageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  entityType: "product" | "category" | "subcategory" | "brand";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl bg-card">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      
      <div className="relative h-20 w-20 rounded-lg bg-white border border-border overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="h-full w-full object-contain" crossOrigin="anonymous" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <Upload className="h-3.5 w-3.5" />
        {imageUrl ? "Replace" : "Upload"}
      </Button>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// =============================================================================
// ACCORDION ITEM (reused from add-offer-flow)
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
// ICON GRID SELECTOR (reused from add-offer-flow)
// =============================================================================
function IconGridSelector({
  items,
  selectedId,
  onSelect,
  searchPlaceholder,
  onCreate,
  showSearch = true,
}: {
  items: { id: string; name: string; icon: string }[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  searchPlaceholder?: string;
  onCreate?: (name: string) => void;
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

      {showCreate && (
        <button
          type="button"
          onClick={() => onCreate(search.trim())}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">{`Create "${search.trim()}"`}</span>
        </button>
      )}

      {filteredItems.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
      )}
    </div>
  );
}

// =============================================================================
// BRAND/MODEL SELECTOR (reused from add-offer-flow)
// =============================================================================
function BrandModelSelector({
  items,
  selectedValue,
  onSelect,
  searchPlaceholder,
  onCreate,
}: {
  items: { id: string; name: string; imageUrl?: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  searchPlaceholder?: string;
  onCreate?: (name: string) => void;
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto">
        {filteredItems.map((item) => {
          const isSelected = selectedValue === item.name;
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
                isSelected ? "bg-primary-foreground/20" : "bg-secondary"
              }`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className={`h-6 w-6 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                )}
              </div>
              <span className="text-sm font-medium leading-tight truncate w-full">{item.name}</span>
            </button>
          );
        })}
      </div>

      {showCreate && filteredItems.length === 0 && (
        <button
          type="button"
          onClick={() => onCreate(search.trim())}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">{`Create "${search.trim()}"`}</span>
        </button>
      )}

      {filteredItems.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground text-center py-4">No results found. Type to create new.</p>
      )}
    </div>
  );
}

// =============================================================================
// DYNAMIC FIELD RENDERER (for product info)
// =============================================================================
function DynamicFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: OfferInfoFieldDefinition;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  switch (field.fieldType) {
    case "text":
      return (
        <Input
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.fieldName.toLowerCase()}`}
        />
      );
      
    case "single_select":
      return (
        <Select value={(value as string) || ""} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.fieldName.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      
    case "multi_select":
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {field.options?.map((opt) => {
            const isSelected = selectedValues.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onChange(selectedValues.filter(v => v !== opt));
                  } else {
                    onChange([...selectedValues, opt]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
      
    case "date_select":
      return (
        <Input
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      
    default:
      return (
        <Input
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.fieldName.toLowerCase()}`}
        />
      );
  }
}

// =============================================================================
// PRODUCT DETAIL TYPES
// =============================================================================
interface ProductDetail {
  productId: string;
  title: string;
  barterTypeId: string;
  barterTypeName: string;
  barterTypeSlug: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryIconKey: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  subcategoryIconKey: string | null;
  brandId: string | null;
  brandName: string | null;
  brandLogoKey: string | null;
  model: string | null;
  imageKey: string | null;
  productInfo: Record<string, unknown> | null;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function CatalogAssetsPage() {
  // ---------------------------------------------------------------------------
  // STATE - Browse Mode
  // ---------------------------------------------------------------------------
  const [activeBarterType, setActiveBarterType] = useState<ProductType>("goods");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<"category" | "subcategory" | null>(null);
  
  // Fetch products for the active barter type
  const { data: products = [], isLoading, error, mutate } = useProducts({ barterType: activeBarterType });
  
  // ---------------------------------------------------------------------------
  // STATE - Create Product Modal
  // ---------------------------------------------------------------------------
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<"type" | "category" | "subcategory" | "brand" | "model">("type");
  const [createBarterType, setCreateBarterType] = useState<ProductType | null>(null);
  const [createCategory, setCreateCategory] = useState<{ id: string; name: string } | null>(null);
  const [createSubcategory, setCreateSubcategory] = useState<{ id: string; name: string } | null>(null);
  const [createBrand, setCreateBrand] = useState<string>("");
  const [createModel, setCreateModel] = useState<string>("");
  const [creating, setCreating] = useState(false);
  
  // ---------------------------------------------------------------------------
  // STATE - Product Detail View
  // ---------------------------------------------------------------------------
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);
  
  // Product info form
  const [productInfoFields, setProductInfoFields] = useState<OfferInfoFieldDefinition[]>([]);
  const [productInfoValues, setProductInfoValues] = useState<Record<string, string | string[]>>({});
  const [loadingFields, setLoadingFields] = useState(false);
  
  // Asset upload states
  const [uploadingCategory, setUploadingCategory] = useState(false);
  const [uploadingSubcategory, setUploadingSubcategory] = useState(false);
  const [uploadingBrand, setUploadingBrand] = useState(false);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  
  // Get categories for current barter type (for filtering)
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
  
  // Get categories for create modal
  const createCategories = useMemo(() => {
    if (!createBarterType) return [];
    return getProductTypeCategories(createBarterType);
  }, [createBarterType]);
  
  // Get subcategories for create modal
  const createSubcategories = useMemo(() => {
    if (!createBarterType || !createCategory) return [];
    const categoryDef = getCategoryByName(createBarterType, createCategory.name);
    return categoryDef?.subcategories || [];
  }, [createBarterType, createCategory]);
  
  // Get available brands for create modal
  const createBrands = useMemo(() => {
    return products
      .filter(p => {
        if (createBarterType && p.productType !== createBarterType) return false;
        if (createCategory && p.category !== createCategory.name) return false;
        if (createSubcategory && p.subcategory !== createSubcategory.name) return false;
        return p.brand;
      })
      .map(p => ({ id: p.brand!, name: p.brand!, imageUrl: undefined }))
      .filter((v, i, a) => a.findIndex(b => b.name === v.name) === i)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, createBarterType, createCategory, createSubcategory]);
  
  // Get available models for create modal
  const createModels = useMemo(() => {
    return products
      .filter(p => {
        if (createBarterType && p.productType !== createBarterType) return false;
        if (createCategory && p.category !== createCategory.name) return false;
        if (createSubcategory && p.subcategory !== createSubcategory.name) return false;
        if (createBrand && p.brand !== createBrand) return false;
        return p.title;
      })
      .map(p => ({ id: p.productId, name: p.title, imageUrl: p.imageUrl }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, createBarterType, createCategory, createSubcategory, createBrand]);
  
  // Reset filters when barter type changes
  useEffect(() => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setExpandedSection(null);
    setSelectedProductId(null);
    setProductDetail(null);
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
      if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(p.subcategory || "")) return false;
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
  // CREATE PRODUCT HANDLERS
  // ---------------------------------------------------------------------------
  const resetCreateModal = useCallback(() => {
    setCreateStep("type");
    setCreateBarterType(null);
    setCreateCategory(null);
    setCreateSubcategory(null);
    setCreateBrand("");
    setCreateModel("");
    setCreating(false);
  }, []);
  
  const handleCreateProduct = useCallback(async () => {
    if (!createBarterType || !createCategory || !createSubcategory || !createBrand || !createModel) {
      toast.error("Please complete all fields");
      return;
    }
    
    setCreating(true);
    try {
      // Find barter type ID
      const barterTypeResponse = await fetch("/api/data/barter-types");
      const barterTypeData = await barterTypeResponse.json();
      const barterType = barterTypeData.barterTypes?.find((bt: { slug: string }) => bt.slug === createBarterType);
      
      if (!barterType) {
        toast.error("Invalid barter type");
        return;
      }
      
      // Find category ID
      const categoriesResponse = await fetch("/api/data/categories");
      const categoriesData = await categoriesResponse.json();
      const category = categoriesData.categories?.find((c: { name: string }) => c.name === createCategory.name);
      
      // Find subcategory ID
      const subcategoriesResponse = await fetch(`/api/data/subcategories?categoryId=${category?.categoryId || ""}`);
      const subcategoriesData = await subcategoriesResponse.json();
      const subcategory = subcategoriesData.subcategories?.find((s: { name: string }) => s.name === createSubcategory.name);
      
      // Find brand ID
      const brandsResponse = await fetch("/api/data/brands");
      const brandsData = await brandsResponse.json();
      const brand = brandsData.brands?.find((b: { name: string }) => b.name === createBrand);
      
      // Create the product
      const response = await fetch("/api/data/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createModel,
          barterTypeId: barterType.barterTypeId,
          categoryId: category?.categoryId,
          subcategoryId: subcategory?.subcategoryId,
          brandId: brand?.brandId,
          model: createModel,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create product");
      }
      
      const data = await response.json();
      toast.success(`Product "${createModel}" created successfully`);
      
      // Refresh products list
      mutate();
      
      // Close modal and open detail view
      setShowCreateModal(false);
      resetCreateModal();
      setSelectedProductId(data.product.productId);
    } catch (error) {
      console.error("Create product error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create product");
    } finally {
      setCreating(false);
    }
  }, [createBarterType, createCategory, createSubcategory, createBrand, createModel, mutate, resetCreateModal]);

  // ---------------------------------------------------------------------------
  // PRODUCT DETAIL HANDLERS
  // ---------------------------------------------------------------------------
  const loadProductDetail = useCallback(async (productId: string) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/data/products/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const data = await response.json();
      setProductDetail(data.product);
      
      // Load existing product info values
      if (data.product.productInfo) {
        setProductInfoValues(data.product.productInfo);
      } else {
        setProductInfoValues({});
      }
      
      // Load field definitions for this subcategory
      if (data.product.subcategoryId) {
        setLoadingFields(true);
        try {
          const fieldsResponse = await fetch(`/api/data/subcategories/${data.product.subcategoryId}/fields?scope=product`);
          if (fieldsResponse.ok) {
            const fieldsData = await fieldsResponse.json();
            const fields = fieldsData.productFields || [];
            // Map to OfferInfoFieldDefinition format
            const mappedFields: OfferInfoFieldDefinition[] = fields.map((f: { fieldId: string; fieldLabel: string; fieldType: string; isRequired: boolean; options?: { optionValue: string }[] }) => ({
              fieldId: f.fieldId,
              fieldName: f.fieldLabel,
              fieldType: mapDbFieldType(f.fieldType),
              options: f.options?.map((o: { optionValue: string }) => o.optionValue),
              required: f.isRequired,
            }));
            setProductInfoFields(mappedFields);
          }
        } catch (error) {
          console.error("Failed to load product fields:", error);
        } finally {
          setLoadingFields(false);
        }
      }
    } catch (error) {
      console.error("Failed to load product detail:", error);
      toast.error("Failed to load product details");
    } finally {
      setLoadingDetail(false);
    }
  }, []);
  
  // Load product detail when selectedProductId changes
  useEffect(() => {
    if (selectedProductId) {
      loadProductDetail(selectedProductId);
    } else {
      setProductDetail(null);
      setProductInfoFields([]);
      setProductInfoValues({});
    }
  }, [selectedProductId, loadProductDetail]);
  
  // Map database field types to OfferInfoFieldType
  // Note: "number" is mapped to "text" since OfferInfoFieldType doesn't have a number type
  function mapDbFieldType(dbType: string): "text" | "date_select" | "single_select" | "multi_select" | "attachment" {
    switch (dbType) {
      case "text":
      case "textarea":
      case "number": // Map number to text input (handled specially in renderer)
        return "text";
      case "date":
        return "date_select";
      case "select":
        return "single_select";
      case "multiselect":
        return "multi_select";
      case "boolean":
        return "single_select";
      default:
        return "text";
    }
  }
  
  // Load product detail when selected
  useEffect(() => {
    if (selectedProductId) {
      loadProductDetail(selectedProductId);
    } else {
      setProductDetail(null);
      setProductInfoFields([]);
      setProductInfoValues({});
    }
  }, [selectedProductId, loadProductDetail]);
  
  // Upload asset handler
  const handleUploadAsset = useCallback(async (
    file: File,
    assetType: "product" | "category" | "subcategory" | "brand",
    entityId: string
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", assetType);
    formData.append("entityId", entityId);
    
    const response = await fetch("/api/backoffice/catalog-assets/upload", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed");
    }
    
    const data = await response.json();
    return data.fileKey;
  }, []);
  
  // Save product info
  const handleSaveProductInfo = useCallback(async () => {
    if (!productDetail) return;
    
    setSavingDetail(true);
    try {
      const response = await fetch(`/api/data/products/${productDetail.productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productInfo: productInfoValues,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to save product info");
      
      toast.success("Product info saved successfully");
      mutate();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save product info");
    } finally {
      setSavingDetail(false);
    }
  }, [productDetail, productInfoValues, mutate]);

  // ---------------------------------------------------------------------------
  // RENDER - Product Detail View
  // ---------------------------------------------------------------------------
  if (selectedProductId && productDetail) {
    const categoryIconUrl = productDetail.categoryIconKey 
      ? `${SUPABASE_STORAGE_URL}/${productDetail.categoryIconKey}`
      : null;
    const subcategoryIconUrl = productDetail.subcategoryIconKey
      ? `${SUPABASE_STORAGE_URL}/${productDetail.subcategoryIconKey}`
      : null;
    const brandLogoUrl = productDetail.brandLogoKey
      ? `${SUPABASE_STORAGE_URL}/${productDetail.brandLogoKey}`
      : null;
    const productImageUrl = productDetail.imageKey
      ? `${SUPABASE_STORAGE_URL}/${productDetail.imageKey}`
      : null;
    
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedProductId(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to products</span>
        </button>
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <ProductImageBox src={productImageUrl} alt={productDetail.title} size="lg" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">{productDetail.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {productDetail.categoryName} &rarr; {productDetail.subcategoryName} &rarr; {productDetail.brandName}
              </p>
              <span className={`inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[productDetail.barterTypeSlug as ProductType]?.bg || "bg-secondary"} ${TYPE_COLORS[productDetail.barterTypeSlug as ProductType]?.text || "text-foreground"}`}>
                {(() => {
                  const Icon = TYPE_ICONS[productDetail.barterTypeSlug as ProductType] || Package;
                  return <Icon className="h-3 w-3" />;
                })()}
                {productDetail.barterTypeName}
              </span>
            </div>
          </div>
        </div>
        
        {/* Assets Section */}
        <div className="border border-border rounded-xl bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Assets</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload images with white/transparent background for best results.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Category Icon */}
            {productDetail.categoryId && (
              <AssetUploadBox
                label="Category Icon"
                imageUrl={categoryIconUrl}
                uploading={uploadingCategory}
                entityType="category"
                onUpload={async (file) => {
                  setUploadingCategory(true);
                  try {
                    const fileKey = await handleUploadAsset(file, "category", productDetail.categoryId!);
                    if (fileKey) {
                      await fetch(`/api/data/categories/${productDetail.categoryId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ iconKey: fileKey }),
                      });
                      loadProductDetail(productDetail.productId);
                      toast.success("Category icon updated");
                    }
                  } catch (error) {
                    toast.error("Failed to upload category icon");
                  } finally {
                    setUploadingCategory(false);
                  }
                }}
              />
            )}
            
            {/* Subcategory Icon */}
            {productDetail.subcategoryId && (
              <AssetUploadBox
                label="Subcategory Icon"
                imageUrl={subcategoryIconUrl}
                uploading={uploadingSubcategory}
                entityType="subcategory"
                onUpload={async (file) => {
                  setUploadingSubcategory(true);
                  try {
                    const fileKey = await handleUploadAsset(file, "subcategory", productDetail.subcategoryId!);
                    if (fileKey) {
                      await fetch(`/api/data/subcategories/${productDetail.subcategoryId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ iconKey: fileKey }),
                      });
                      loadProductDetail(productDetail.productId);
                      toast.success("Subcategory icon updated");
                    }
                  } catch (error) {
                    toast.error("Failed to upload subcategory icon");
                  } finally {
                    setUploadingSubcategory(false);
                  }
                }}
              />
            )}
            
            {/* Brand Logo */}
            {productDetail.brandId && (
              <AssetUploadBox
                label="Brand Logo"
                imageUrl={brandLogoUrl}
                uploading={uploadingBrand}
                entityType="brand"
                onUpload={async (file) => {
                  setUploadingBrand(true);
                  try {
                    const fileKey = await handleUploadAsset(file, "brand", productDetail.brandId!);
                    if (fileKey) {
                      await fetch(`/api/data/brands/${productDetail.brandId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ logoKey: fileKey }),
                      });
                      loadProductDetail(productDetail.productId);
                      toast.success("Brand logo updated");
                    }
                  } catch (error) {
                    toast.error("Failed to upload brand logo");
                  } finally {
                    setUploadingBrand(false);
                  }
                }}
              />
            )}
            
            {/* Product Image */}
            <AssetUploadBox
              label="Product Image"
              imageUrl={productImageUrl}
              uploading={uploadingProduct}
              entityType="product"
              onUpload={async (file) => {
                setUploadingProduct(true);
                try {
                  const fileKey = await handleUploadAsset(file, "product", productDetail.productId);
                  if (fileKey) {
                    await fetch(`/api/data/products/${productDetail.productId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ imageKey: fileKey }),
                    });
                    loadProductDetail(productDetail.productId);
                    mutate();
                    toast.success("Product image updated");
                  }
                } catch (error) {
                  toast.error("Failed to upload product image");
                } finally {
                  setUploadingProduct(false);
                }
              }}
            />
          </div>
        </div>
        
        {/* Product Info Section */}
        <div className="border border-border rounded-xl bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Product Info</h2>
              <p className="text-sm text-muted-foreground">
                Specifications and details from Field Schema (product scope)
              </p>
            </div>
            <Button
              onClick={handleSaveProductInfo}
              disabled={savingDetail || productInfoFields.length === 0}
              className="gap-2"
            >
              {savingDetail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
          
          {loadingFields ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : productInfoFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No product fields defined for this subcategory.</p>
              <p className="text-xs mt-1">Add fields in Field Schema with scope &quot;Product&quot;.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productInfoFields.map((field) => (
                <div key={field.fieldId} className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {field.fieldName}
                    {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <DynamicFieldRenderer
                    field={field}
                    value={productInfoValues[field.fieldName]}
                    onChange={(value) => {
                      setProductInfoValues(prev => ({
                        ...prev,
                        [field.fieldName]: value,
                      }));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER - Browse Mode
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Catalog Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage product catalog data: images, icons, and field values
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Product
        </Button>
      </div>

      {/* Barter Type Tabs */}
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

      {/* Product Grid */}
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
          <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Create First Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {filteredProducts.map((product) => (
            <div
              key={product.productId}
              className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-colors hover:border-primary/30 w-full"
              onClick={() => setSelectedProductId(product.productId)}
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

      {/* Results count */}
      {!isLoading && !error && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filteredProducts.length} of {products.filter(p => p.productType === activeBarterType).length} products
        </p>
      )}

      {/* Create Product Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          resetCreateModal();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Barter Type */}
            <AccordionItem
              title="Barter Type"
              subtitle="Select the type of barter"
              value={createBarterType ? PRODUCT_TYPES.find(t => t.id === createBarterType)?.name : undefined}
              isOpen={createStep === "type"}
              isDisabled={false}
              onToggle={() => setCreateStep("type")}
              icon={createBarterType ? (() => { const Icon = TYPE_ICONS[createBarterType]; return <Icon className={`h-5 w-5 ${TYPE_COLORS[createBarterType].text}`} />; })() : undefined}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BARTER_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = createBarterType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setCreateBarterType(type.id);
                        setCreateCategory(null);
                        setCreateSubcategory(null);
                        setCreateBrand("");
                        setCreateModel("");
                        setCreateStep("category");
                      }}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? `${TYPE_COLORS[type.id].border} ${TYPE_COLORS[type.id].bg}` 
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <Icon className={`h-8 w-8 ${isSelected ? TYPE_COLORS[type.id].text : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${isSelected ? TYPE_COLORS[type.id].text : "text-foreground"}`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </AccordionItem>

            {/* Category */}
            <AccordionItem
              title="Category"
              subtitle="Select or create a category"
              value={createCategory?.name}
              isOpen={createStep === "category"}
              isDisabled={!createBarterType}
              onToggle={() => setCreateStep("category")}
            >
              <IconGridSelector
                items={createCategories.map(c => ({ id: c.id, name: c.name, icon: c.icon }))}
                selectedId={createCategory?.id || ""}
                onSelect={(id, name) => {
                  setCreateCategory({ id, name });
                  setCreateSubcategory(null);
                  setCreateBrand("");
                  setCreateModel("");
                  setCreateStep("subcategory");
                }}
                searchPlaceholder="Search categories..."
              />
            </AccordionItem>

            {/* Subcategory */}
            <AccordionItem
              title="Subcategory"
              subtitle="Select or create a subcategory"
              value={createSubcategory?.name}
              isOpen={createStep === "subcategory"}
              isDisabled={!createCategory}
              onToggle={() => setCreateStep("subcategory")}
            >
              <IconGridSelector
                items={createSubcategories.map(s => ({ id: s.id, name: s.name, icon: s.icon }))}
                selectedId={createSubcategory?.id || ""}
                onSelect={(id, name) => {
                  setCreateSubcategory({ id, name });
                  setCreateBrand("");
                  setCreateModel("");
                  setCreateStep("brand");
                }}
                searchPlaceholder="Search subcategories..."
              />
            </AccordionItem>

            {/* Brand */}
            <AccordionItem
              title="Brand"
              subtitle="Select or create a brand"
              value={createBrand}
              isOpen={createStep === "brand"}
              isDisabled={!createSubcategory}
              onToggle={() => setCreateStep("brand")}
            >
              <BrandModelSelector
                items={createBrands}
                selectedValue={createBrand}
                onSelect={(brand) => {
                  setCreateBrand(brand);
                  setCreateModel("");
                  setCreateStep("model");
                }}
                searchPlaceholder="Search or type new brand..."
                onCreate={(name) => {
                  setCreateBrand(name);
                  setCreateModel("");
                  setCreateStep("model");
                  toast.info(`New brand "${name}" will be created.`);
                }}
              />
            </AccordionItem>

            {/* Model */}
            <AccordionItem
              title="Model"
              subtitle="Create or select a model name"
              value={createModel}
              isOpen={createStep === "model"}
              isDisabled={!createBrand}
              onToggle={() => setCreateStep("model")}
            >
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={createModel}
                    onChange={(e) => setCreateModel(e.target.value)}
                    placeholder="Enter model name..."
                    className="w-full rounded-lg border border-input bg-secondary pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                
                {createModels.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto">
                    {createModels.filter(m => 
                      !createModel || m.name.toLowerCase().includes(createModel.toLowerCase())
                    ).map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setCreateModel(model.name)}
                        className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${
                          createModel === model.name
                            ? "bg-primary text-primary-foreground ring-2 ring-primary"
                            : "bg-secondary/50 hover:bg-secondary text-foreground"
                        }`}
                      >
                        <ProductImageBox src={model.imageUrl} alt={model.name} size="sm" />
                        <span className="text-sm font-medium truncate">{model.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </AccordionItem>

            {/* Create Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setShowCreateModal(false);
                resetCreateModal();
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateProduct}
                disabled={!createBarterType || !createCategory || !createSubcategory || !createBrand || !createModel || creating}
                className="gap-2"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Create Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
