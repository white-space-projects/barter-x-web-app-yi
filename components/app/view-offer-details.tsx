"use client";

/**
 * ============================================================================
 * VIEW OFFER DETAILS
 * ============================================================================
 * 
 * Full-screen view for offer details, rendered inside the existing tab content area.
 * Supports two modes:
 * 1. Viewing my own offer - shows hooked offers, edit/delete actions
 * 2. Viewing another user's offer - shows linked products, add offer action
 */

import { useState, useMemo, useCallback } from "react";
import { 
  X, Package, MapPin, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Pencil, Trash2, Plus, Link2Off, AlertTriangle, Loader2, Info, ArrowRightLeft
} from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { HookOfferModal } from "./hook-offer-modal";
import type { Offer, Product, OfferImage, LockLevel, Hook } from "@/lib/types";
import { LOCK_LEVEL_LABELS, LOCK_LEVEL_COLORS, LOCK_LEVEL_BG_COLORS } from "@/lib/types";
import { toast } from "sonner";
import { getProductInfo } from "@/lib/offer-info-fields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  offerId: string;
  onClose: () => void;
  onEdit?: (offer: Offer) => void;
  onAddOfferToProduct?: (product: Product) => void;
};

// =============================================================================
// FULLSCREEN IMAGE VIEWER
// =============================================================================
function FullscreenImageViewer({
  images,
  initialIndex,
  onClose,
}: {
  images: OfferImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      
      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      
      {/* Main image */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <img
          src={images[currentIndex].url}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          crossOrigin="anonymous"
        />
      </div>
      
      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// IMAGE CAROUSEL (Portrait mode, swipeable)
// =============================================================================
function ImageCarousel({
  images,
  onImageClick,
}: {
  images: OfferImage[];
  onImageClick: (index: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
    setTouchStart(null);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] w-full max-w-sm mx-auto rounded-xl bg-secondary flex items-center justify-center">
        <Package className="h-16 w-16 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Main image */}
      <div 
        className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-secondary cursor-pointer relative"
        onClick={() => onImageClick(currentIndex)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[currentIndex].url}
          alt={`Offer image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        
        {/* Navigation arrows (desktop) */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors hidden md:flex"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors hidden md:flex"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      
      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Hook status display labels
const HOOK_STATUS_LABELS: Record<string, string> = {
  searching: "Searching",
  cycle_found: "Cycle Found",
  reserved: "Reserved",
  processing: "Processing",
  exchanged: "Exchanged",
  expired: "Expired",
};

const HOOK_STATUS_COLORS: Record<string, string> = {
  searching: "text-blue-500",
  cycle_found: "text-purple-500",
  reserved: "text-yellow-500",
  processing: "text-orange-500",
  exchanged: "text-green-500",
  expired: "text-muted-foreground",
};

const HOOK_STATUS_BG_COLORS: Record<string, string> = {
  searching: "bg-blue-500/10",
  cycle_found: "bg-purple-500/10",
  reserved: "bg-yellow-500/10",
  processing: "bg-orange-500/10",
  exchanged: "bg-green-500/10",
  expired: "bg-muted/50",
};

// =============================================================================
// HOOKED OFFER CARD (for my own offer view)
// =============================================================================
function HookedOfferCard({
  offer,
  product,
  hook,
  onUnhook,
  canUnhook,
  isUnhooking,
}: {
  offer: Offer;
  product: Product | undefined;
  hook: Hook;
  onUnhook: () => void;
  canUnhook: boolean;
  isUnhooking?: boolean;
}) {
  const [showUnhookDialog, setShowUnhookDialog] = useState(false);

  const handleUnhookClick = () => {
    if (canUnhook) {
      setShowUnhookDialog(true);
    }
  };

  const handleConfirmUnhook = () => {
    setShowUnhookDialog(false);
    onUnhook();
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden card-shadow-primary">
        <div className="p-3">
          <div className="flex gap-2.5 items-center">
            {/* 48x48 Image */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
              {offer.images && offer.images.length > 0 ? (
                <img
                  src={offer.images[0].url}
                  alt={offer.title}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : product?.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={offer.title}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>

            {/* Offer info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {offer.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {product?.subcategory} . {product?.brand}
              </p>
            </div>

            {/* Offer status badge */}
            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${LOCK_LEVEL_BG_COLORS[offer.lockLevel]} ${LOCK_LEVEL_COLORS[offer.lockLevel]}`}>
              {LOCK_LEVEL_LABELS[offer.lockLevel]}
            </span>
          </div>

          {/* Hook status and unhook action */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            {/* Hook status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Hook:</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${HOOK_STATUS_BG_COLORS[hook.status]} ${HOOK_STATUS_COLORS[hook.status]}`}>
                {HOOK_STATUS_LABELS[hook.status] || hook.status}
              </span>
            </div>

            {/* Unhook button - always visible but disabled when not allowed */}
            <button
              onClick={handleUnhookClick}
              disabled={!canUnhook || isUnhooking}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                canUnhook && !isUnhooking
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30" 
                  : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed border border-transparent"
              }`}
            >
              {isUnhooking ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Link2Off className="h-3 w-3" />
              )}
              Unhook
            </button>
          </div>
        </div>
      </div>

      {/* Unhook Confirmation Dialog */}
      <AlertDialog open={showUnhookDialog} onOpenChange={setShowUnhookDialog}>
        <AlertDialogContent className="max-w-[340px] rounded-xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Unhook this offer?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Unhooking will remove your offer from any eligible exchange cycles involving this offer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleConfirmUnhook}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Unhook
            </AlertDialogAction>
            <AlertDialogCancel className="w-full mt-0">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =============================================================================
// LINKED PRODUCT CARD (for viewing another user's offer)
// =============================================================================
function LinkedProductCard({
  product,
  onAddOffer,
}: {
  product: Product;
  onAddOffer: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden card-shadow-blue">
      <div className="p-3">
        <div className="flex gap-2.5 items-center">
          {/* 48x48 Image */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground/40" />
            )}
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {product.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.subcategory} . {product.brand}
            </p>
          </div>

          {/* Add Offer button */}
          <button
            onClick={onAddOffer}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Offer
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function ViewOfferDetails({ offerId, onClose, onEdit, onAddOfferToProduct }: Props) {
  const { 
    auth, 
    getOfferById, 
    products, 
    getHooksByFromOffer, 
    removeHook,
    deleteOffer,
    canDeleteOffer,
  } = useBarterStore();
  
  const offer = getOfferById(offerId);
  const product = offer ? products.find((p) => p.productId === offer.productId) : null;
  
  // State
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [unhookingId, setUnhookingId] = useState<string | null>(null);
  const [showHookModal, setShowHookModal] = useState(false);
  
  // Determine if this is my offer
  const isMyOffer = auth.user?.userId === offer?.ownerUserId;
  
  // Get my offers for checking if already hooked
  const { getMyOffers, hooks } = useBarterStore();
  const myOffers = getMyOffers();
  
  // Check if current user has already hooked this offer
  const isAlreadyHooked = useMemo(() => {
    if (!offer || isMyOffer) return false;
    const myOfferIds = myOffers.map((o) => o.offerId);
    return hooks.some((h) => h.toOfferId === offer.offerId && myOfferIds.includes(h.fromOfferId));
  }, [offer, isMyOffer, myOffers, hooks]);
  
  // Get hooks for my offer
  const myHooks = useMemo(() => {
    if (!isMyOffer || !offer) return [];
    return getHooksByFromOffer(offer.offerId);
  }, [isMyOffer, offer, getHooksByFromOffer]);
  
  // Get hooked offers
  const hookedOffers = useMemo(() => {
    return myHooks.map((hook) => {
      const targetOffer = getOfferById(hook.toOfferId);
      const targetProduct = targetOffer 
        ? products.find((p) => p.productId === targetOffer.productId) 
        : undefined;
      return { hook, offer: targetOffer, product: targetProduct };
    }).filter((item) => item.offer);
  }, [myHooks, getOfferById, products]);

  // Get linked products (products this offer's hooks target - for other user view)
  const linkedProducts = useMemo(() => {
    if (isMyOffer || !offer) return [];
    // For another user's offer, show the product this offer belongs to
    // and any related products (simplified - just show the main product for now)
    return product ? [product] : [];
  }, [isMyOffer, offer, product]);

  // Handler functions
  const handleUnhook = useCallback(async (hookId: string) => {
    setUnhookingId(hookId);
    await new Promise((r) => setTimeout(r, 400));
    removeHook(hookId);
    setUnhookingId(null);
    toast.success("Offer unhooked successfully");
  }, [removeHook]);

  const handleDelete = useCallback(async () => {
    if (!offer) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 500));
    deleteOffer(offer.offerId);
    setDeleting(false);
    toast.success("Offer deleted successfully");
    onClose();
  }, [offer, deleteOffer, onClose]);

  const canDelete = offer ? canDeleteOffer(offerId) : false;

  if (!offer || !product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Offer not found</p>
      </div>
    );
  }

  const address = offer.pickupAddress;
  const offerInfo = offer.offerInfo?.filter((info) => info.value && (Array.isArray(info.value) ? info.value.length > 0 : info.value.trim() !== ""));
  const productSpecs = getProductInfo(product.productId);

  return (
    <>
      <div className="pb-6">
        {/* Back button / Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-muted-foreground/50">|</span>
          <h2 className="text-base font-semibold text-foreground">Offer Details</h2>
        </div>

        {/* Main content - responsive layout */}
        {/* Desktop: Image left, info right | Mobile: Info above image, description below */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Mobile only: Title, product info, brand ABOVE image */}
          <div className="lg:hidden">
            {/* Title and status */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-xl font-semibold text-foreground">{offer.title}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${LOCK_LEVEL_BG_COLORS[offer.lockLevel]} ${LOCK_LEVEL_COLORS[offer.lockLevel]}`}>
                {LOCK_LEVEL_LABELS[offer.lockLevel]}
              </span>
            </div>

            {/* Product info */}
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground">{product.title}</p>
              <p className="text-xs text-muted-foreground">{product.subcategory} . {product.brand}</p>
            </div>

            {/* Hook this offer button - only for other users' offers */}
            {!isMyOffer && (
              <button
                onClick={() => !isAlreadyHooked && setShowHookModal(true)}
                disabled={isAlreadyHooked}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors mb-4 ${
                  isAlreadyHooked
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <ArrowRightLeft className="h-4 w-4" />
                {isAlreadyHooked ? "Hooked" : "Hook this offer"}
              </button>
            )}
          </div>

          {/* Image carousel */}
          <div className="lg:w-[320px] flex-shrink-0">
            <ImageCarousel
              images={offer.images || []}
              onImageClick={(index) => setFullscreenImageIndex(index)}
            />
          </div>

          {/* Right: Offer info (Desktop shows title here, Mobile shows description below image) */}
          <div className="flex-1 min-w-0 lg:max-w-xl">
            {/* Desktop only: Title, product info, brand NEXT TO image */}
            <div className="hidden lg:block">
              {/* Title and status */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl font-semibold text-foreground">{offer.title}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${LOCK_LEVEL_BG_COLORS[offer.lockLevel]} ${LOCK_LEVEL_COLORS[offer.lockLevel]}`}>
                  {LOCK_LEVEL_LABELS[offer.lockLevel]}
                </span>
              </div>

              {/* Product info */}
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground">{product.title}</p>
                <p className="text-xs text-muted-foreground">{product.subcategory} . {product.brand}</p>
              </div>

              {/* Hook this offer button - only for other users' offers */}
              {!isMyOffer && (
                <button
                  onClick={() => !isAlreadyHooked && setShowHookModal(true)}
                  disabled={isAlreadyHooked}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors mb-4 ${
                    isAlreadyHooked
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  {isAlreadyHooked ? "Hooked" : "Hook this offer"}
                </button>
              )}
            </div>

            {/* Description */}
            <div className="mb-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{offer.description || "No description provided."}</p>
            </div>

            {/* Offer Info Section - only show fields with values */}
            {offerInfo && offerInfo.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Offer Info</p>
                <div className="grid grid-cols-2 gap-2">
                  {offerInfo.map((info, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">{info.fieldName}</p>
                      <p className="text-sm font-medium text-foreground">
                        {Array.isArray(info.value) ? info.value.join(", ") : info.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pickup Location (city/country with info text for non-owners) */}
            {address && (
              <div className="mb-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Pickup Location</p>
                <div className="flex items-start gap-2 text-sm text-foreground p-3 rounded-lg bg-secondary/50">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    {isMyOffer ? (
                      // Full address for my own offer
                      <p>
                        {[
                          address.addressLine1,
                          address.addressLine2,
                          address.city,
                          address.state,
                          address.zip,
                          address.country
                        ].filter(Boolean).join(", ")}
                      </p>
                    ) : (
                      // Only city and country for other users with info text
                      <>
                        <p className="font-medium">{[address.city, address.country].filter(Boolean).join(", ")}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Full address will be visible if this offer is hooked and reserved
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Pickup Readiness (my offer only, greyed out if not reserved) */}
            {isMyOffer && (
              <div className="mb-5">
                <button
                  disabled={offer.lockLevel < 1}
                  className={`w-full lg:w-auto lg:px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    offer.lockLevel >= 1
                      ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {offer.readyState ? "Pickup Readiness Confirmed" : "Confirm Pickup Readiness"}
                </button>
                {offer.lockLevel < 1 && (
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Available when offer is part of a reserved cycle
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Product Specifications Accordion - above linked products/hooked offers */}
        {productSpecs && productSpecs.length > 0 && (
          <div className="mt-6 lg:max-w-2xl">
            <button
              onClick={() => setSpecsExpanded(!specsExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Product Specifications</span>
              </div>
              {specsExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {specsExpanded && (
              <div className="mt-2 p-3 rounded-lg border border-border bg-card">
                <div className="space-y-2">
                  {productSpecs.map((spec, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-xs text-muted-foreground">{spec.fieldName}</span>
                      <span className="text-sm text-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ownership-based sections */}
        {isMyOffer ? (
          // MY OFFER: Show hooked offers
          <div className="mt-6 lg:max-w-2xl">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Your Outgoing Hooks ({hookedOffers.length}/3)
            </h3>
            {hookedOffers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-lg">
                No hooks yet. Browse products to hook offers.
              </p>
            ) : (
              <div className="space-y-2">
                {hookedOffers.map(({ hook, offer: hookedOffer, product: hookedProduct }) => (
                  <HookedOfferCard
                    key={hook.hookId}
                    offer={hookedOffer!}
                    product={hookedProduct}
                    hook={hook}
                    onUnhook={() => handleUnhook(hook.hookId)}
                    canUnhook={hook.lockLevel === 0 && hook.isActive}
                    isUnhooking={unhookingId === hook.hookId}
                  />
                ))}
              </div>
            )}

            {/* Edit and Delete actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 lg:max-w-md">
              <button
                onClick={() => onEdit?.(offer)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit Offer
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={!canDelete}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  canDelete
                    ? "border-destructive text-destructive hover:bg-destructive/10"
                    : "border-border text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Delete Offer
              </button>
            </div>
            {!canDelete && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Cannot delete: This offer has a reserved or committed hook.
              </p>
            )}
          </div>
        ) : (
          // ANOTHER USER'S OFFER: Show linked products
          <div className="mt-6 lg:max-w-2xl">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Linked Products
            </h3>
            {linkedProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-lg">
                No linked products found.
              </p>
            ) : (
              <div className="space-y-2">
                {linkedProducts.map((linkedProduct) => (
                  <LinkedProductCard
                    key={linkedProduct.productId}
                    product={linkedProduct}
                    onAddOffer={() => onAddOfferToProduct?.(linkedProduct)}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Add an offer into this product to request direct exchange
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen image viewer */}
      {fullscreenImageIndex !== null && offer.images && offer.images.length > 0 && (
        <FullscreenImageViewer
          images={offer.images}
          initialIndex={fullscreenImageIndex}
          onClose={() => setFullscreenImageIndex(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete this offer?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. Deleting this offer will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Drop all hooked offers connected to this offer</li>
                <li>Remove your offer from any potential trades</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Offer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hook offer modal */}
      {showHookModal && offer && (
        <HookOfferModal 
          targetOfferId={offer.offerId} 
          onClose={() => setShowHookModal(false)} 
        />
      )}
    </>
  );
}
