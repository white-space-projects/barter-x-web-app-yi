"use client";

/**
 * ============================================================================
 * OFFER CARD SHIMMER LOADER
 * ============================================================================
 * 
 * Skeleton loading animation for offer cards.
 * Matches the exact offer card layout with:
 * - 64x64 image placeholder
 * - Title, subtitle, hooks count placeholders
 * - Status badge placeholder
 * 
 * Variants:
 * - "my-offers": 4-column grid for My Offers tab
 * - "offers-panel": 3-column grid for View Offers Panel
 */

type Props = {
  count?: number;
  variant?: "my-offers" | "offers-panel";
};

export function OfferCardShimmer({ count = 4, variant = "my-offers" }: Props) {
  const gridClass = variant === "offers-panel" 
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 items-start";
  
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, index) => (
        <OfferCardShimmerCard key={index} />
      ))}
    </div>
  );
}

function OfferCardShimmerCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card w-full card-shadow-primary min-h-[88px]">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      {/* Card content - matches offer card: p-4, min-h-[88px], flex gap-3 */}
      <div className="p-4 min-h-[88px]">
        <div className="flex gap-3">
          {/* 64x64 Image placeholder - dark to match theme */}
          <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-secondary/60" />

          {/* Text content - centered vertically */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
            {/* Title placeholder */}
            <div className="h-4 w-3/4 rounded bg-secondary/60" />
            {/* Subtitle placeholder */}
            <div className="h-3 w-1/2 rounded bg-secondary/60" />
            {/* Hooks count placeholder */}
            <div className="h-3 w-20 rounded bg-secondary/60" />
          </div>

          {/* Right side: edit icon placeholder */}
          <div className="flex-shrink-0 flex flex-col items-end justify-center">
            <div className="h-4 w-4 rounded bg-secondary/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Single card shimmer for inline loading
export function OfferCardShimmerSingle() {
  return <OfferCardShimmerCard />;
}
