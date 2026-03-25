"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Crop } from "lucide-react";
import type { OfferImage } from "@/lib/types";

type Props = {
  images: OfferImage[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (imageId: string) => void;
  onCrop?: (imageId: string, croppedUrl: string) => void;
};

export function OfferImagePreview({
  images,
  initialIndex,
  onClose,
  onDelete,
  onCrop,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showCropper, setShowCropper] = useState(false);

  const currentImage = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  // Handle swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasNext) {
      setCurrentIndex((prev) => prev + 1);
    }
    if (isRightSwipe && hasPrev) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrev) {
        setCurrentIndex((prev) => prev - 1);
      }
      if (e.key === "ArrowRight" && hasNext) {
        setCurrentIndex((prev) => prev + 1);
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, onClose]);

  if (!currentImage) return null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(currentImage.imageId);
    }
  };

  const handleCropComplete = (croppedUrl: string) => {
    if (onCrop) {
      onCrop(currentImage.imageId, croppedUrl);
    }
    setShowCropper(false);
  };

  // Show cropper
  if (showCropper) {
    return (
      <ImageCropperModal
        imageUrl={currentImage.url}
        onCropComplete={handleCropComplete}
        onCancel={() => setShowCropper(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </button>

        <span className="text-sm text-white/80">
          {currentIndex + 1} / {images.length}
        </span>

        <div className="flex items-center gap-2">
          {onCrop && (
            <button
              onClick={() => setShowCropper(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
            >
              <Crop className="h-5 w-5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Image container with swipe support */}
      <div
        className="flex-1 flex items-center justify-center relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Previous button */}
        {hasPrev && (
          <button
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Image */}
        <img
          src={currentImage.url}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          crossOrigin="anonymous"
        />

        {/* Next button */}
        {hasNext && (
          <button
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="p-4 bg-black/80">
          <div className="flex justify-center gap-2 overflow-x-auto">
            {images.map((img, index) => (
              <button
                key={img.imageId}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentIndex
                    ? "border-primary"
                    : "border-transparent opacity-60"
                }`}
              >
                <img
                  src={img.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Image Cropper Modal for editing existing images
function ImageCropperModal({
  imageUrl,
  onCropComplete,
  onCancel,
}: {
  imageUrl: string;
  onCropComplete: (croppedUrl: string) => void;
  onCancel: () => void;
}) {
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, size: 80 });

  const handleCrop = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cropX = (cropBox.x / 100) * img.width;
      const cropY = (cropBox.y / 100) * img.height;
      const cropSize = (cropBox.size / 100) * Math.min(img.width, img.height);

      canvas.width = cropSize;
      canvas.height = cropSize;
      ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);

      const croppedUrl = canvas.toDataURL("image/jpeg", 0.9);
      onCropComplete(croppedUrl);
    };
    img.src = imageUrl;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button onClick={onCancel} className="text-white text-sm">
          Cancel
        </button>
        <h3 className="text-white font-medium">Crop Image</h3>
        <button
          onClick={handleCrop}
          className="text-primary text-sm font-medium"
        >
          Done
        </button>
      </header>

      {/* Crop area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative max-w-full max-h-full">
          <img
            src={imageUrl}
            alt="Crop preview"
            className="max-w-full max-h-[60vh] object-contain"
            crossOrigin="anonymous"
          />

          {/* Crop overlay */}
          <div
            className="absolute border-2 border-white rounded-lg"
            style={{
              left: `${cropBox.x}%`,
              top: `${cropBox.y}%`,
              width: `${cropBox.size}%`,
              height: `${cropBox.size}%`,
            }}
          >
            {/* Corner handles */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-black/80 text-center">
        <p className="text-xs text-white/60">
          Adjust the crop area and tap Done
        </p>
      </div>
    </div>
  );
}
