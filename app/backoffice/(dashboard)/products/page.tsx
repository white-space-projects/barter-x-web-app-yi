"use client";

import { useState, useEffect, useRef } from "react";
import { backofficeApi } from "@/lib/backoffice/api";
import { ProductForReview, ProductReviewStatus, PaginatedResponse } from "@/lib/backoffice/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, ChevronLeft, ChevronRight, Package, Image as ImageIcon, 
  Upload, Trash2, Plus, X, Save, Check, AlertCircle, FileText
} from "lucide-react";

const reviewStatusColors: Record<ProductReviewStatus, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  needs_info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const reviewStatusLabels: Record<ProductReviewStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  needs_info: "Needs More Info",
};

interface ProductInfoField {
  key: string;
  value: string;
}

export default function ProductReviewPage() {
  const [products, setProducts] = useState<ProductForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductReviewStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Detail panel state
  const [selectedProduct, setSelectedProduct] = useState<ProductForReview | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Product info editing state
  const [productInfoFields, setProductInfoFields] = useState<ProductInfoField[]>([]);
  const [reviewNote, setReviewNote] = useState("");
  const [newStatus, setNewStatus] = useState<ProductReviewStatus>("pending");

  useEffect(() => {
    loadProducts();
  }, [page, statusFilter, search]);

  async function loadProducts() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
      };
      if (statusFilter !== "all") params.review_status = statusFilter;
      if (search) params.search = search;

      const response: PaginatedResponse<ProductForReview> = await backofficeApi.getProductsForReview(params);
      setProducts(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }

  function openProductDetail(product: ProductForReview) {
    setSelectedProduct(product);
    
    // Parse existing product_info into editable fields
    const existingInfo = product.product_info || {};
    const fields: ProductInfoField[] = Object.entries(existingInfo).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    setProductInfoFields(fields.length > 0 ? fields : [{ key: "", value: "" }]);
    
    setReviewNote(product.review_note || "");
    setNewStatus(product.review_status);
    setNewImageFile(null);
    setNewImagePreview(null);
    setDetailOpen(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    
    setNewImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function addProductInfoField() {
    setProductInfoFields([...productInfoFields, { key: "", value: "" }]);
  }

  function removeProductInfoField(index: number) {
    setProductInfoFields(productInfoFields.filter((_, i) => i !== index));
  }

  function updateProductInfoField(index: number, field: "key" | "value", value: string) {
    const updated = [...productInfoFields];
    updated[index][field] = value;
    setProductInfoFields(updated);
  }

  async function handleSave() {
    if (!selectedProduct) return;
    
    setSaving(true);
    try {
      // Upload new image if selected
      if (newImageFile) {
        setUploadingImage(true);
        await backofficeApi.updateProductImage(selectedProduct.id, newImageFile);
        setUploadingImage(false);
      }
      
      // Build product_info JSONB from fields
      const productInfo: Record<string, string> = {};
      productInfoFields.forEach((field) => {
        if (field.key.trim()) {
          productInfo[field.key.trim()] = field.value;
        }
      });
      
      // Update product info and review status
      await backofficeApi.updateProductInfo(selectedProduct.id, {
        product_info: productInfo,
        review_status: newStatus,
        review_note: reviewNote,
      });
      
      // Reload products and close panel
      await loadProducts();
      setDetailOpen(false);
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  }

  async function handleDeleteImage() {
    if (!selectedProduct?.image_url) return;
    
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      await backofficeApi.deleteProductImage(selectedProduct.id);
      setSelectedProduct({ ...selectedProduct, image_url: null });
      await loadProducts();
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Product Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and normalize product data, manage images and specifications
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProductReviewStatus | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Review Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="needs_info">Needs More Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-border rounded-lg bg-card">
          No products found for review
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => openProductDetail(product)}
            >
              {/* Image - white background for product images */}
              <div className="aspect-square bg-white relative flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain bg-white"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <Badge 
                  variant="outline" 
                  className={`absolute top-2 right-2 ${reviewStatusColors[product.review_status]}`}
                >
                  {reviewStatusLabels[product.review_status]}
                </Badge>
              </div>
              
              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium text-foreground truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.category} / {product.brand}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(product.created_at).toLocaleDateString()}
                </p>
                {product.product_info && Object.keys(product.product_info).length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {Object.keys(product.product_info).length} specs
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Product Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedProduct && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedProduct.name}</SheetTitle>
                <SheetDescription>
                  {selectedProduct.category} / {selectedProduct.brand} / {selectedProduct.model}
                </SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="image" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="image">Image</TabsTrigger>
                  <TabsTrigger value="specs">Specifications</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                </TabsList>

                {/* Image Tab - white background for product images */}
                <TabsContent value="image" className="space-y-4 mt-4">
                  <div className="aspect-square rounded-lg border border-border bg-white overflow-hidden relative flex items-center justify-center">
                    {newImagePreview ? (
                      <img
                        src={newImagePreview}
                        alt="New image preview"
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : selectedProduct.image_url ? (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-white">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                        <span className="text-sm text-muted-foreground">No image</span>
                      </div>
                    )}
                    
                    {newImagePreview && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                        New Image
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedProduct.image_url ? "Replace Image" : "Upload Image"}
                    </Button>
                    {(selectedProduct.image_url || newImagePreview) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (newImagePreview) {
                            setNewImageFile(null);
                            setNewImagePreview(null);
                          } else {
                            handleDeleteImage();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TabsContent>

                {/* Specifications Tab */}
                <TabsContent value="specs" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Add or edit product specification fields. These are stored in product_info JSONB.
                  </p>
                  
                  <div className="space-y-3">
                    {productInfoFields.map((field, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Field name"
                          value={field.key}
                          onChange={(e) => updateProductInfoField(index, "key", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Value"
                          value={field.value}
                          onChange={(e) => updateProductInfoField(index, "value", e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProductInfoField(index)}
                          disabled={productInfoFields.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" onClick={addProductInfoField} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>

                  {/* Preview */}
                  {productInfoFields.some(f => f.key.trim()) && (
                    <div className="mt-4">
                      <Label className="text-xs text-muted-foreground">JSON Preview</Label>
                      <pre className="mt-1 p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto">
                        {JSON.stringify(
                          productInfoFields.reduce((acc, f) => {
                            if (f.key.trim()) acc[f.key.trim()] = f.value;
                            return acc;
                          }, {} as Record<string, string>),
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review" className="space-y-4 mt-4">
                  <div>
                    <Label>Review Status</Label>
                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ProductReviewStatus)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="needs_info">Needs More Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Review Note</Label>
                    <Textarea
                      placeholder="Add notes about this product review..."
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      className="mt-1.5"
                      rows={4}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                    <h4 className="text-sm font-medium">Product Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">ID:</span>
                        <code className="ml-1 text-xs font-mono">{selectedProduct.id.slice(0, 12)}...</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <span className="ml-1">{new Date(selectedProduct.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <span className="ml-1">{selectedProduct.category}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Brand:</span>
                        <span className="ml-1">{selectedProduct.brand}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="ml-1">{selectedProduct.model}</span>
                      </div>
                    </div>
                    {selectedProduct.created_by && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-muted-foreground text-sm">Created by:</span>
                        <code className="ml-1 text-xs font-mono">{selectedProduct.created_by}</code>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
