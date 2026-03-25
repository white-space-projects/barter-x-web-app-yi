"use client";

/**
 * ============================================================================
 * PRODUCT SHIMMER LOADER
 * ============================================================================
 * 
 * Skeleton loading animation for product cards.
 * Shows a shimmer effect with a subtle blue shadow line.
 * Used when:
 * - Initial product load
 * - Re-fetching products after location change (city/country mismatch)
 * 
 * BACKEND NOTE:
 * This component is displayed when products are being fetched from:
 * - GET /api/products?country={country}&city={city}
 * Products are pre-fetched on login using auto-detected location.
 * If profile location differs from auto-detected, products are re-fetched.
 */

type Props = {
  count?: number;
};

export function ProductShimmer({ count = 6 }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductShimmerCard key={index} />
      ))}
    </div>
  );
}

function ProductShimmerCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4">
      {/* Shimmer overlay with blue glow */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      {/* Image placeholder */}
      <div className="aspect-square w-full rounded-lg bg-secondary/50 mb-3" />

      {/* Title placeholder */}
      <div className="h-4 w-3/4 rounded bg-secondary/50 mb-2" />
      
      {/* Subtitle placeholder */}
      <div className="h-3 w-1/2 rounded bg-secondary/50 mb-3" />

      {/* Tags row */}
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 rounded-full bg-secondary/50" />
        <div className="h-5 w-12 rounded-full bg-secondary/50" />
      </div>

      {/* Offer count placeholder */}
      <div className="h-3 w-20 rounded bg-secondary/50" />
    </div>
  );
}

// Single card shimmer for inline loading
export function ProductShimmerSingle() {
  return <ProductShimmerCard />;
}
