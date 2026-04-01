"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { 
  X, ArrowLeft, Search, Plus, ChevronDown, ChevronRight, Check, 
  Package, Car, Home, ShoppingBag, Smartphone, Loader2,
  Camera, QrCode, MapPin, Sparkles
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
  type CategoryDefinition,
  type SubcategoryDefinition 
} from "@/lib/product-types";
import type { Product, OfferPickupAddress, OfferImage, OfferInfoFieldValue, ProductType } from "@/lib/types";
import { OfferInfoSection } from "./offer-info-section";
import { OfferCaptureQrModal } from "./offer-capture-qr-modal";
import { getProductInfo } from "@/lib/offer-info-fields";
import { useNavigationGuard } from "@/lib/navigation-guard";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";

// =============================================================================
// TYPES
// =============================================================================
type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialProductType?: ProductType;
};

type Step = 1 | 2 | 3 | 4;

type AccordionType = "barter-type" | "category" | "subcategory" | "brand" | "model" | null;

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
            <span className="text-sm text-primary font-medium truncate max-w-[120px]">{value}</span>
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
// SEARCHABLE LIST COMPONENT
// =============================================================================
function SearchableList({
  items,
  searchPlaceholder,
  selectedValue,
  onSelect,
  onCreate,
  createLabel,
  renderItem,
}: {
  items: { id: string; name: string; icon?: React.ReactNode }[];
  searchPlaceholder: string;
  selectedValue: string;
  onSelect: (id: string, name: string) => void;
  onCreate?: (name: string) => void;
  createLabel?: string;
  renderItem?: (item: { id: string; name: string; icon?: React.ReactNode }, isSelected: boolean) => React.ReactNode;
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
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-input bg-secondary pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Items grid */}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filteredItems.map((item) => {
          const isSelected = selectedValue === item.id || selectedValue === item.name;
          if (renderItem) {
            return (
              <div key={item.id} onClick={() => onSelect(item.id, item.name)}>
                {renderItem(item, isSelected)}
              </div>
            );
          }
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id, item.name)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary/50 hover:bg-secondary text-foreground"
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium flex-1">{item.name}</span>
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>

      {/* Create button */}
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

      {/* Empty state */}
      {filteredItems.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
      )}
    </div>
  );
}

// =============================================================================
// PROGRESS SIDEBAR COMPONENT
// =============================================================================
function ProgressSidebar({
  currentStep,
  selections,
  onStepClick,
  productId,
  showProductSpecs,
  onToggleSpecs,
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
  productId?: string;
  showProductSpecs: boolean;
  onToggleSpecs: () => void;
}) {
  const steps = [
    { number: 1, title: "Choose Product", completed: currentStep > 1 },
    { number: 2, title: "Add Images", completed: currentStep > 2 },
    { number: 3, title: "Offer Details", completed: currentStep > 3 },
    { number: 4, title: "Pickup Address", completed: currentStep > 4 },
  ];

  return (
    <div className="w-64 bg-card border-r border-border p-4 flex flex-col h-full overflow-y-auto">
      {/* Step indicators */}
      <div className="space-y-3 mb-6">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.completed;
          const isClickable = step.number < currentStep;
          
          return (
            <button
              key={step.number}
              onClick={() => isClickable && onStepClick(step.number as Step)}
              disabled={!isClickable}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                isActive 
                  ? "bg-primary/10 border border-primary/30" 
                  : isCompleted 
                    ? "bg-secondary/50 hover:bg-secondary cursor-pointer" 
                    : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : isCompleted 
                    ? "bg-green-500 text-white" 
                    : "bg-secondary text-muted-foreground"
              }`}>
                {isCompleted ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-border my-2" />

      {/* Selected values */}
      <div className="flex-1 space-y-3 mt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected</p>
        
        {selections.barterType && (
          <div className={`p-2 rounded-lg ${TYPE_COLORS[selections.barterType.id].bg}`}>
            <p className="text-xs text-muted-foreground">Barter Type</p>
            <p className={`text-sm font-medium ${TYPE_COLORS[selections.barterType.id].text}`}>
              {selections.barterType.name}
            </p>
          </div>
        )}

        {selections.category && (
          <div className="p-2 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="text-sm font-medium text-foreground">{selections.category.name}</p>
          </div>
        )}

        {selections.subcategory && (
          <div className="p-2 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground">Subcategory</p>
            <p className="text-sm font-medium text-foreground">{selections.subcategory.name}</p>
          </div>
        )}

        {selections.brand && (
          <div className="p-2 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground">Brand</p>
            <p className="text-sm font-medium text-foreground">{selections.brand}</p>
          </div>
        )}

        {selections.model && (
          <div className="p-2 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground">Model</p>
            <p className="text-sm font-medium text-foreground">{selections.model}</p>
          </div>
        )}

        {/* Product image thumbnail */}
        {selections.productImage && (
          <div className="p-2 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground mb-2">Product</p>
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-background">
              <img src={selections.productImage} alt="Product" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Offer title */}
        {selections.offerTitle && (
          <div className="p-2 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground">Offer Title</p>
            <p className="text-sm font-medium text-foreground truncate">{selections.offerTitle}</p>
          </div>
        )}

        {/* Offer image thumbnail */}
        {selections.offerImage && (
          <div className="p-2 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground mb-2">Main Image</p>
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-background">
              <img src={selections.offerImage} alt="Offer" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Product Specifications */}
        {productId && selections.model && (
          <ProductSpecsPanel
            productId={productId}
            subcategory={selections.subcategory?.name}
            isExpanded={showProductSpecs}
            onToggle={onToggleSpecs}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MOBILE PROGRESS INDICATOR
// =============================================================================
function MobileProgressIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
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
  );
}

// =============================================================================
// MOBILE DETECTION
// =============================================================================
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// =============================================================================
// PRODUCT SPECIFICATIONS PANEL
// =============================================================================
function ProductSpecsPanel({ 
  productId, 
  subcategory,
  isExpanded,
  onToggle 
}: { 
  productId?: string; 
  subcategory?: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const specs = productId ? getProductInfo(productId) : [];
  
  if (specs.length === 0) return null;
  
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-secondary/30">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-foreground">Product Specifications</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>
      {isExpanded && (
        <div className="border-t border-border p-3 space-y-2">
          {specs.map((spec, index) => (
            <div key={index} className="flex justify-between items-start text-xs">
              <span className="text-muted-foreground">{spec.fieldName}</span>
              <span className="text-foreground font-medium text-right max-w-[60%]">{spec.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function AddOfferFlow({ open, onClose, onSuccess, initialProductType }: Props) {
  const { auth, products, addProduct, addOffer, getBrands } = useBarterStore();
  const { registerBlocker, unregisterBlocker } = useNavigationGuard();
  const router = useRouter();
  const BLOCKER_ID = "offer-creation-flow";
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

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

  // Custom values (for creating new)
  const [customCategory, setCustomCategory] = useState<string>("");
  const [customSubcategory, setCustomSubcategory] = useState<string>("");
  const [customBrand, setCustomBrand] = useState<string>("");
  const [customModel, setCustomModel] = useState<string>("");

  // Product specs
  const [showProductSpecs, setShowProductSpecs] = useState(false);

  // Step 2: Images
  const [offerImages, setOfferImages] = useState<OfferImage[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);

  // Step 3: Offer details
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerInfo, setOfferInfo] = useState<OfferInfoFieldValue[]>([]);

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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      .map(p => p.brand!)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
  }, [products, selectedBarterType, selectedCategory, selectedSubcategory]);

  // Get unique models for selected brand
  const availableModels = useMemo(() => {
    return products
      .filter(p => {
        if (selectedBarterType && p.productType !== selectedBarterType) return false;
        if (selectedCategory && p.category !== selectedCategory.name) return false;
        if (selectedSubcategory && p.subcategory !== selectedSubcategory.name) return false;
        if (selectedBrand && p.brand !== selectedBrand) return false;
        return p.model;
      })
      .map(p => ({ model: p.model!, product: p }))
      .filter((v, i, a) => a.findIndex(x => x.model === v.model) === i)
      .sort((a, b) => a.model.localeCompare(b.model));
  }, [products, selectedBarterType, selectedCategory, selectedSubcategory, selectedBrand]);

  // Check if we have unsaved data
  const hasUnsavedData = useMemo(() => {
    return (
      selectedBarterType !== null ||
      offerTitle.trim() !== "" ||
      offerDescription.trim() !== "" ||
      offerImages.length > 0
    );
  }, [selectedBarterType, offerTitle, offerDescription, offerImages]);

  // Register blocker when we have unsaved data
  useEffect(() => {
    if (open && hasUnsavedData) {
      registerBlocker({
        id: BLOCKER_ID,
        type: "offer-creation",
        message: "You have unsaved offer data. Your progress will be lost if you leave now.",
      });
    } else {
      unregisterBlocker(BLOCKER_ID);
    }
    return () => unregisterBlocker(BLOCKER_ID);
  }, [open, hasUnsavedData, registerBlocker, unregisterBlocker]);

  // Reset when modal opens
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (!prevOpenRef.current && open) {
      resetAll();
    }
    prevOpenRef.current = open;
  }, [open]);

  // Populate address from profile when checkbox is checked
  useEffect(() => {
    if (sameAsProfile && auth.user?.profileAddress) {
      const addr = auth.user.profileAddress;
      setPickupCountry(addr.country || "");
      setPickupCity(addr.city || "");
      setPickupState(addr.state || "");
      setPickupZip(addr.zip || "");
      setPickupAddressLine1(addr.addressLine1 || "");
      setPickupAddressLine2(addr.addressLine2 || "");
    }
  }, [sameAsProfile, auth.user?.profileAddress]);

  function resetAll() {
    setCurrentStep(1);
    setOpenAccordion("barter-type");
    setSelectedBarterType(initialProductType || null);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedProduct(null);
    setCustomCategory("");
    setCustomSubcategory("");
    setCustomBrand("");
    setCustomModel("");
    setOfferImages([]);
    setOfferTitle("");
    setOfferDescription("");
    setOfferInfo([]);
    setSameAsProfile(false);
    setPickupCountry("");
    setPickupCity("");
    setPickupState("");
    setPickupZip("");
    setPickupAddressLine1("");
    setPickupAddressLine2("");
    setErrors({});
    
    if (initialProductType) {
      setOpenAccordion("category");
    }
  }

  function handleClose() {
    if (hasUnsavedData) {
      // Could show confirmation dialog here
      if (!window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        return;
      }
    }
    unregisterBlocker(BLOCKER_ID);
    resetAll();
    onClose();
  }

  // Step 1 handlers
  function handleSelectBarterType(type: ProductType) {
    setSelectedBarterType(type);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedProduct(null);
    setOpenAccordion("category");
  }

  function handleSelectCategory(id: string, name: string) {
    setSelectedCategory({ id, name });
    setSelectedSubcategory(null);
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedProduct(null);
    setOpenAccordion("subcategory");
  }

  function handleCreateCategory(name: string) {
    setCustomCategory(name);
    setSelectedCategory({ id: name.toLowerCase().replace(/\s+/g, "-"), name });
    setSelectedSubcategory(null);
    setOpenAccordion("subcategory");
  }

  function handleSelectSubcategory(id: string, name: string) {
    setSelectedSubcategory({ id, name });
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedProduct(null);
    // For home-spaces, skip brand/model
    if (selectedBarterType === "home-spaces") {
      setOpenAccordion(null);
    } else {
      setOpenAccordion("brand");
    }
  }

  function handleCreateSubcategory(name: string) {
    setCustomSubcategory(name);
    setSelectedSubcategory({ id: name.toLowerCase().replace(/\s+/g, "-"), name });
    if (selectedBarterType === "home-spaces") {
      setOpenAccordion(null);
    } else {
      setOpenAccordion("brand");
    }
  }

  function handleSelectBrand(brand: string) {
    setSelectedBrand(brand);
    setSelectedModel("");
    setSelectedProduct(null);
    setOpenAccordion("model");
  }

  function handleCreateBrand(name: string) {
    setCustomBrand(name);
    setSelectedBrand(name);
    setOpenAccordion("model");
  }

  function handleSelectModel(model: string, product?: Product) {
    setSelectedModel(model);
    if (product) {
      setSelectedProduct(product);
    }
    setOpenAccordion(null);
  }

  function handleCreateModel(name: string) {
    setCustomModel(name);
    setSelectedModel(name);
    // Create a new product for custom model
    const newProduct: Product = {
      productId: generateGuid(),
      productType: selectedBarterType!,
      title: `${selectedBrand} ${name}`,
      category: selectedCategory!.name,
      subcategory: selectedSubcategory?.name,
      brand: selectedBrand,
      model: name,
      imageUrl: "",
      offerCount: 0,
    };
    addProduct(newProduct);
    setSelectedProduct(newProduct);
    setOpenAccordion(null);
  }

  // Check if Step 1 is complete
  const isStep1Complete = useMemo(() => {
    if (!selectedBarterType || !selectedCategory) return false;
    if (selectedBarterType === "home-spaces") {
      return !!selectedSubcategory;
    }
    return !!selectedSubcategory && !!selectedBrand && !!selectedModel;
  }, [selectedBarterType, selectedCategory, selectedSubcategory, selectedBrand, selectedModel]);

  function handleContinueToStep2() {
    if (!isStep1Complete) return;
    
    // If no product selected yet, create one
    if (!selectedProduct && selectedBarterType !== "home-spaces") {
      const existingProduct = products.find(p => 
        p.productType === selectedBarterType &&
        p.category === selectedCategory?.name &&
        p.subcategory === selectedSubcategory?.name &&
        p.brand === selectedBrand &&
        p.model === selectedModel
      );
      
      if (existingProduct) {
        setSelectedProduct(existingProduct);
      } else {
        const newProduct: Product = {
          productId: generateGuid(),
          productType: selectedBarterType!,
          title: `${selectedBrand} ${selectedModel}`,
          category: selectedCategory!.name,
          subcategory: selectedSubcategory?.name,
          brand: selectedBrand,
          model: selectedModel,
          imageUrl: "",
          offerCount: 0,
        };
        addProduct(newProduct);
        setSelectedProduct(newProduct);
      }
    } else if (!selectedProduct && selectedBarterType === "home-spaces") {
      const newProduct: Product = {
        productId: generateGuid(),
        productType: selectedBarterType,
        title: `${selectedCategory?.name} - ${selectedSubcategory?.name}`,
        category: selectedCategory!.name,
        subcategory: selectedSubcategory?.name,
        imageUrl: "",
        offerCount: 0,
      };
      addProduct(newProduct);
      setSelectedProduct(newProduct);
    }
    
    setCurrentStep(2);
  }

  // Check if Step 2 is complete (images optional but UI shows progress)
  const isStep2Complete = offerImages.length > 0;

  function handleContinueToStep3() {
    setCurrentStep(3);
  }

  // Check if Step 3 is complete
  const isStep3Complete = offerTitle.trim() !== "" && offerDescription.trim() !== "";

  function handleContinueToStep4() {
    if (!isStep3Complete) {
      setErrors({ offerTitle: !offerTitle.trim() ? "Title is required" : "", offerDescription: !offerDescription.trim() ? "Description is required" : "" });
      return;
    }
    setCurrentStep(4);
  }

  // Check if Step 4 is complete
  const isStep4Complete = useMemo(() => {
    return (
      pickupCountry !== "" &&
      pickupCity !== "" &&
      pickupState.trim() !== "" &&
      pickupZip.trim() !== "" &&
      pickupAddressLine1.trim() !== ""
    );
  }, [pickupCountry, pickupCity, pickupState, pickupZip, pickupAddressLine1]);

  async function handleCreateOffer() {
    if (!isStep4Complete || !selectedProduct) {
      setErrors({
        pickupState: !pickupState.trim() ? "State is required" : "",
        pickupZip: !pickupZip.trim() ? "Zip/Postal code is required" : "",
        pickupAddressLine1: !pickupAddressLine1.trim() ? "Address is required" : "",
      });
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 500));

    const pickupAddress: OfferPickupAddress = {
      country: pickupCountry,
      city: pickupCity,
      state: pickupState.trim(),
      zip: pickupZip.trim(),
      addressLine1: pickupAddressLine1.trim(),
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

    unregisterBlocker(BLOCKER_ID);
    setLoading(false);

    // Fire confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f59e0b", "#fbbf24", "#fcd34d"],
    });

    toast.success("Your offer has been created! Start hooking up to 3 offers you want in return.", {
      duration: 5000,
    });
    
    resetAll();
    onClose();
    // Call onSuccess after close to trigger navigation to My Offers
    setTimeout(() => {
      onSuccess?.();
    }, 100);
  }

  if (!open) return null;

  const stepTitles: Record<Step, string> = {
    1: "Choose Product",
    2: "Add Images",
    3: "Offer Details",
    4: "Pickup Address",
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      {/* Desktop Progress Sidebar */}
      <div className="hidden lg:block">
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
  onStepClick={setCurrentStep}
  productId={selectedProduct?.productId}
  showProductSpecs={showProductSpecs}
  onToggleSpecs={() => setShowProductSpecs(!showProductSpecs)}
/>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((currentStep - 1) as Step)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Step {currentStep} of 4</p>
              <h2 className="text-lg font-semibold text-foreground">{stepTitles[currentStep]}</h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Progress Indicator */}
        <div className="lg:hidden border-b border-border">
          <MobileProgressIndicator currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* STEP 1: Product Selection */}
          {currentStep === 1 && (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Barter Type Accordion */}
              <AccordionItem
                title="Barter Type"
                subtitle="Select the type of exchange"
                value={selectedBarterType ? PRODUCT_TYPES.find(t => t.id === selectedBarterType)?.name : undefined}
                isOpen={openAccordion === "barter-type"}
                isDisabled={false}
                onToggle={() => setOpenAccordion(openAccordion === "barter-type" ? null : "barter-type")}
                icon={<Package className="h-5 w-5 text-primary" />}
              >
                <div className="grid grid-cols-1 gap-2">
                  {PRODUCT_TYPES.map((type) => {
                    const IconComponent = TYPE_ICONS[type.id];
                    const colors = TYPE_COLORS[type.id];
                    const isSelected = selectedBarterType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelectBarterType(type.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          isSelected 
                            ? `${colors.border} ${colors.bg}` 
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
                          <IconComponent className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <div className="text-left flex-1">
                          <p className={`text-sm font-semibold ${isSelected ? colors.text : "text-foreground"}`}>{type.name}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                        {isSelected && <Check className={`h-5 w-5 ${colors.text}`} />}
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
                <SearchableList
                  items={categories.map(c => ({ id: c.id, name: c.name }))}
                  searchPlaceholder="Search or create category..."
                  selectedValue={selectedCategory?.id || ""}
                  onSelect={handleSelectCategory}
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
                <SearchableList
                  items={subcategories.map(s => ({ id: s.id, name: s.name }))}
                  searchPlaceholder="Search or create subcategory..."
                  selectedValue={selectedSubcategory?.id || ""}
                  onSelect={handleSelectSubcategory}
                  onCreate={handleCreateSubcategory}
                  createLabel={customCategory ? "Create subcategory" : "Create new subcategory"}
                />
              </AccordionItem>

              {/* Brand Accordion - only for non-home-spaces */}
              {selectedBarterType !== "home-spaces" && (
                <AccordionItem
                  title="Brand"
                  subtitle="Select or enter brand name"
                  value={selectedBrand}
                  isOpen={openAccordion === "brand"}
                  isDisabled={!selectedSubcategory}
                  onToggle={() => setOpenAccordion(openAccordion === "brand" ? null : "brand")}
                >
                  <SearchableList
                    items={availableBrands.map(b => ({ id: b, name: b }))}
                    searchPlaceholder="Search or enter brand..."
                    selectedValue={selectedBrand}
                    onSelect={(_, name) => handleSelectBrand(name)}
                    onCreate={handleCreateBrand}
                    createLabel="Add new brand"
                  />
                </AccordionItem>
              )}

              {/* Model Accordion - only for non-home-spaces */}
              {selectedBarterType !== "home-spaces" && (
                <AccordionItem
                  title="Model"
                  subtitle="Select or enter model name"
                  value={selectedModel}
                  isOpen={openAccordion === "model"}
                  isDisabled={!selectedBrand}
                  onToggle={() => setOpenAccordion(openAccordion === "model" ? null : "model")}
                >
                  <SearchableList
                    items={availableModels.map(m => ({ id: m.model, name: m.model }))}
                    searchPlaceholder="Search or enter model..."
                    selectedValue={selectedModel}
                    onSelect={(_, name) => {
                      const found = availableModels.find(m => m.model === name);
                      handleSelectModel(name, found?.product);
                    }}
                    onCreate={handleCreateModel}
                    createLabel="Add new model"
                  />
                </AccordionItem>
              )}

              {/* Continue Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleContinueToStep2}
                  disabled={!isStep1Complete}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  Continue to Images
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Images */}
          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Product Card Preview */}
              {selectedProduct && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                      {selectedProduct.imageUrl ? (
                        <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{selectedProduct.title}</h3>
                      <p className="text-sm text-muted-foreground">{selectedProduct.category}</p>
                      {selectedProduct.subcategory && (
                        <p className="text-xs text-muted-foreground">{selectedProduct.subcategory}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Image Grid - 2x3 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  Offer Photos <span className="text-muted-foreground font-normal">({offerImages.length}/6)</span>
                </label>
                
                <div className="flex gap-4">
                  {/* Main portrait image */}
                  <div className="flex-shrink-0">
                    <div 
                      className="w-[140px] h-[180px] lg:w-[180px] lg:h-[220px] rounded-xl border-2 border-dashed border-border bg-secondary flex items-center justify-center overflow-hidden"
                    >
                      {offerImages[0] ? (
                        <img src={offerImages[0].url} alt="Main" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Camera className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Main Image</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2x3 thumbnail grid */}
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    {Array.from({ length: 6 }).map((_, index) => {
                      const image = offerImages[index];
                      return (
                        <div
                          key={index}
                          className="aspect-square rounded-lg border-2 border-dashed border-border bg-secondary flex items-center justify-center overflow-hidden"
                        >
                          {image ? (
                            <img src={image.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary text-lg font-light">+</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Capture buttons - Mobile or Desktop */}
                {offerImages.length < 6 && (
                  <>
                    {isMobile ? (
                      <MobileCameraCapture 
                        images={offerImages} 
                        onImagesChange={setOfferImages}
                        maxImages={6}
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowQrModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-input bg-background text-foreground hover:bg-secondary transition-colors"
                        >
                          <QrCode className="h-5 w-5" />
                          <span className="font-medium">Capture Images from Phone</span>
                        </button>
                        <p className="text-xs text-muted-foreground text-center">
                          Scan QR code to capture images from your phone
                        </p>
                      </>
                    )}
                  </>
                )}

                {/* Delete buttons for existing images */}
                {offerImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {offerImages.map((img, index) => (
                      <button
                        key={img.imageId}
                        type="button"
                        onClick={() => {
                          setOfferImages(offerImages.filter(i => i.imageId !== img.imageId));
                        }}
                        className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                      >
                        Remove image {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleContinueToStep3}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Continue to Details
                </button>
                {offerImages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    You can add images later
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Offer Details */}
          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Offer Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder={getOfferTitlePlaceholder(selectedProduct?.subcategory || "default")}
                  className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.offerTitle && <p className="text-xs text-destructive">{errors.offerTitle}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  placeholder={getOfferDescPlaceholder(selectedProduct?.subcategory || "default")}
                  rows={5}
                  className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                {errors.offerDescription && <p className="text-xs text-destructive">{errors.offerDescription}</p>}
              </div>

              {/* Offer Info Fields (Optional) */}
              {selectedProduct?.subcategory && (
                <OfferInfoSection
                  subcategory={selectedProduct.subcategory}
                  values={offerInfo}
                  onChange={setOfferInfo}
                />
              )}

              {/* Continue Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleContinueToStep4}
                  disabled={!isStep3Complete}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  Continue to Address
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Pickup Address */}
          {currentStep === 4 && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Same as profile checkbox */}
              <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer hover:bg-secondary/50 transition-colors">
                <input
                  type="checkbox"
                  checked={sameAsProfile}
                  onChange={(e) => setSameAsProfile(e.target.checked)}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Same as registered address</p>
                  <p className="text-xs text-muted-foreground">Use your profile address for pickup</p>
                </div>
              </label>

              {/* Country */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Country <span className="text-destructive">*</span>
                </label>
                <select
                  value={pickupCountry}
                  onChange={(e) => {
                    setPickupCountry(e.target.value);
                    setPickupCity("");
                  }}
                  className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select country</option>
                  {countryNames.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  City <span className="text-destructive">*</span>
                </label>
                <select
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  disabled={!pickupCountry}
                  className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                >
                  <option value="">Select city</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  State/Province <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={pickupState}
                  onChange={(e) => setPickupState(e.target.value)}
                  placeholder="Enter state or province"
                  className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.pickupState && <p className="text-xs text-destructive">{errors.pickupState}</p>}
              </div>

              {/* Zip */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Zip/Postal Code <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={pickupZip}
                  onChange={(e) => setPickupZip(e.target.value)}
                  placeholder="Enter zip or postal code"
                  className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.pickupZip && <p className="text-xs text-destructive">{errors.pickupZip}</p>}
              </div>

              {/* Address Line 1 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Address Line 1 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={pickupAddressLine1}
                  onChange={(e) => setPickupAddressLine1(e.target.value)}
                  placeholder="Street address"
                  className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.pickupAddressLine1 && <p className="text-xs text-destructive">{errors.pickupAddressLine1}</p>}
              </div>

              {/* Address Line 2 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Address Line 2 <span className="text-muted-foreground">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={pickupAddressLine2}
                  onChange={(e) => setPickupAddressLine2(e.target.value)}
                  placeholder="Apartment, suite, unit, etc."
                  className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Create Offer Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleCreateOffer}
                  disabled={!isStep4Complete || loading}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Create Offer
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal for desktop - image capture from phone */}
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
    </div>
  );
}

// =============================================================================
// MOBILE CAMERA CAPTURE COMPONENT
// =============================================================================
function MobileCameraCapture({
  images,
  onImagesChange,
  maxImages,
}: {
  images: OfferImage[];
  onImagesChange: (images: OfferImage[]) => void;
  maxImages: number;
}) {
  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl && images.length < maxImages) {
        const newImage: OfferImage = {
          imageId: generateGuid(),
          url: dataUrl,
          order: images.length,
          uploadedAt: new Date(),
        };
        onImagesChange([...images, newImage]);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  if (images.length >= maxImages) return null;

  return (
    <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-input bg-background text-foreground hover:bg-secondary transition-colors cursor-pointer">
      <Camera className="h-5 w-5" />
      <span className="font-medium">Capture Image</span>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />
    </label>
  );
}
