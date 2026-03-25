"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Camera, X, Check, Crop, ChevronLeft, LogIn } from "lucide-react";
import type { OfferImage } from "@/lib/types";
import { useBarterStore } from "@/lib/store";

// Decode session data from URL
function decodeSessionData(encoded: string): SessionData | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const data = JSON.parse(json);
    return {
      sessionId: data.sid || "",
      offerId: data.oid || undefined,
      maxImages: data.max || 6,
      draft: data.draft ? {
        title: data.draft.t || "",
        description: data.draft.d || "",
        productId: data.draft.pid || "",
        productTitle: data.draft.pt || "",
      } : undefined,
      existingImageCount: data.imgCount || 0,
      expiresAt: data.exp || 0,
    };
  } catch {
    return null;
  }
}

type SessionData = {
  sessionId: string;
  offerId?: string;
  maxImages: number;
  draft?: {
    title: string;
    description: string;
    productId: string;
    productTitle: string;
  };
  existingImageCount: number;
  expiresAt: number;
};

// Main export wrapped in Suspense for useSearchParams
export default function CapturePage() {
  return (
    <Suspense fallback={<CaptureLoading />}>
      <CaptureContent />
    </Suspense>
  );
}

function CaptureLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function CaptureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const encodedData = searchParams.get("data");
  
  // Auth state
  const { auth } = useBarterStore();
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [images, setImages] = useState<OfferImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse session data from URL
  useEffect(() => {
    if (!encodedData) {
      setError("Invalid capture link. Please scan the QR code again.");
      setIsLoading(false);
      return;
    }

    const data = decodeSessionData(encodedData);
    if (!data || !data.sessionId) {
      setError("Invalid session data. Please scan the QR code again.");
      setIsLoading(false);
      return;
    }

    // Check expiry
    if (data.expiresAt && Date.now() > data.expiresAt) {
      setSessionExpired(true);
      setError("This capture session has expired. Please scan a new QR code from your desktop.");
      setIsLoading(false);
      return;
    }

    setSessionData(data);
    setIsLoading(false);
  }, [encodedData]);

  // Check authentication
  useEffect(() => {
    if (!isLoading && sessionData && !auth.isAuthenticated) {
      setRequiresAuth(true);
    } else {
      setRequiresAuth(false);
    }
  }, [isLoading, sessionData, auth.isAuthenticated]);

  // Sync images to API for cross-device sync
  const syncImages = useCallback(
    async (newImages: OfferImage[]) => {
      if (!sessionData?.sessionId) return;

      // Store locally as backup (for same-device scenarios)
      localStorage.setItem(
        `pending_images_${sessionData.sessionId}`,
        JSON.stringify(newImages)
      );

      // Also try BroadcastChannel for faster sync (same device, different tabs)
      try {
        const channel = new BroadcastChannel(`capture_${sessionData.sessionId}`);
        channel.postMessage({ type: "images_updated", images: newImages });
        channel.close();
      } catch {
        // BroadcastChannel not supported
      }

      // POST to API for cross-device sync (mobile -> server -> desktop)
      try {
        const response = await fetch("/api/capture-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            images: newImages.map((img) => ({
              imageId: img.imageId,
              url: img.url,
            })),
          }),
        });
        
        if (!response.ok) {
          console.error("[v0] Failed to sync images to server");
        }
      } catch (err) {
        console.error("[v0] Error syncing images to API:", err);
      }
    },
    [sessionData?.sessionId]
  );

  // Handle camera capture
  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        setShowCropper(true);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  // Handle cropped image
  const handleCropComplete = (croppedUrl: string) => {
    const newImage: OfferImage = {
      imageId: crypto.randomUUID(),
      url: croppedUrl,
      order: images.length,
      uploadedAt: new Date(),
    };
    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    syncImages(updatedImages);
    setCapturedImage(null);
    setShowCropper(false);
  };

  // Use image without cropping
  const handleUseWithoutCrop = () => {
    if (!capturedImage) return;
    handleCropComplete(capturedImage);
  };

  // Cancel crop
  const handleCancelCrop = () => {
    setCapturedImage(null);
    setShowCropper(false);
  };

  // Remove image
  const handleRemoveImage = (imageId: string) => {
    const updatedImages = images
      .filter((img) => img.imageId !== imageId)
      .map((img, index) => ({ ...img, order: index }));
    setImages(updatedImages);
    syncImages(updatedImages);
  };

  // Open camera
  const openCamera = () => {
    fileInputRef.current?.click();
  };

  // Navigate to login
  const handleLogin = () => {
    // Store current URL to return after login
    const returnUrl = window.location.href;
    sessionStorage.setItem("capture_return_url", returnUrl);
    router.push("/login");
  };

// Done - sync and show completion message
  const handleDone = () => {
    syncImages(images);
    setIsComplete(true);
    setError(null);
  };

  const maxImages = sessionData?.maxImages || 6;
  const remainingSlots = maxImages - images.length;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">
            {sessionExpired ? "Session Expired" : "Invalid Session"}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Auth required state
  if (requiresAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Sign In Required
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Please sign in to capture images for your offer.
          </p>
          
          {/* Show draft info if available */}
          {sessionData?.draft && (sessionData.draft.title || sessionData.draft.productTitle) && (
            <div className="mb-6 p-4 rounded-xl bg-card border border-border text-left">
              <p className="text-xs text-muted-foreground mb-2">Capturing images for:</p>
              {sessionData.draft.title && (
                <p className="text-sm font-medium text-foreground">{sessionData.draft.title}</p>
              )}
              {sessionData.draft.productTitle && (
                <p className="text-xs text-muted-foreground">{sessionData.draft.productTitle}</p>
              )}
            </div>
          )}
          
          <button
            onClick={handleLogin}
            className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Completion state - images synced successfully
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Images Captured
          </h1>
          <p className="text-sm text-muted-foreground mb-2">
            {images.length} {images.length === 1 ? "image" : "images"} ready for your offer.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Return to your desktop to continue creating your offer. The images will be synced automatically.
          </p>
          
          {/* Show draft info if available */}
          {sessionData?.draft && (sessionData.draft.title || sessionData.draft.productTitle) && (
            <div className="mb-6 p-4 rounded-xl bg-card border border-border text-left">
              <p className="text-xs text-muted-foreground mb-2">Offer:</p>
              {sessionData.draft.title && (
                <p className="text-sm font-medium text-foreground">{sessionData.draft.title}</p>
              )}
              {sessionData.draft.productTitle && (
                <p className="text-xs text-muted-foreground">{sessionData.draft.productTitle}</p>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => setIsComplete(false)}
              className="w-full px-6 py-3 rounded-lg border border-border text-foreground text-sm font-medium"
            >
              Capture More Images
            </button>
            <button
              onClick={() => window.close()}
              className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Close Page
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Images are syncing to desktop automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Crop modal
  if (showCropper && capturedImage) {
    return (
      <ImageCropper
        imageUrl={capturedImage}
        onCropComplete={handleCropComplete}
        onUseWithoutCrop={handleUseWithoutCrop}
        onCancel={handleCancelCrop}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Capture Images
          </h1>
          <p className="text-xs text-muted-foreground">
            {images.length}/{maxImages} images
          </p>
        </div>
        <button
          onClick={handleDone}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Done
        </button>
      </header>

      {/* Draft info banner */}
      {sessionData?.draft && (sessionData.draft.title || sessionData.draft.productTitle) && (
        <div className="px-4 py-3 bg-primary/5 border-b border-border">
          <p className="text-xs text-muted-foreground">Capturing for:</p>
          {sessionData.draft.title && (
            <p className="text-sm font-medium text-foreground">{sessionData.draft.title}</p>
          )}
          {sessionData.draft.productTitle && (
            <p className="text-xs text-muted-foreground">{sessionData.draft.productTitle}</p>
          )}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-4">
        {/* Thumbnail strip */}
        <div className="rounded-xl bg-card border border-border p-4 mb-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* Existing images */}
            {images.map((image, index) => (
              <div
                key={image.imageId}
                className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-secondary"
              >
                <img
                  src={image.url}
                  alt={`Captured ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image.imageId)}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-background/80 text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: remainingSlots }).map((_, index) => (
              <button
                key={`empty-${index}`}
                type="button"
                onClick={openCamera}
                className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-secondary flex items-center justify-center"
              >
                <span className="text-primary text-2xl font-light">+</span>
              </button>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="flex justify-center mt-3">
            <div className="h-1 w-16 rounded-full bg-primary/40" />
          </div>
        </div>

        {/* Capture button */}
        {remainingSlots > 0 && (
          <button
            type="button"
            onClick={openCamera}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-input bg-background px-4 py-4 text-base font-medium text-foreground"
          >
            <Camera className="h-6 w-6" />
            Capture Image
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
        />

        {/* Help text */}
        {remainingSlots > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            You can capture {remainingSlots} more image{remainingSlots !== 1 ? "s" : ""}
          </p>
        )}

        {remainingSlots === 0 && (
          <div className="flex items-center justify-center gap-2 mt-4 text-green-500">
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">Maximum images reached</span>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-border bg-card">
        <p className="text-xs text-muted-foreground text-center">
          {images.length > 0 
            ? "Images captured. Tap Done when finished."
            : "Images will sync with your desktop session"
          }
        </p>
      </footer>
    </div>
  );
}

// Image Cropper Component with proper touch/mouse handling
function ImageCropper({
  imageUrl,
  onCropComplete,
  onUseWithoutCrop,
  onCancel,
}: {
  imageUrl: string;
  onCropComplete: (croppedUrl: string) => void;
  onUseWithoutCrop: () => void;
  onCancel: () => void;
}) {
  // Crop position in pixels relative to the displayed image
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, size: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, displayWidth: 0, displayHeight: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropBoxRef = useRef<HTMLDivElement>(null);
  
  // Track drag state
  const dragStateRef = useRef({ isDragging: false, startX: 0, startY: 0, startCropX: 0, startCropY: 0 });

  // Initialize crop box when image loads
  const handleImageLoad = () => {
    if (!imageRef.current || !containerRef.current) return;
    
    const img = imageRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Calculate displayed image dimensions (considering object-contain)
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = containerRect.width / containerRect.height;
    
    let displayWidth: number, displayHeight: number;
    if (imgRatio > containerRatio) {
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / imgRatio;
    } else {
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * imgRatio;
    }
    
    // Set initial crop to center 80% of smaller dimension
    const cropSize = Math.min(displayWidth, displayHeight) * 0.8;
    const cropX = (displayWidth - cropSize) / 2;
    const cropY = (displayHeight - cropSize) / 2;
    
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
      displayWidth,
      displayHeight,
    });
    setCropRect({ x: cropX, y: cropY, size: cropSize });
    setImageLoaded(true);
  };

  // Get pointer position relative to image
  const getPointerPosition = (clientX: number, clientY: number) => {
    if (!containerRef.current || !imageDimensions.displayWidth) return null;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Calculate image offset within container (centered)
    const imageOffsetX = (containerRect.width - imageDimensions.displayWidth) / 2;
    const imageOffsetY = (containerRect.height - imageDimensions.displayHeight) / 2;
    
    return {
      x: clientX - containerRect.left - imageOffsetX,
      y: clientY - containerRect.top - imageOffsetY,
    };
  };

  // Handle drag start (touch and mouse)
  const handleDragStart = (clientX: number, clientY: number) => {
    const pos = getPointerPosition(clientX, clientY);
    if (!pos) return;
    
    dragStateRef.current = {
      isDragging: true,
      startX: pos.x,
      startY: pos.y,
      startCropX: cropRect.x,
      startCropY: cropRect.y,
    };
  };

  // Handle drag move
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStateRef.current.isDragging) return;
    
    const pos = getPointerPosition(clientX, clientY);
    if (!pos) return;
    
    const deltaX = pos.x - dragStateRef.current.startX;
    const deltaY = pos.y - dragStateRef.current.startY;
    
    const newX = Math.max(0, Math.min(imageDimensions.displayWidth - cropRect.size, dragStateRef.current.startCropX + deltaX));
    const newY = Math.max(0, Math.min(imageDimensions.displayHeight - cropRect.size, dragStateRef.current.startCropY + deltaY));
    
    setCropRect(prev => ({ ...prev, x: newX, y: newY }));
  };

  // Handle drag end
  const handleDragEnd = () => {
    dragStateRef.current.isDragging = false;
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    handleDragEnd();
  };

  // Perform crop
  const handleCrop = () => {
    if (!imageRef.current || !imageDimensions.displayWidth) return;

    const img = imageRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate scale from display to natural
    const scaleX = img.naturalWidth / imageDimensions.displayWidth;
    const scaleY = img.naturalHeight / imageDimensions.displayHeight;

    // Convert crop rect from display coordinates to natural coordinates
    const naturalCropX = cropRect.x * scaleX;
    const naturalCropY = cropRect.y * scaleY;
    const naturalCropSize = cropRect.size * Math.min(scaleX, scaleY);

    // Output size (max 1024px for performance)
    const outputSize = Math.min(naturalCropSize, 1024);
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.drawImage(
      img,
      naturalCropX,
      naturalCropY,
      naturalCropSize,
      naturalCropSize,
      0,
      0,
      outputSize,
      outputSize
    );

    const croppedUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCropComplete(croppedUrl);
  };

  // Calculate crop box position for rendering
  const getCropBoxStyle = () => {
    if (!containerRef.current || !imageDimensions.displayWidth) {
      return { display: "none" as const };
    }
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const imageOffsetX = (containerRect.width - imageDimensions.displayWidth) / 2;
    const imageOffsetY = (containerRect.height - imageDimensions.displayHeight) / 2;
    
    return {
      left: imageOffsetX + cropRect.x,
      top: imageOffsetY + cropRect.y,
      width: cropRect.size,
      height: cropRect.size,
    };
  };

  const cropBoxStyle = getCropBoxStyle();

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/10">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-white"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-base font-medium text-white">Crop Image</h1>
        <button
          onClick={handleCrop}
          disabled={!imageLoaded}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          Done
        </button>
      </header>

      {/* Crop area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ touchAction: "none" }}
      >
        {/* Image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
            draggable={false}
          />
        </div>

        {/* Overlay and crop frame - only show when loaded */}
        {imageLoaded && (
          <>
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            
            {/* Clear crop area (cut out from overlay) */}
            <div
              ref={cropBoxRef}
              className="absolute bg-transparent pointer-events-none"
              style={{
                ...cropBoxStyle,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
              }}
            >
              {/* White border */}
              <div className="absolute inset-0 border-2 border-white rounded-sm">
                {/* Corner handles */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-[3px] border-l-[3px] border-white" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-[3px] border-r-[3px] border-white" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-[3px] border-l-[3px] border-white" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-[3px] border-r-[3px] border-white" />
                
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-b border-white/30" />
                  <div className="border-r border-white/30" />
                  <div className="border-r border-white/30" />
                  <div />
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Loading indicator */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-black/90 border-t border-white/10 flex gap-3">
        <button
          onClick={onUseWithoutCrop}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/30 text-white text-sm font-medium active:bg-white/10"
        >
          <Check className="h-5 w-5" />
          Use Original
        </button>
        <button
          onClick={handleCrop}
          disabled={!imageLoaded}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 active:opacity-80"
        >
          <Crop className="h-5 w-5" />
          Crop & Use
        </button>
      </div>

      {/* Instructions */}
      <div className="px-4 pb-6 pt-2 bg-black text-center">
        <p className="text-xs text-white/50">
          Drag the crop area to reposition
        </p>
      </div>
    </div>
  );
}
