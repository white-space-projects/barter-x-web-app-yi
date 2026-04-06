"use client";

/**
 * ProductImage Component
 * 
 * Displays product images with:
 * - Uniform white background container
 * - Consistent fallback for missing/broken images
 * - Does NOT apply to offer images (user-captured photos)
 */

import { useState } from "react";
import { Package } from "lucide-react";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-20 w-20",
  xl: "h-24 w-24",
};

const ICON_SIZE_CLASSES = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

export function ProductImage({ src, alt, size = "md", className = "" }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);

  const showFallback = !src || hasError;

  return (
    <div 
      className={`
        flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0
        bg-white
        ${SIZE_CLASSES[size]}
        ${className}
      `}
    >
      {showFallback ? (
        // Fallback icon for missing/broken images
        <div className="flex items-center justify-center w-full h-full bg-white">
          <Package className={`${ICON_SIZE_CLASSES[size]} text-muted-foreground/40`} />
        </div>
      ) : (
        <>
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <Package className={`${ICON_SIZE_CLASSES[size]} text-muted-foreground/20 animate-pulse`} />
            </div>
          )}
          {/* Actual image on white background */}
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-contain bg-white"
            crossOrigin="anonymous"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        </>
      )}
    </div>
  );
}
