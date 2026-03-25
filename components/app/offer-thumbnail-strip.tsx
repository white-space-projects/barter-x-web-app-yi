"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { OfferImage } from "@/lib/types";

/**
 * OfferThumbnailStrip
 * ====================
 * Displays 6 thumbnail slots for offer images.
 * - Owner mode: Can add/remove images
 * - View mode: Read-only, tap to preview
 * 
 * DESIGN: Matches mobile app design - 64x64 slots with yellow + icon
 */

type Props = {
  images: OfferImage[];
  isOwner: boolean;
  onAddImage?: () => void;
  onRemoveImage?: (imageId: string) => void;
  onPreviewImage?: (image: OfferImage) => void;
  maxImages?: number;
};

const MAX_IMAGES = 6;
const SLOT_SIZE = 64;

export function OfferThumbnailStrip({
  images,
  isOwner,
  onAddImage,
  onRemoveImage,
  onPreviewImage,
  maxImages = MAX_IMAGES,
}: Props) {
  // Sort images by order
  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  
  // Calculate empty slots
  const emptySlotCount = maxImages - sortedImages.length;
  const canAddMore = isOwner && sortedImages.length < maxImages;

  return (
    <div className="w-full">
      {/* Horizontal scrollable strip */}
      <div className="overflow-x-auto pb-2">
        <div 
          className="flex gap-2 p-3 rounded-xl bg-secondary/50"
          style={{ minWidth: "fit-content" }}
        >
          {/* Existing images */}
          {sortedImages.map((image) => (
            <div
              key={image.imageId}
              className="relative flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border cursor-pointer group"
              style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
              onClick={() => onPreviewImage?.(image)}
            >
              <img
                src={image.url}
                alt={`Offer image ${image.order + 1}`}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
              {/* Remove button - only for owner */}
              {isOwner && onRemoveImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(image.imageId);
                  }}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* Empty slots with add button for owner */}
          {Array.from({ length: emptySlotCount }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className={`flex-shrink-0 rounded-lg border border-border flex items-center justify-center ${
                canAddMore && index === 0
                  ? "bg-secondary cursor-pointer hover:border-primary/50 transition-colors"
                  : "bg-secondary/30"
              }`}
              style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
              onClick={canAddMore && index === 0 ? onAddImage : undefined}
            >
              {/* Show + icon on first empty slot when owner can add */}
              {canAddMore && index === 0 ? (
                <Plus className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Image count indicator */}
      <div className="flex items-center justify-center mt-2">
        <div className="flex gap-1">
          {Array.from({ length: maxImages }).map((_, index) => (
            <div
              key={index}
              className={`h-1 w-4 rounded-full ${
                index < sortedImages.length ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
