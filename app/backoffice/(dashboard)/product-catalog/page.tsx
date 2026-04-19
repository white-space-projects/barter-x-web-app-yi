"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, X, Upload, Package, Loader2, Edit2, Save, ImageIcon, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { processBackofficeImage, formatFileSize } from "@/lib/image-utils";

// Types
interface Category {
  categoryId: string;
  name: string;
}

interface Subcategory {
  subcategoryId: string;
  name: string;
  categoryId: string;
}

interface Brand {
  brandId: string;
  name: string;
  logoUrl?: string;
}

interface ProductField {
  fieldId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  fieldScope: string;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
  options?: { optionId: string; optionValue: string; optionLabel: string }[];
}

interface Product {
  productId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  imageKey?: string;
  subcategoryId: string;
  brandId?: string;
  productInfo?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  subcategoryName?: string;
  categoryName?: string;
  brandName?: string;
}

export default function ProductCatalogPage() {
  // Filter state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 20;
  
  // Detail view state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productFields, setProductFields] = useState<ProductField[]>([]);
  const [editingProductInfo, setEditingProductInfo] = useState<Record<string, unknown>>({});
  const [savingProductInfo, setSavingProductInfo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Title editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  
  // Category/Subcategory editing state
  const [editingCategory, setEditingCategory] = useState(false);
  const [editedCategoryId, setEditedCategoryId] = useState("");
  const [editedSubcategoryId, setEditedSubcategoryId] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  
  // Brand editing state
  const [editingBrand, setEditingBrand] = useState(false);
  const [editedBrandId, setEditedBrandId] = useState("");
  const [editedBrandName, setEditedBrandName] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  
  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  
  // Image error state for fallback
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Filtered subcategories based on selected category
  const filteredSubcategories = useMemo(() => {
    if (!selectedCategory) return subcategories;
    return subcategories.filter(s => s.categoryId === selectedCategory);
  }, [subcategories, selectedCategory]);

  // Fetch categories, subcategories, and brands on mount
  useEffect(() => {
    async function fetchFilters() {
      try {
        const [catRes, subRes, brandRes] = await Promise.all([
          fetch("/api/data/categories"),
          fetch("/api/data/subcategories"),
          fetch("/api/data/brands"),
        ]);
        
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories || []);
        }
        if (subRes.ok) {
          const data = await subRes.json();
          setSubcategories(data.subcategories || []);
        }
        if (brandRes.ok) {
          const data = await brandRes.json();
          setBrands(data.brands || []);
        }
      } catch (error) {
        console.error("Failed to fetch filters:", error);
      }
    }
    fetchFilters();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("format", "catalog"); // Use catalog format for back office
        params.set("includeInactive", "true"); // Show all products in back office
        params.set("page", String(page));
        params.set("limit", String(pageSize));
        if (selectedSubcategory) params.set("subcategoryId", selectedSubcategory);
        if (selectedBrand) params.set("brandId", selectedBrand);
        if (searchQuery) params.set("search", searchQuery);
        
        const response = await fetch(`/api/data/products?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
          setTotalProducts(data.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [page, selectedSubcategory, selectedBrand, searchQuery]);

  // Fetch product fields when selecting a product
  useEffect(() => {
    async function fetchProductFields() {
      if (!selectedProduct?.subcategoryId) return;
      
      try {
        const response = await fetch(`/api/data/subcategories/${selectedProduct.subcategoryId}/fields?scope=product`);
        if (response.ok) {
          const data = await response.json();
          setProductFields(data.productFields || []);
        }
      } catch (error) {
        console.error("Failed to fetch product fields:", error);
      }
    }
    fetchProductFields();
  }, [selectedProduct?.subcategoryId]);

  // Initialize editing state when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setEditingProductInfo(selectedProduct.productInfo || {});
    }
  }, [selectedProduct]);

  // Handle product selection
  function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setEditedTitle(product.title);
    setEditingTitle(false);
    setShowDeleteConfirm(false);
    // Set category/subcategory editing defaults
    const productSubcategory = subcategories.find(s => s.name === product.subcategoryName);
    const productCategory = categories.find(c => c.name === product.categoryName);
    setEditedCategoryId(productCategory?.categoryId || "");
    setEditedSubcategoryId(productSubcategory?.subcategoryId || product.subcategoryId || "");
    setEditingCategory(false);
    // Set brand editing defaults
    const productBrand = brands.find(b => b.name === product.brandName);
    setEditedBrandId(productBrand?.brandId || product.brandId || "");
    setEditedBrandName(productBrand?.name || product.brandName || "");
    setEditingBrand(false);
  }

  // Handle back to list
  function handleBackToList() {
    setSelectedProduct(null);
    setProductFields([]);
    setEditingProductInfo({});
    setEditingTitle(false);
    setEditingCategory(false);
    setEditingBrand(false);
    setShowDeleteConfirm(false);
  }

  // Save product title
  async function handleSaveTitle() {
    if (!selectedProduct || !editedTitle.trim()) return;
    
    setSavingTitle(true);
    try {
      const response = await fetch(`/api/data/products/${selectedProduct.productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editedTitle.trim() }),
      });
      
      if (response.ok) {
        setSelectedProduct(prev => prev ? { ...prev, title: editedTitle.trim() } : null);
        setProducts(prev => prev.map(p => 
          p.productId === selectedProduct.productId 
            ? { ...p, title: editedTitle.trim() }
            : p
        ));
        setEditingTitle(false);
        toast.success("Product title updated");
      } else {
        toast.error("Failed to update title");
      }
    } catch (error) {
      console.error("Failed to save title:", error);
      toast.error("Failed to update title");
    } finally {
      setSavingTitle(false);
    }
  }

  // Save product category/subcategory
  async function handleSaveCategory() {
    if (!selectedProduct || !editedSubcategoryId) return;
    
    setSavingCategory(true);
    try {
      const response = await fetch(`/api/data/products/${selectedProduct.productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          categoryId: editedCategoryId,
          subcategoryId: editedSubcategoryId 
        }),
      });
      
      if (response.ok) {
        const newCategory = categories.find(c => c.categoryId === editedCategoryId);
        const newSubcategory = subcategories.find(s => s.subcategoryId === editedSubcategoryId);
        setSelectedProduct(prev => prev ? { 
          ...prev, 
          categoryName: newCategory?.name || prev.categoryName,
          subcategoryName: newSubcategory?.name || prev.subcategoryName,
          subcategoryId: editedSubcategoryId
        } : null);
        setProducts(prev => prev.map(p => 
          p.productId === selectedProduct.productId 
            ? { ...p, categoryName: newCategory?.name, subcategoryName: newSubcategory?.name, subcategoryId: editedSubcategoryId }
            : p
        ));
        setEditingCategory(false);
        toast.success("Category updated");
      } else {
        toast.error("Failed to update category");
      }
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error("Failed to update category");
    } finally {
      setSavingCategory(false);
    }
  }

  // Save product brand
  async function handleSaveBrand() {
    if (!selectedProduct) return;
    
    setSavingBrand(true);
    try {
      const response = await fetch(`/api/data/products/${selectedProduct.productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: editedBrandId || null }),
      });
      
      if (response.ok) {
        const newBrand = brands.find(b => b.brandId === editedBrandId);
        setSelectedProduct(prev => prev ? { 
          ...prev, 
          brandName: newBrand?.name || undefined,
          brandId: editedBrandId || undefined
        } : null);
        setProducts(prev => prev.map(p => 
          p.productId === selectedProduct.productId 
            ? { ...p, brandName: newBrand?.name, brandId: editedBrandId || undefined }
            : p
        ));
        setEditingBrand(false);
        toast.success("Brand updated");
      } else {
        toast.error("Failed to update brand");
      }
    } catch (error) {
      console.error("Failed to save brand:", error);
      toast.error("Failed to update brand");
    } finally {
      setSavingBrand(false);
    }
  }

  // Upload brand logo (stores base64 directly in DB)
  async function handleUploadBrandLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editedBrandId) return;

    setUploadingBrandLogo(true);
    try {
      // Process logo: remove background and compress to WebP
      const compressed = await processBackofficeImage(file, {
        maxWidth: 128,
        maxHeight: 128,
        quality: 0.9,
        removeBackground: true, // Remove background for logos
      });
      
      const response = await fetch(`/api/data/brands/${editedBrandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoData: compressed.dataUrl }),
      });

      if (response.ok) {
        // Update local brand state
        setBrands(prev => prev.map(b => 
          b.brandId === editedBrandId 
            ? { ...b, logoUrl: compressed.dataUrl }
            : b
        ));
        toast.success(`Logo uploaded (${formatFileSize(compressed.compressedSize)})`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[v0] Brand logo upload failed:", errorData);
        toast.error("Failed to upload logo");
      }
    } catch (error) {
      console.error("Failed to upload brand logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingBrandLogo(false);
    }
  }

  // Delete product
  async function handleDeleteProduct() {
    if (!selectedProduct) return;
    
    setDeletingProduct(true);
    try {
      const response = await fetch(`/api/data/products/${selectedProduct.productId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        toast.success("Product deleted");
        setProducts(prev => prev.filter(p => p.productId !== selectedProduct.productId));
        handleBackToList();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeletingProduct(false);
      setShowDeleteConfirm(false);
    }
  }

  // Handle image error for fallback
  function handleImageError(productId: string) {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  }

  // Handle product info field change
  function handleFieldChange(fieldId: string, value: unknown) {
    setEditingProductInfo(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  }

  // Save product info
  async function handleSaveProductInfo() {
    if (!selectedProduct) return;
    
    setSavingProductInfo(true);
    try {
      const response = await fetch(`/api/data/products/${selectedProduct.productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productInfo: editingProductInfo,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedProduct(prev => prev ? { ...prev, productInfo: data.product.productInfo } : null);
        toast.success("Product info saved successfully");
      } else {
        toast.error("Failed to save product info");
      }
    } catch (error) {
      console.error("Failed to save product info:", error);
      toast.error("Failed to save product info");
    } finally {
      setSavingProductInfo(false);
    }
  }

  // Handle image upload
  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedProduct) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    setUploadingImage(true);
    try {
      // Process product image: remove background and compress to WebP
      const compressed = await processBackofficeImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        removeBackground: true, // Remove background for product images
      });
      
      // Convert compressed dataUrl back to File/Blob for FormData
      const blobResponse = await fetch(compressed.dataUrl);
      const blob = await blobResponse.blob();
      const compressedFile = new File([blob], `${selectedProduct.productId}.webp`, { type: "image/webp" });
      
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("productId", selectedProduct.productId);
      
      const uploadResponse = await fetch("/api/product/image/upload", {
        method: "POST",
        body: formData,
      });
      
      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        setSelectedProduct(prev => prev ? { 
          ...prev, 
          imageUrl: data.imageUrl,
          imageKey: data.imageKey,
        } : null);
        // Also update in list
        setProducts(prev => prev.map(p => 
          p.productId === selectedProduct.productId 
            ? { ...p, imageUrl: data.imageUrl, imageKey: data.imageKey }
            : p
        ));
        toast.success("Product image updated");
      } else {
        const errorData = await uploadResponse.json();
        toast.error(errorData.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  }

  // Render field input based on type
  function renderFieldInput(field: ProductField) {
    const value = editingProductInfo[field.fieldId] ?? "";
    
    switch (field.fieldType) {
      case "text":
      case "textarea":
        return field.fieldType === "textarea" ? (
          <textarea
            value={String(value)}
            onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={3}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
          />
        ) : (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
          />
        );
      
      case "number":
        return (
          <input
            type="number"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
          />
        );
      
      case "select":
        return (
          <select
            value={String(value)}
            onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select {field.fieldLabel.toLowerCase()}...</option>
            {field.options?.map(opt => (
              <option key={opt.optionId} value={opt.optionValue}>
                {opt.optionLabel}
              </option>
            ))}
          </select>
        );
      
      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.optionId} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.optionValue)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleFieldChange(field.fieldId, [...selectedValues, opt.optionValue]);
                    } else {
                      handleFieldChange(field.fieldId, selectedValues.filter(v => v !== opt.optionValue));
                    }
                  }}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">{opt.optionLabel}</span>
              </label>
            ))}
          </div>
        );
      
      case "boolean":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.fieldId, e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Yes</span>
          </label>
        );
      
      default:
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
          />
        );
    }
  }

  const totalPages = Math.ceil(totalProducts / pageSize);

  // Detail View
  if (selectedProduct) {
    const brand = brands.find(b => b.brandId === selectedProduct.brandId);
    
    return (
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image and Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Product Image */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-medium text-foreground mb-4">Product Image</h3>
              <div className="relative aspect-square rounded-lg bg-secondary overflow-hidden">
                {selectedProduct.imageUrl && !imageErrors[selectedProduct.productId] ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onError={() => handleImageError(selectedProduct.productId)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <label className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-lg cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                {uploadingImage ? "Uploading..." : "Upload New Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* Basic Info */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              <h3 className="text-sm font-medium text-foreground">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Title</label>
                  {editingTitle ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="flex-1 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTitle}
                        disabled={savingTitle || !editedTitle.trim()}
                        className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {savingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingTitle(false);
                          setEditedTitle(selectedProduct.title);
                        }}
                        className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-foreground font-medium">{selectedProduct.title}</p>
                      <button
                        onClick={() => setEditingTitle(true)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit title"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {selectedProduct.description && (
                  <div>
                    <label className="text-xs text-muted-foreground">Description</label>
                    <p className="text-sm text-foreground">{selectedProduct.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground">Category / Subcategory</label>
                  {editingCategory ? (
                    <div className="space-y-2 mt-1">
                      <select
                        value={editedCategoryId}
                        onChange={(e) => {
                          setEditedCategoryId(e.target.value);
                          setEditedSubcategoryId("");
                        }}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                        ))}
                      </select>
                      <select
                        value={editedSubcategoryId}
                        onChange={(e) => setEditedSubcategoryId(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories
                          .filter(s => !editedCategoryId || s.categoryId === editedCategoryId)
                          .map(s => (
                            <option key={s.subcategoryId} value={s.subcategoryId}>{s.name}</option>
                          ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCategory}
                          disabled={savingCategory || !editedSubcategoryId}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-medium transition-colors"
                        >
                          {savingCategory ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(false);
                            const sc = subcategories.find(s => s.name === selectedProduct.subcategoryName);
                            const cat = categories.find(c => c.name === selectedProduct.categoryName);
                            setEditedCategoryId(cat?.categoryId || "");
                            setEditedSubcategoryId(sc?.subcategoryId || "");
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-foreground">
                        {selectedProduct.categoryName} / {selectedProduct.subcategoryName}
                      </p>
                      <button
                        onClick={() => setEditingCategory(true)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Brand</label>
                  {editingBrand ? (
                    <div className="space-y-2 mt-1">
                      <select
                        value={editedBrandId}
                        onChange={(e) => {
                          setEditedBrandId(e.target.value);
                          const b = brands.find(br => br.brandId === e.target.value);
                          setEditedBrandName(b?.name || "");
                        }}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">No Brand</option>
                        {brands.map(b => (
                          <option key={b.brandId} value={b.brandId}>{b.name}</option>
                        ))}
                      </select>
                      {editedBrandId && (
                        <div className="flex items-center gap-2">
                          <label className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg border border-dashed border-border bg-secondary/50 text-xs text-muted-foreground hover:bg-secondary cursor-pointer transition-colors">
                            {uploadingBrandLogo ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                            Upload Logo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadBrandLogo}
                              className="hidden"
                              disabled={uploadingBrandLogo}
                            />
                          </label>
                          {brands.find(b => b.brandId === editedBrandId)?.logoUrl && (
                            <img 
                              src={brands.find(b => b.brandId === editedBrandId)?.logoUrl}
                              alt="Brand logo"
                              className="h-8 w-8 object-contain rounded border border-border"
                            />
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveBrand}
                          disabled={savingBrand}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-medium transition-colors"
                        >
                          {savingBrand ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingBrand(false);
                            const b = brands.find(br => br.name === selectedProduct.brandName);
                            setEditedBrandId(b?.brandId || "");
                            setEditedBrandName(b?.name || "");
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-foreground">{brand?.name || "No brand"}</p>
                        <button
                          onClick={() => setEditingBrand(true)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit brand"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {brand?.logoUrl && (
                        <div className="mt-2 p-2 bg-secondary/50 rounded-lg inline-block">
                          <img 
                            src={brand.logoUrl} 
                            alt={brand.name}
                            className="h-12 w-12 object-contain"
                            crossOrigin="anonymous"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <p className={`text-sm font-medium ${selectedProduct.isActive ? "text-emerald-500" : "text-red-500"}`}>
                    {selectedProduct.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </div>

            {/* Delete Product */}
            <div className="bg-card rounded-xl border border-destructive/30 p-4">
              <h3 className="text-sm font-medium text-destructive mb-2">Danger Zone</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Deleting a product will remove it from the catalog. This action cannot be undone.
              </p>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteProduct}
                    disabled={deletingProduct}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingProduct ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deletingProduct}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-medium rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Product
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Product Fields */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">Product Information</h3>
                <button
                  onClick={handleSaveProductInfo}
                  disabled={savingProductInfo}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingProductInfo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
              
              {productFields.length === 0 ? (
                <div className="py-8 text-center">
                  <Edit2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No product fields defined for this subcategory.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add fields in the Field Schema tab.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productFields.map(field => (
                    <div key={field.fieldId} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        {field.fieldLabel}
                        {field.isRequired && <span className="text-red-500">*</span>}
                      </label>
                      {renderFieldInput(field)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

// List View
  return (
  <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Product Catalog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage product images and information fields
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedSubcategory("");
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
          ))}
        </select>

        {/* Subcategory Filter */}
        <select
          value={selectedSubcategory}
          onChange={(e) => {
            setSelectedSubcategory(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Subcategories</option>
          {filteredSubcategories.map(sub => (
            <option key={sub.subcategoryId} value={sub.subcategoryId}>{sub.name}</option>
          ))}
        </select>

        {/* Brand Filter */}
        <select
          value={selectedBrand}
          onChange={(e) => {
            setSelectedBrand(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Brands</option>
          {brands.map(brand => (
            <option key={brand.brandId} value={brand.brandId}>{brand.name}</option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">No products found</p>
          {(searchQuery || selectedSubcategory || selectedBrand) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
                setSelectedSubcategory("");
                setSelectedBrand("");
                setPage(1);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {products.map(product => (
              <button
                key={product.productId}
                onClick={() => handleSelectProduct(product)}
                className="group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors text-left"
              >
                <div className="aspect-square bg-secondary relative overflow-hidden">
                  {product.imageUrl && !imageErrors[product.productId] ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      crossOrigin="anonymous"
                      onError={() => handleImageError(product.productId)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {!product.isActive && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500/90 text-white text-xs rounded">
                      Inactive
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                    {product.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {product.brandName || "No brand"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalProducts)} of {totalProducts} products
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-foreground px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
