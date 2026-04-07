"use client";

/**
 * ============================================================================
 * PRODUCT SHIMMER LOADER
 * ============================================================================
 * 
 * Skeleton loading animation for product cards.
 * Matches exact product card layout: 88px min height, horizontal with 64x64 image.
 * Uses responsive grid: 1-3 columns based on screen width, min 368px per card.
 */

type Props = {
  count?: number;
};

export function ProductShimmer({ count = 6 }: Props) {
  return (
    <div 
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(368px, 1fr))' }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductShimmerCard key={index} />
      ))}
    </div>
  );
}

function ProductShimmerCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card w-full card-shadow-blue min-h-[88px]">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
      </div>

      {/* Card content - matches product card: p-4, min-h-[88px], flex gap-3 */}
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
            {/* Offer count placeholder */}
            <div className="h-3 w-24 rounded bg-secondary/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Single card shimmer for inline loading
export function ProductShimmerSingle() {
  return <ProductShimmerCard />;
}
