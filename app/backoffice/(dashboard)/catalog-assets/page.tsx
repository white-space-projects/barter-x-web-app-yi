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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function getIconComponent(iconName: string | null): React.ComponentType<{ className?: string }> {
  if (!iconName) return Package;
  return ICON_MAP[iconName] || Package;
}

function getImageUrl(imageKey: string | null): string | null {
  if (!imageKey) return null;
  if (imageKey.startsWith("http")) return imageKey;
  return `${SUPABASE_STORAGE_URL}/${imageKey}`;
}

// =============================================================================
// TYPES
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

interface FieldDefinition {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  placeholder: string | null;
  isRequired: boolean;
  dateMode: string | null;
  options: Array<{ optionId: string; optionLabel: string; optionValue: string }>;
}

// =============================================================================
// DYNAMIC FIELD RENDERER COMPONENT
// =============================================================================
function DynamicFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: OfferInfoFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
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
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      
    case "multi_select":
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const isSelected = selectedValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onChange(selectedValues.filter((v: string) => v !== opt.value));
                    } else {
                      onChange([...selectedValues, opt.value]);
                    }
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
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
// MAIN COMPONENT
// =============================================================================
export default function CatalogAssetsPage() {
  // ---------------------------------------------------------------------------
  // STATE - Product List View
  // ---------------------------------------------------------------------------
  const [activeBarterType, setActiveBarterType] = useState<ProductType>("goods");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // ---------------------------------------------------------------------------
  // STATE - Product Detail View
  // ---------------------------------------------------------------------------
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  
  // Product info fields from schema
  const [productInfoFields, setProductInfoFields] = useState<OfferInfoFieldDefinition[]>([]);
  const [productInfoValues, setProductInfoValues] = useState<Record<string, unknown>>({});
  
  // Image upload states
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const productImageRef = useRef<HTMLInputElement>(null);
  const categoryIconRef = useRef<HTMLInputElement>(null);
  const subcategoryIconRef = useRef<HTMLInputElement>(null);
  const brandLogoRef = useRef<HTMLInputElement>(null);
  
  // ---------------------------------------------------------------------------
  // STATE - Create Product Dialog
  // ---------------------------------------------------------------------------
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductTitle, setNewProductTitle] = useState("");
  const [newProductBarterType, setNewProductBarterType] = useState<ProductType>("goods");
  const [newProductCategory, setNewProductCategory] = useState<string>("");
  const [newProductSubcategory, setNewProductSubcategory] = useState<string>("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newProductModel, setNewProductModel] = useState("");
  
  // Categories and brands for create dialog
  const [allCategories, setAllCategories] = useState<Array<{ categoryId: string; slug: string; name: string; barterTypeSlug: string }>>([]);
  const [allSubcategories, setAllSubcategories] = useState<Array<{ subcategoryId: string; slug: string; name: string; categoryId: string }>>([]);
  const [allBrands, setAllBrands] = useState<Array<{ brandId: string; slug: string; name: string }>>([]);
  
  // ---------------------------------------------------------------------------
  // DATA FETCHING - Products
  // ---------------------------------------------------------------------------
  const { products, loading: loadingProducts, mutate: refreshProducts } = useProducts({
    barterType: activeBarterType,
  });
  
  // ---------------------------------------------------------------------------
  // DATA FETCHING - Categories, Subcategories, Brands
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch("/api/data/categories"),
          fetch("/api/data/brands"),
        ]);
        
        if (catRes.ok) {
          const catData = await catRes.json();
          setAllCategories(catData.categories || []);
          setAllSubcategories(catData.subcategories || []);
        }
        
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          setAllBrands(brandData.brands || []);
        }
      } catch (error) {
        console.error("Failed to load reference data:", error);
      }
    }
    loadReferenceData();
  }, []);
  
  // ---------------------------------------------------------------------------
  // DERIVED DATA - Categories for current barter type
  // ---------------------------------------------------------------------------
  const categories = useMemo(() => {
    return getProductTypeCategories(activeBarterType);
  }, [activeBarterType]);
  
  const selectedCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    return getCategoryByName(activeBarterType, selectedCategorySlug);
  }, [activeBarterType, selectedCategorySlug]);
  
  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((p) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          p.title.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          p.model?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.subcategory?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (selectedCategorySlug && p.categorySlug !== selectedCategorySlug) {
        return false;
      }
      
      // Subcategory filter
      if (selectedSubcategorySlug && p.subcategorySlug !== selectedSubcategorySlug) {
        return false;
      }
      
      return true;
    });
  }, [products, searchQuery, selectedCategorySlug, selectedSubcategorySlug]);
  
  // ---------------------------------------------------------------------------
  // PRODUCT DETAIL - Load product when selected
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedProductId) {
      setProductDetail(null);
      setProductInfoFields([]);
      setProductInfoValues({});
      return;
    }
    
    async function loadProduct() {
      setLoadingDetail(true);
      try {
        const response = await fetch(`/api/data/products/${selectedProductId}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load product");
        }
        
        const data = await response.json();
        setProductDetail(data.product);
        
        // Initialize product info values from existing data
        if (data.product?.productInfo) {
          setProductInfoValues(data.product.productInfo);
        } else {
          setProductInfoValues({});
        }
        
        // Load field schema for this subcategory (product scope)
        if (data.product?.subcategoryId) {
          const fieldsRes = await fetch(`/api/data/subcategories/${data.product.subcategoryId}/fields?scope=product`);
          if (fieldsRes.ok) {
            const fieldsData = await fieldsRes.json();
            // Map to OfferInfoFieldDefinition format
            const mappedFields: OfferInfoFieldDefinition[] = (fieldsData.fields || []).map((f: FieldDefinition) => ({
              fieldId: f.fieldId,
              fieldName: f.fieldLabel,
              fieldType: mapDbFieldType(f.fieldType),
              options: f.options?.map(o => ({ label: o.optionLabel, value: o.optionValue })) || [],
              isRequired: f.isRequired,
            }));
            setProductInfoFields(mappedFields);
          }
        } else {
          setProductInfoFields([]);
        }
      } catch (error) {
        console.error("Failed to load product:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load product");
        setProductDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    }
    
    loadProduct();
  }, [selectedProductId]);
  
  // Map database field types to OfferInfoFieldType
  function mapDbFieldType(dbType: string): "text" | "date_select" | "single_select" | "multi_select" | "attachment" {
    switch (dbType) {
      case "text":
      case "textarea":
      case "number":
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
  
  // ---------------------------------------------------------------------------
  // HANDLERS - Create Product
  // ---------------------------------------------------------------------------
  const handleCreateProduct = async () => {
    if (!newProductTitle.trim()) {
      toast.error("Product title is required");
      return;
    }
    
    // Get IDs from slugs
    const barterType = PRODUCT_TYPES.find(t => t.id === newProductBarterType);
    if (!barterType) {
      toast.error("Invalid barter type");
      return;
    }
    
    const category = allCategories.find(c => c.slug === newProductCategory);
    const subcategory = allSubcategories.find(s => s.slug === newProductSubcategory);
    const brand = allBrands.find(b => b.slug === newProductBrand);
    
    setCreatingProduct(true);
    try {
      const response = await fetch("/api/data/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProductTitle.trim(),
          barterTypeId: barterType.dbId,
          categoryId: category?.categoryId || null,
          subcategoryId: subcategory?.subcategoryId || null,
          brandId: brand?.brandId || null,
          model: newProductModel.trim() || null,
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create product");
      }
      
      const data = await response.json();
      toast.success("Product created successfully");
      
      // Reset form and close dialog
      setNewProductTitle("");
      setNewProductBarterType("goods");
      setNewProductCategory("");
      setNewProductSubcategory("");
      setNewProductBrand("");
      setNewProductModel("");
      setShowCreateDialog(false);
      
      // Refresh products list and open the new product
      await refreshProducts();
      setSelectedProductId(data.product.productId);
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create product");
    } finally {
      setCreatingProduct(false);
    }
  };
  
  // ---------------------------------------------------------------------------
  // HANDLERS - Save Product Info
  // ---------------------------------------------------------------------------
  const handleSaveProductInfo = async () => {
    if (!productDetail) return;
    
    setSavingProduct(true);
    try {
      const response = await fetch(`/api/data/products/${productDetail.productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productInfo: productInfoValues,
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save");
      }
      
      toast.success("Product info saved");
      await refreshProducts();
    } catch (error) {
      console.error("Failed to save product info:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSavingProduct(false);
    }
  };
  
  // ---------------------------------------------------------------------------
  // HANDLERS - Image Uploads
  // ---------------------------------------------------------------------------
  const handleImageUpload = async (
    file: File,
    type: "product" | "category" | "subcategory" | "brand",
    entityId: string
  ) => {
    setUploadingImage(type);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("entityId", entityId);
      
      const response = await fetch("/api/backoffice/catalog-assets/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Upload failed");
      }
      
      const data = await response.json();
      toast.success("Image uploaded successfully");
      
      // Refresh product detail to show new image
      if (selectedProductId) {
        const refreshRes = await fetch(`/api/data/products/${selectedProductId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setProductDetail(refreshData.product);
        }
      }
      
      await refreshProducts();
      return data.imageKey;
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
      return null;
    } finally {
      setUploadingImage(null);
    }
  };
  
  // ---------------------------------------------------------------------------
  // RENDER - Product Detail View (Loading)
  // ---------------------------------------------------------------------------
  if (selectedProductId && loadingDetail) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProductId(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to products</span>
        </button>
        
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER - Product Detail View (Error)
  // ---------------------------------------------------------------------------
  if (selectedProductId && !loadingDetail && !productDetail) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProductId(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to products</span>
        </button>
        
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Failed to load product details</p>
          <Button variant="outline" onClick={() => {
            // Re-trigger the useEffect by resetting and re-setting the ID
            const id = selectedProductId;
            setSelectedProductId(null);
            setTimeout(() => setSelectedProductId(id), 100);
          }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER - Product Detail View (Success)
  // ---------------------------------------------------------------------------
  if (selectedProductId && productDetail) {
    const CategoryIcon = getIconComponent(productDetail.categoryIconKey);
    const SubcategoryIcon = getIconComponent(productDetail.subcategoryIconKey);
    
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
        
        {/* Product Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{productDetail.title}</h1>
            <p className="text-muted-foreground">
              {productDetail.barterTypeName} &bull; {productDetail.categoryName || "No category"} &bull; {productDetail.subcategoryName || "No subcategory"}
            </p>
          </div>
          <Button onClick={handleSaveProductInfo} disabled={savingProduct}>
            {savingProduct ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - Assets */}
          <div className="space-y-6">
            {/* Product Image */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Product Image
              </h3>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                {productDetail.imageKey ? (
                  <img
                    src={getImageUrl(productDetail.imageKey) || ""}
                    alt={productDetail.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={productImageRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && productDetail) {
                    handleImageUpload(file, "product", productDetail.productId);
                  }
                }}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => productImageRef.current?.click()}
                disabled={uploadingImage === "product"}
              >
                {uploadingImage === "product" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {productDetail.imageKey ? "Replace Image" : "Upload Image"}
              </Button>
            </div>
            
            {/* Category Icon */}
            {productDetail.categoryId && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Category Icon: {productDetail.categoryName}</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    {productDetail.categoryIconKey ? (
                      <img
                        src={getImageUrl(productDetail.categoryIconKey) || ""}
                        alt={productDetail.categoryName || ""}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <CategoryIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={categoryIconRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && productDetail.categoryId) {
                        handleImageUpload(file, "category", productDetail.categoryId);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => categoryIconRef.current?.click()}
                    disabled={uploadingImage === "category"}
                  >
                    {uploadingImage === "category" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {productDetail.categoryIconKey ? "Replace" : "Upload"}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Subcategory Icon */}
            {productDetail.subcategoryId && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Subcategory Icon: {productDetail.subcategoryName}</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    {productDetail.subcategoryIconKey ? (
                      <img
                        src={getImageUrl(productDetail.subcategoryIconKey) || ""}
                        alt={productDetail.subcategoryName || ""}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <SubcategoryIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={subcategoryIconRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && productDetail.subcategoryId) {
                        handleImageUpload(file, "subcategory", productDetail.subcategoryId);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => subcategoryIconRef.current?.click()}
                    disabled={uploadingImage === "subcategory"}
                  >
                    {uploadingImage === "subcategory" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {productDetail.subcategoryIconKey ? "Replace" : "Upload"}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Brand Logo */}
            {productDetail.brandId && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Brand Logo: {productDetail.brandName}</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    {productDetail.brandLogoKey ? (
                      <img
                        src={getImageUrl(productDetail.brandLogoKey) || ""}
                        alt={productDetail.brandName || ""}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <Briefcase className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={brandLogoRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && productDetail.brandId) {
                        handleImageUpload(file, "brand", productDetail.brandId);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => brandLogoRef.current?.click()}
                    disabled={uploadingImage === "brand"}
                  >
                    {uploadingImage === "brand" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {productDetail.brandLogoKey ? "Replace" : "Upload"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* RIGHT COLUMN - Product Info Fields */}
          <div className="space-y-6">
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Product Information</h3>
              
              {/* Basic Info */}
              <div className="space-y-3 pb-4 border-b">
                <div>
                  <Label className="text-xs text-muted-foreground">Brand</Label>
                  <p className="font-medium">{productDetail.brandName || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Model</Label>
                  <p className="font-medium">{productDetail.model || "Not set"}</p>
                </div>
              </div>
              
              {/* Dynamic Fields from Schema */}
              {productInfoFields.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Custom fields for {productDetail.subcategoryName}:
                  </p>
                  {productInfoFields.map((field) => (
                    <div key={field.fieldId} className="space-y-1.5">
                      <Label>
                        {field.fieldName}
                        {field.isRequired && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <DynamicFieldRenderer
                        field={field}
                        value={productInfoValues[field.fieldId]}
                        onChange={(value) => {
                          setProductInfoValues(prev => ({
                            ...prev,
                            [field.fieldId]: value,
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No custom fields defined for this subcategory.
                  <br />
                  <span className="text-xs">Add fields in Field Schema (product scope) to see them here.</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER - Product List View
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Catalog Assets</h1>
          <p className="text-muted-foreground">
            Manage product images, icons, logos, and information
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>
      
      {/* Barter Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PRODUCT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setActiveBarterType(type.id as ProductType);
              setSelectedCategorySlug(null);
              setSelectedSubcategorySlug(null);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeBarterType === type.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
      
      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-muted" : ""}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {(selectedCategorySlug || selectedSubcategorySlug) && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
              {(selectedCategorySlug ? 1 : 0) + (selectedSubcategorySlug ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>
      
      {/* Filter Panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filters</h3>
            {(selectedCategorySlug || selectedSubcategorySlug) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategorySlug(null);
                  setSelectedSubcategorySlug(null);
                }}
              >
                Clear all
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={selectedCategorySlug || ""}
                onValueChange={(value) => {
                  setSelectedCategorySlug(value || null);
                  setSelectedSubcategorySlug(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select
                value={selectedSubcategorySlug || ""}
                onValueChange={(value) => setSelectedSubcategorySlug(value || null)}
                disabled={!selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedCategory ? "All subcategories" : "Select category first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subcategories</SelectItem>
                  {selectedCategory?.subcategories.map((sub) => (
                    <SelectItem key={sub.slug} value={sub.slug}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
      
      {/* Products Grid */}
      {loadingProducts ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No products found</p>
          <p className="text-sm text-muted-foreground/70">
            {searchQuery ? "Try adjusting your search or filters" : "Create a product to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.map((product) => {
            const hasImage = !!product.imageKey;
            
            return (
              <button
                key={product.productId}
                onClick={() => {
                  setLoadingDetail(true);
                  setSelectedProductId(product.productId);
                }}
                className="group text-left border rounded-lg overflow-hidden hover:border-primary transition-colors bg-card"
              >
                {/* Image */}
                <div className="aspect-square bg-muted relative">
                  {hasImage ? (
                    <img
                      src={getImageUrl(product.imageKey) || ""}
                      alt={product.title}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Image indicator */}
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    hasImage 
                      ? "bg-emerald-500/10 text-emerald-600" 
                      : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {hasImage ? "Has Image" : "No Image"}
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-3 space-y-1">
                  <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {product.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {product.brand || "Unknown brand"} {product.model && `• ${product.model}`}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {product.category || "Uncategorized"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      
      {/* Create Product Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Product Title *</Label>
              <Input
                placeholder="Enter product title"
                value={newProductTitle}
                onChange={(e) => setNewProductTitle(e.target.value)}
              />
            </div>
            
            {/* Barter Type */}
            <div className="space-y-2">
              <Label>Barter Type *</Label>
              <Select
                value={newProductBarterType}
                onValueChange={(value) => {
                  setNewProductBarterType(value as ProductType);
                  setNewProductCategory("");
                  setNewProductSubcategory("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newProductCategory}
                onValueChange={(value) => {
                  setNewProductCategory(value);
                  setNewProductSubcategory("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories
                    .filter(c => {
                      const barterType = PRODUCT_TYPES.find(t => t.id === newProductBarterType);
                      return c.barterTypeSlug === barterType?.id;
                    })
                    .map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Subcategory */}
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select
                value={newProductSubcategory}
                onValueChange={setNewProductSubcategory}
                disabled={!newProductCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder={newProductCategory ? "Select subcategory" : "Select category first"} />
                </SelectTrigger>
                <SelectContent>
                  {allSubcategories
                    .filter(s => {
                      const category = allCategories.find(c => c.slug === newProductCategory);
                      return category && s.categoryId === category.categoryId;
                    })
                    .map((sub) => (
                      <SelectItem key={sub.slug} value={sub.slug}>
                        {sub.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Brand */}
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select
                value={newProductBrand}
                onValueChange={setNewProductBrand}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {allBrands.map((brand) => (
                    <SelectItem key={brand.slug} value={brand.slug}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Model */}
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                placeholder="Enter model name"
                value={newProductModel}
                onChange={(e) => setNewProductModel(e.target.value)}
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateProduct}
                disabled={creatingProduct || !newProductTitle.trim()}
              >
                {creatingProduct ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
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
