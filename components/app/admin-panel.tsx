"use client";

import React from "react";

import { useState, useRef } from "react";
import { useBarterStore } from "@/lib/store";
import { Package, Upload, Trash2, ImageIcon as ImageIconComponent, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {useProducts } from '@/hooks/use-products'

export function AdminPanel() {
  const { auth, updateProductImage, deleteProductImage } = useBarterStore();
  const { data: products = [], isLoading , mutate : mutateUploadImage } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!auth.user?.isAdmin) {
    return (
      <div className="flex flex-col items-center py-16 text-muted-foreground">
        <p className="text-sm">Admin access required.</p>
      </div>
    );
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedProductId) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    // Read as data URL for local preview/storage
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      setUploading(true);
      /* */
      const formData = new FormData();
      formData.append("image", file); 
      formData.append("product_id", selectedProductId); 
      const res = await fetch(`/api/product/image/upload`, {method: "POST", body: formData});
      if (!res.ok)  throw new Error("Upload failed");
      const data = await res.json();
      updateProductImage(selectedProductId, data.image_url);
      setUploading(false);
      setPreviewUrl(null);
      setSelectedProductId(null);
      mutateUploadImage();
      toast.success("Image uploaded successfully.");
    };
    reader.readAsDataURL(file);

    // Reset the input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(productId: string) {
    setDeleting(productId);
    const res = await fetch(`/api/product/image/remove`, {method: "DELETE", body: JSON.stringify({ product_id : productId })});
    if (!res.ok)  throw new Error("Upload failed");
    const data = await res.json();
    deleteProductImage(productId);
    setDeleting(null);
    toast.success(data.message || "Image removed.");
  }


  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Product Image Management
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload, replace, or delete product images. Changes will be stored in
          the database once connected.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.productId}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            {/* Image area */}
            <div className="relative aspect-square bg-secondary flex items-center justify-center">
              {product.imageUrl ? (
                <>
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.title}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                  {/* Delete overlay */}
                  <button
                    onClick={() => handleDelete(product.productId)}
                    disabled={deleting === product.productId}
                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    title="Remove image"
                  >
                    {deleting === product.productId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground/40">
                  <Package className="h-8 w-8" />
                  <span className="mt-1 text-xs">No image</span>
                </div>
              )}

              {/* Upload overlay when selected */}
              {selectedProductId === product.productId && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  {previewUrl && uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Uploading...
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="mb-2 h-6 w-6 text-primary" />
                      <label className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                        Choose file
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => setSelectedProductId(null)}
                        className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Product info */}            
            <div className="p-3 flex justify-between">
              <div className="flex gap-4 items-center">
                <div>
                  <p className="text-sm font-medium text-foreground truncate w-40">
                    {product.title}
                  </p>
                  <p className="text-xs text-muted-foreground w-40">
                    {product.subcategory} / {product.brand}
                  </p>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() =>
                      setSelectedProductId(
                        selectedProductId === product.productId
                          ? null
                          : product.productId
                      )
                    }
                    className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                  >
                    <ImageIconComponent className="h-3 w-3" />
                    {product.imageUrl ? "Replace image" : "Upload image"}
                  </button>
                </div>
              </div>
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.title}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground/40" />
                )}
              </div>
            </div>  
          </div>
        ))}
      </div>
    </div>
  );
}
