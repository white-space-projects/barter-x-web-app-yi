"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Smartphone, Check, Loader2, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { OfferImage } from "@/lib/types";
import { generateGuid } from "@/lib/guid";
import { toast } from "sonner";

type OfferDraftData = {
  title?: string;
  description?: string;
  productId?: string;
  productTitle?: string;
};

type Props = {
  offerId?: string;
  draftData?: OfferDraftData; // Current unsaved offer data
  currentImageCount: number;
  maxImages: number;
  onClose: () => void;
  onImagesUpdated: (images: OfferImage[]) => void;
  existingImages: OfferImage[];
};

// Encode session data into URL-safe base64
function encodeSessionData(data: object): string {
  try {
    const json = JSON.stringify(data);
    // Use encodeURIComponent for URL safety
    return btoa(encodeURIComponent(json));
  } catch {
    return "";
  }
}

// Generate QR code URL with all session data embedded
function generateCaptureUrl(
  sessionId: string,
  offerId: string | undefined,
  draftData: OfferDraftData | undefined,
  existingImages: OfferImage[],
  maxImages: number
): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  
  // Create session payload - include all data needed for mobile
  const sessionPayload = {
    sid: sessionId,
    oid: offerId || "",
    max: maxImages,
    // Include draft data (title, description, product info)
    draft: draftData ? {
      t: draftData.title || "",
      d: draftData.description || "",
      pid: draftData.productId || "",
      pt: draftData.productTitle || "",
    } : null,
    // Don't include existing images in URL (too large) - mobile will start fresh
    imgCount: existingImages.length,
    exp: Date.now() + 30 * 60 * 1000, // 30 min expiry timestamp
  };
  
  const encodedData = encodeSessionData(sessionPayload);
  
  return `${baseUrl}/capture?data=${encodedData}`;
}

export function OfferCaptureQrModal({
  offerId,
  draftData,
  currentImageCount,
  maxImages,
  onClose,
  onImagesUpdated,
  existingImages,
}: Props) {
  // Generate session ID
  const [sessionId] = useState(() => generateGuid());
  const [captureUrl, setCaptureUrl] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const [syncedImages, setSyncedImages] = useState<OfferImage[]>(existingImages);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Generate capture URL with embedded data
  useEffect(() => {
    const url = generateCaptureUrl(sessionId, offerId, draftData, existingImages, maxImages);
    setCaptureUrl(url);
    
    // Store session in localStorage for cross-tab sync (same device)
    // This is a backup mechanism for same-device scenarios
    const sessionData = {
      sessionId,
      offerId,
      draftData,
      images: existingImages,
      maxImages,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
    localStorage.setItem(`capture_session_${sessionId}`, JSON.stringify(sessionData));
    
    // Also store in a "pending_images" key that mobile can write to
    localStorage.setItem(`pending_images_${sessionId}`, JSON.stringify([]));
  }, [sessionId, offerId, draftData, existingImages, maxImages]);

  // Poll for images - check API for cross-device updates
  const checkForUpdates = useCallback(async () => {
    // First check localStorage for same-device scenarios (faster)
    const pendingKey = `pending_images_${sessionId}`;
    const pendingData = localStorage.getItem(pendingKey);
    
    if (pendingData) {
      try {
        const images: OfferImage[] = JSON.parse(pendingData);
        if (images.length > syncedImages.length) {
          setSyncedImages(images);
          onImagesUpdated(images);
          setLastSyncTime(new Date());
          return; // Got updates from local, skip API call
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    // Also poll API for cross-device sync (mobile -> server -> desktop)
    try {
      const response = await fetch(`/api/capture-session?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.images && data.images.length > syncedImages.length) {
          // Convert API response to OfferImage format
          const newImages: OfferImage[] = data.images.map((img: { imageId: string; url: string; timestamp: number }, index: number) => ({
            imageId: img.imageId,
            url: img.url,
            order: index,
            uploadedAt: new Date(img.timestamp),
          }));
          setSyncedImages(newImages);
          onImagesUpdated(newImages);
          setLastSyncTime(new Date());
        }
      }
    } catch {
      // API not available, rely on localStorage/BroadcastChannel
    }
  }, [sessionId, syncedImages.length, onImagesUpdated]);

  // Start polling and listen for BroadcastChannel messages
  useEffect(() => {
    setIsPolling(true);
    // Poll every 2 seconds for cross-device sync
    const interval = setInterval(checkForUpdates, 2000);
    // Also check immediately
    checkForUpdates();
    
    // BroadcastChannel for same-origin cross-tab communication
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`capture_${sessionId}`);
      channel.onmessage = (event) => {
        if (event.data.type === "images_updated" && event.data.images) {
          setSyncedImages(event.data.images);
          onImagesUpdated(event.data.images);
          setLastSyncTime(new Date());
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    // Storage event for cross-tab
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `pending_images_${sessionId}`) {
        checkForUpdates();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      channel?.close();
      window.removeEventListener("storage", handleStorage);
      setIsPolling(false);
    };
  }, [sessionId, checkForUpdates, onImagesUpdated]);

  const remainingSlots = maxImages - syncedImages.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Capture Images
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* QR Code Section */}
        <div className="p-6 flex flex-col items-center">
          {/* Real scannable QR Code */}
          <div className="bg-white rounded-xl p-4 mb-4">
            {captureUrl ? (
              <QRCodeSVG
                value={captureUrl}
                size={180}
                level="L" // Low error correction for longer URLs
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            ) : (
              <div className="w-[180px] h-[180px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Instructions */}
          <p className="text-sm text-center text-foreground mb-2">
            Scan with your phone to capture images
          </p>
          <p className="text-xs text-center text-muted-foreground mb-4">
            You will need to sign in on your phone first
          </p>

          {/* URL display with copy button */}
          <div className="w-full flex items-center gap-2 p-2 bg-secondary rounded-lg mb-4">
            <p className="flex-1 text-xs text-muted-foreground truncate font-mono">
              {captureUrl.substring(0, 50)}...
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(captureUrl);
                toast.success("Link copied to clipboard");
              }}
              className="flex-shrink-0 p-1.5 rounded hover:bg-background transition-colors"
              title="Copy link"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Draft data indicator */}
          {draftData && (draftData.title || draftData.description) && (
            <div className="w-full p-3 bg-primary/10 rounded-lg mb-4">
              <p className="text-xs text-primary font-medium mb-1">
                Draft data will be transferred:
              </p>
              {draftData.title && (
                <p className="text-xs text-muted-foreground truncate">
                  Title: {draftData.title}
                </p>
              )}
              {draftData.productTitle && (
                <p className="text-xs text-muted-foreground truncate">
                  Product: {draftData.productTitle}
                </p>
              )}
            </div>
          )}

          {/* Status section */}
          <div className="w-full border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Images captured
              </span>
              <span className="text-sm font-medium text-foreground">
                {syncedImages.length}/{maxImages}
              </span>
            </div>

            {/* Synced images preview */}
            {syncedImages.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {syncedImages.map((img, index) => (
                  <div
                    key={img.imageId}
                    className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-secondary"
                  >
                    <img
                      src={img.url}
                      alt={`Captured ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Sync status */}
            <div className="flex items-center justify-center gap-2 text-xs">
              {isPolling ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-muted-foreground">
                    Waiting for images from mobile...
                  </span>
                </>
              ) : lastSyncTime ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="text-muted-foreground">
                    Last synced: {lastSyncTime.toLocaleTimeString()}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer with note */}
        <div className="px-4 py-3 border-t border-border bg-secondary/30">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Images sync when using the same network. For cross-device sync, images will be saved when you complete the offer on mobile.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {syncedImages.length > existingImages.length ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
