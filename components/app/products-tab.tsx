"use client";

/**
 * ============================================================================
 * PRODUCTS TAB - Browse products and their offers
 * ============================================================================
 */

import { useMemo, useState } from "react";
import { useBarterStore } from "@/lib/store";
import { Search, SlidersHorizontal, Package, MoreHorizontal, X, Eye, Plus } from "lucide-react";
import { ViewOffersPanel } from "./view-offers-panel";
import { InlineAddOffer } from "./inline-add-offer";
import type { Product, ProductType } from "@/lib/types";
import {useProducts } from '@/hooks/use-products'

type Props = {
  productType?: ProductType;
};

export function ProductsTab({ productType = "cross-product" }: Props) {
  const {    
    productFilters,
    setProductFilters,
    getCategories,
    getSubcategories,
    getBrands,
    getMyOffers,
    getOfferById,
    hooks,
    offers,
  } = useBarterStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inlineAddProduct, setInlineAddProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileActionProduct, setMobileActionProduct] = useState<Product | null>(null);
  const { data: products = [], isLoading } = useProducts();
  const categories = useMemo(() => getCategories(), [getCategories]);
  const subcategories = useMemo(() => getSubcategories(productFilters.category || undefined), [getSubcategories, productFilters.category]);
  const brands = useMemo(() => getBrands(), [getBrands]);

  const hasActiveFilters = productFilters.onlyWithOffers || 
    productFilters.category || 
    productFilters.subcategory || 
    productFilters.brand ||
    productFilters.directExchangeOpportunities;

  const myOffers = useMemo(() => getMyOffers(), [getMyOffers]);

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
      if (productFilters.category && p.category !== productFilters.category)
        return false;
      if (
        productFilters.subcategory &&
        p.subcategory !== productFilters.subcategory
      )
        return false;
      if (productFilters.brand && p.brand !== productFilters.brand) return false;
      if (productFilters.directExchangeOpportunities && !directExchangeProductIds.has(p.productId))
        return false;
      return true;
    });
  }, [products, productFilters, directExchangeProductIds, productType]);

  function clearAllFilters() {
    setProductFilters({
      searchQuery: productFilters.searchQuery,
      onlyWithOffers: false,
      category: "",
      subcategory: "",
      brand: "",
      directExchangeOpportunities: false,
    });
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
              {[productFilters.onlyWithOffers, productFilters.category, productFilters.subcategory, productFilters.brand, productFilters.directExchangeOpportunities].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible Filters Panel */}
      {showFilters && (
        <div className="mb-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Filters</h3>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-muted-foreground hover:text-foreground"
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

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setProductFilters({
                    onlyWithOffers: !productFilters.onlyWithOffers,
                  })
                }
                className={`flex h-10 items-center justify-center rounded-lg border px-3 text-sm transition-colors ${
                  productFilters.onlyWithOffers
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                With offers only
              </button>

              <button
                onClick={() =>
                  setProductFilters({
                    directExchangeOpportunities: !productFilters.directExchangeOpportunities,
                  })
                }
                disabled={myOffers.length === 0}
                className={`flex h-10 items-center justify-center rounded-lg border px-3 text-sm transition-colors ${
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

            <select
              value={productFilters.category}
              onChange={(e) =>
                setProductFilters({ category: e.target.value, subcategory: "" })
              }
              className="h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={productFilters.subcategory}
              onChange={(e) =>
                setProductFilters({ subcategory: e.target.value })
              }
              className="h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All subcategories</option>
              {subcategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={productFilters.brand}
              onChange={(e) => setProductFilters({ brand: e.target.value })}
              className="h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Product grid - max 3 columns for better card width */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">No products match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

      {selectedProduct && (
        <ViewOffersPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddOffer={() => setInlineAddProduct(selectedProduct)}
        />
      )}

      {inlineAddProduct && (
        <InlineAddOffer
          product={inlineAddProduct}
          onClose={() => setInlineAddProduct(null)}
        />
      )}
    </div>
  );
}
