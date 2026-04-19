"use client";

import { useState, useEffect } from "react";
import { Camera, QrCode, X, Smartphone } from "lucide-react";
import type { OfferImage } from "@/lib/types";
import { OfferCaptureQrModal } from "./offer-capture-qr-modal";
import { OfferImagePreview } from "./offer-image-preview";
import { compressDataUrlToWebP } from "@/lib/image-utils";

type DraftData = {
  title?: string;
  description?: string;
  productId?: string;
  productTitle?: string;
};

type Props = {
  images: OfferImage[];
  onImagesChange: (images: OfferImage[]) => void;
  offerId?: string;
  sessionId?: string;
  maxImages?: number;
  readOnly?: boolean;
  draftData?: DraftData; // For passing unsaved offer data to mobile via QR
};

const MAX_IMAGES = 6;
const SLOT_SIZE = 64;

// Detect if running on mobile
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function OfferImageSection({
  images,
  onImagesChange,
  offerId,
  sessionId,
  maxImages = MAX_IMAGES,
  readOnly = false,
  draftData,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Remove an image (only for owners)
  const handleRemoveImage = (imageId: string) => {
    if (readOnly) return;
    const updatedImages = images
      .filter((img) => img.imageId !== imageId)
      .map((img, index) => ({ ...img, order: index }));
    onImagesChange(updatedImages);
  };

  // Open image preview
  const handleImageClick = (index: number) => {
    setPreviewIndex(index);
  };

  const emptySlots = Math.max(0, maxImages - images.length);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Photos{" "}
        <span className="text-muted-foreground font-normal">
          ({images.length}/{maxImages})
        </span>
      </label>

      {/* Thumbnail strip container */}
      <div className="rounded-xl bg-card border border-border p-3">
        {/* Scrollable thumbnail strip */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {/* Existing images */}
          {images.map((image, index) => (
            <div
              key={image.imageId}
              className="relative flex-shrink-0 rounded-lg overflow-hidden bg-secondary cursor-pointer"
              style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
              onClick={() => handleImageClick(index)}
            >
              <img
                src={image.url}
                alt={`Offer image ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {/* Delete button - only for owners */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(image.imageId);
                  }}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* Empty slots - clickable only for owners */}
          {!readOnly &&
            Array.from({ length: emptySlots }).map((_, index) => (
              <button
                key={`empty-${index}`}
                type="button"
                onClick={() => {
                  if (isMobile) {
                    // On mobile, this will be handled by MobileCaptureSection
                  } else {
                    setShowQrModal(true);
                  }
                }}
                className="flex-shrink-0 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-secondary flex items-center justify-center hover:border-primary/50 hover:bg-secondary/80 transition-colors"
                style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
              >
                <span className="text-primary text-lg font-light">+</span>
              </button>
            ))}

          {/* Empty slots in read-only mode */}
          {readOnly &&
            Array.from({ length: emptySlots }).map((_, index) => (
              <div
                key={`empty-readonly-${index}`}
                className="flex-shrink-0 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-secondary/50 flex items-center justify-center"
                style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
              >
                <span className="text-muted-foreground/30 text-lg font-light">
                  +
                </span>
              </div>
            ))}
        </div>

        {/* Scroll indicator line */}
        {images.length > 0 && (
          <div className="flex justify-center mt-2">
            <div className="h-1 w-12 rounded-full bg-primary/40" />
          </div>
        )}
      </div>

      {/* Capture button - Desktop shows QR, Mobile shows camera trigger */}
      {!readOnly && images.length < maxImages && (
        <>
          {isMobile ? (
            <MobileCaptureSection
              images={images}
              onImagesChange={onImagesChange}
              maxImages={maxImages}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <QrCode className="h-5 w-5" />
              Capture Image
            </button>
          )}
        </>
      )}

      {/* Desktop: Helper text */}
      {!readOnly && !isMobile && images.length < maxImages && (
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Smartphone className="h-3 w-3" />
          Scan QR code to capture images from your phone
        </p>
      )}

      {/* QR Modal for desktop */}
      {showQrModal && (
        <OfferCaptureQrModal
          offerId={offerId}
          draftData={draftData}
          currentImageCount={images.length}
          maxImages={maxImages}
          onClose={() => setShowQrModal(false)}
          onImagesUpdated={onImagesChange}
          existingImages={images}
        />
      )}

      {/* Image Preview Modal */}
      {previewIndex !== null && (
        <OfferImagePreview
          images={images}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onDelete={
            readOnly
              ? undefined
              : (imageId) => {
                  handleRemoveImage(imageId);
                  if (images.length <= 1) {
                    setPreviewIndex(null);
                  } else if (previewIndex >= images.length - 1) {
                    setPreviewIndex(images.length - 2);
                  }
                }
          }
        />
      )}
    </div>
  );
}

// Mobile-only capture section with native camera
function MobileCaptureSection({
  images,
  onImagesChange,
  maxImages,
}: {
  images: OfferImage[];
  onImagesChange: (images: OfferImage[]) => void;
  maxImages: number;
}) {
  const [showCropModal, setShowCropModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        setShowCropModal(true);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    try {
      // Compress to WebP before storing
      const compressed = await compressDataUrlToWebP(croppedImageUrl, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
      });
      
      const newImage: OfferImage = {
        imageId: crypto.randomUUID(),
        url: compressed.dataUrl,
        order: images.length,
        uploadedAt: new Date(),
      };
      onImagesChange([...images, newImage]);
    } catch (error) {
      console.error("Failed to compress image:", error);
      // Fallback to original if compression fails
      const newImage: OfferImage = {
        imageId: crypto.randomUUID(),
        url: croppedImageUrl,
        order: images.length,
        uploadedAt: new Date(),
      };
      onImagesChange([...images, newImage]);
    }
    setShowCropModal(false);
    setCapturedImage(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCapturedImage(null);
  };

  return (
    <>
      <label className="w-full flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer">
        <Camera className="h-5 w-5" />
        Capture Image
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
        />
      </label>

      {/* Image Crop Modal */}
      {showCropModal && capturedImage && (
        <ImageCropModal
          imageUrl={capturedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}

// Image Crop Modal Component
function ImageCropModal({
  imageUrl,
  onCropComplete,
  onCancel,
}: {
  imageUrl: string;
  onCropComplete: (croppedUrl: string) => void;
  onCancel: () => void;
}) {
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const canvasRef = document.createElement("canvas");

  const handleCrop = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Calculate crop dimensions based on percentage
      const cropX = (cropArea.x / 100) * img.width;
      const cropY = (cropArea.y / 100) * img.height;
      const cropW = (cropArea.width / 100) * img.width;
      const cropH = (cropArea.height / 100) * img.height;

      canvas.width = cropW;
      canvas.height = cropH;
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      // Output as WebP for better compression
      const croppedUrl = canvas.toDataURL("image/webp", 0.85);
      onCropComplete(croppedUrl);
    };
    img.src = imageUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-card rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <h3 className="text-sm font-medium text-foreground">Crop Image</h3>
          <button
            type="button"
            onClick={handleCrop}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Done
          </button>
        </div>

        {/* Image preview with crop overlay */}
        <div className="relative aspect-square bg-black flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onLoad={() => setImageLoaded(true)}
          />
          {/* Simple crop overlay - in production use a proper crop library */}
          {imageLoaded && (
            <div className="absolute inset-4 border-2 border-white/80 rounded-lg pointer-events-none">
              <div className="absolute inset-0 border border-white/40" />
              {/* Corner handles */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full" />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Drag to adjust crop area, then tap Done
          </p>
        </div>
      </div>
    </div>
  );
}
