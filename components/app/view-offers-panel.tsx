"use client";

/**
 * ============================================================================
 * VIEW OFFERS PANEL
 * ============================================================================
 * 
 * Displays all offers within a product. This is now a content component
 * that renders inline within the TabContentWrapper, not as a fixed overlay.
 * 
 * Shows different actions based on ownership (owner vs other users).
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { AlertCircle, Package, ArrowRightLeft, Plus, ChevronDown, ChevronUp, Link2Off, AlertTriangle, Loader2, Pencil } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { useBarterData } from "@/lib/data-provider";
import type { Product, HookStatus, Hook, Offer } from "@/lib/types";
import { LOCK_LEVEL_LABELS, LOCK_LEVEL_COLORS, LOCK_LEVEL_BG_COLORS } from "@/lib/types";
import { OfferCardShimmer } from "./offer-card-shimmer";
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
import { HookOfferModal } from "./hook-offer-modal";
import { AddOfferFlow } from "./add-offer-flow";
import { PickupReadinessModal } from "./pickup-readiness-modal";
import { ViewOfferDetails } from "./view-offer-details";
import { ProductImage } from "./product-image";
import { toast } from "sonner";
import { getProductTypeName } from "@/lib/product-types";

// Hook status display helpers
const HOOK_STATUS_COLORS: Record<HookStatus, string> = {
  searching: "text-muted-foreground",
  cycle_found: "text-primary",
  reserved: "text-primary",
  processing: "text-[#3b82f6]",
  exchanged: "text-muted-foreground",
  expired: "text-destructive",
};

const HOOK_STATUS_LABELS: Record<HookStatus, string> = {
  searching: "Searching",
  cycle_found: "Cycle Found",
  reserved: "Reserved",
  processing: "Committed",
  exchanged: "Exchanged",
  expired: "Expired",
};

const HOOK_STATUS_BG_COLORS: Record<HookStatus, string> = {
  searching: "bg-blue-500/10",
  cycle_found: "bg-purple-500/10",
  reserved: "bg-yellow-500/10",
  processing: "bg-orange-500/10",
  exchanged: "bg-green-500/10",
  expired: "bg-muted/50",
};

type ViewMode = "list" | "details" | "edit" | "add";

type Props = {
  product: Product;
  onAddOffer?: () => void;
  /** Callback when view mode changes - parent can hide its header when not in 'list' mode */
  onViewModeChange?: (mode: ViewMode) => void;
};

// VIEW OFFERS PANEL - Displays all offers within a product (inline content, not overlay)
// Shows different actions based on ownership (owner vs other users)
export function ViewOffersPanel({ product, onAddOffer, onViewModeChange }: Props) {
  const { getOffersByProduct, auth, products, hooks, getOfferById, getProductById, addNotification, getHooksByFromOffer, getMyOffers, removeHook } = useBarterStore();
  const { offersLoading } = useBarterData();
  const offers = getOffersByProduct(product.productId);
  
  const [hookTargetOfferId, setHookTargetOfferId] = useState<string | null>(null);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const [viewDetailsOfferId, setViewDetailsOfferId] = useState<string | null>(null);
  const [pickupOfferId, setPickupOfferId] = useState<string | null>(null);
  const [editOfferId, setEditOfferId] = useState<string | null>(null);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [addOfferToProduct, setAddOfferToProduct] = useState<Product | null>(null);
  const [hooksExpandedOfferId, setHooksExpandedOfferId] = useState<string | null>(null);
  const [unhookingId, setUnhookingId] = useState<string | null>(null);
  const [showUnhookDialog, setShowUnhookDialog] = useState<{ hookId: string; offerTitle: string } | null>(null);
  const myOffers = useMemo(() => getMyOffers(), [getMyOffers]);
  const hasOffers = myOffers.length > 0;
  
  // Fetch offer from API when editing (DB is single source of truth)
  // MUST be declared here before any conditional returns to follow Rules of Hooks
  const [offerToEdit, setOfferToEdit] = useState<Offer | null>(null);
  const [loadingEditOffer, setLoadingEditOffer] = useState(false);
  
  useEffect(() => {
    if (editOfferId) {
      setLoadingEditOffer(true);
      fetch(`/api/data/offers/${editOfferId}`)
        .then(res => res.json())
        .then(data => {
          if (data.offer) {
            // Merge with store data for images (not yet in DB)
            const storeOffer = getOfferById(editOfferId);
            setOfferToEdit({
              ...data.offer,
              images: storeOffer?.images || data.offer.images,
            });
          }
        })
        .catch(err => console.error("[v0] Failed to fetch offer for edit:", err))
        .finally(() => setLoadingEditOffer(false));
    } else {
      setOfferToEdit(null);
    }
  }, [editOfferId, getOfferById]);

  // Notify parent of view mode changes
  useEffect(() => {
    if (viewDetailsOfferId) {
      onViewModeChange?.("details");
    } else if (editOfferId) {
      onViewModeChange?.("edit");
    } else if (addOfferToProduct || showInlineAdd) {
      onViewModeChange?.("add");
    } else {
      onViewModeChange?.("list");
    }
  }, [viewDetailsOfferId, editOfferId, addOfferToProduct, showInlineAdd, onViewModeChange]);
  
  // Check if user has offers with matching product type
  const hasMatchingTypeOffers = useMemo(() => {
    return myOffers.some((offer) => {
      const offerProduct = getProductById(offer.productId);
      return offerProduct?.productType === product.productType;
    });
  }, [myOffers, getProductById, product.productType]);

  function hasReservedHook(offerId: string): boolean {
    const offerHooks = getHooksByFromOffer(offerId);
    return offerHooks.some((h) => h.status === "reserved");
  }

  function getOfferDisplayStatus(offerId: string): HookStatus | null {
    const offerHooks = getHooksByFromOffer(offerId);
    if (offerHooks.some((h) => h.status === "processing")) return "processing";
    if (offerHooks.some((h) => h.status === "reserved")) return "reserved";
    return null;
  }

  function canRequestDirectExchange(offerIdToCheck: string): { canRequest: boolean; myMatchingOffer: typeof myOffers[0] | null } {
    const offerHooks = hooks.filter((h) => h.fromOfferId === offerIdToCheck);
    const hookedProductIds = new Set<string>();
    offerHooks.forEach((hook) => {
      const targetOffer = getOfferById(hook.toOfferId);
      if (targetOffer) hookedProductIds.add(targetOffer.productId);
    });
    for (const myOffer of myOffers) {
      if (hookedProductIds.has(myOffer.productId)) {
        return { canRequest: true, myMatchingOffer: myOffer };
      }
    }
    return { canRequest: false, myMatchingOffer: null };
  }

  // Handle unhook with confirmation
  const handleUnhook = useCallback(async (hookId: string) => {
    setShowUnhookDialog(null);
    setUnhookingId(hookId);
    await new Promise((r) => setTimeout(r, 400));
    removeHook(hookId);
    setUnhookingId(null);
    toast.success("Offer unhooked successfully");
  }, [removeHook]);

  function handleRequestDirectExchange(targetOffer: typeof offers[0], myMatchingOffer: typeof myOffers[0]) {
    addNotification({
      type: "direct_exchange_req",
      offerId: targetOffer.offerId,
      fromUserId: auth.user?.userId,
      fromUserName: auth.user?.name,
      title: "Direct Exchange Request",
      message: `${auth.user?.name || "A user"} has requested a direct exchange with their "${myMatchingOffer.title}" for your "${targetOffer.title}".`,
      actionType: "view_offer",
      actionLabel: "View Offer",
    });
    toast.success("Direct exchange request sent! The offer owner will be notified.");
  }

  // If viewing offer details, show ViewOfferDetails inline
  if (viewDetailsOfferId) {
    return (
      <div className="w-full">
        <ViewOfferDetails
          offerId={viewDetailsOfferId}
          onClose={() => setViewDetailsOfferId(null)}
          onEdit={(offer) => {
            setViewDetailsOfferId(null);
            setEditOfferId(offer.offerId);
          }}
          onAddOfferToProduct={(productToAdd) => {
            setViewDetailsOfferId(null);
            setAddOfferToProduct(productToAdd);
          }}
        />
      </div>
    );
  }

  // If editing an offer, show embedded AddOfferFlow
  if (editOfferId && offerToEdit) {
    return (
      <div className="w-full">
        <AddOfferFlow
          open={true}
          onClose={() => setEditOfferId(null)}
          onSuccess={() => setEditOfferId(null)}
          editOffer={offerToEdit}
          embedded={true}
        />
      </div>
    );
  }
  
  // Show loading state while fetching offer for edit
  if (editOfferId && loadingEditOffer) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-4">Loading offer...</p>
        </div>
      </div>
    );
  }

  // If adding offer to a linked product, show embedded AddOfferFlow
  if (addOfferToProduct) {
    return (
      <div className="w-full">
        <AddOfferFlow
          open={true}
          onClose={() => setAddOfferToProduct(null)}
          onSuccess={() => setAddOfferToProduct(null)}
          initialProduct={addOfferToProduct}
          embedded={true}
        />
      </div>
    );
  }

  return (
    <>
      {/* Content panel - renders inline within TabContentWrapper */}
      <div className="w-full">
          {/* Add Offer Flow Modal - shows when Add Offer is clicked */}
          <AddOfferFlow
            open={showInlineAdd}
            onClose={() => setShowInlineAdd(false)}
            initialProduct={product}
          />

          {offersLoading ? (
            <OfferCardShimmer count={3} variant="offers-panel" />
          ) : offers.length === 0 && !showInlineAdd ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <AlertCircle className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">No offers yet for this product.</p>
              <button 
                onClick={() => {
                  if (onAddOffer) {
                    onAddOffer();
                  } else {
                    setShowInlineAdd(true);
                  }
                }}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add First Offer
              </button>
            </div>
          ) : offers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((offer) => {
                const isOwn = offer.ownerUserId === auth.user?.userId;
                const displayStatus = isOwn ? getOfferDisplayStatus(offer.offerId) : null;
                const showConfirmPickup = isOwn && hasReservedHook(offer.offerId) && !offer.readyState;
                const showPickupConfirmed = isOwn && offer.readyState;
                const showPickupDate = isOwn && offer.readyState && offer.pickupReadyDate;

                // Get hooked offers for thumbnail preview (for other users viewing)
                const offerHooks = getHooksByFromOffer(offer.offerId);
                const hookedOfferThumbnails = offerHooks.slice(0, 3).map((hook) => {
                  const hookedOffer = getOfferById(hook.toOfferId);
                  const hookedProduct = hookedOffer ? products.find((p) => p.productId === hookedOffer.productId) : null;
                  return {
                    image: hookedOffer?.images?.[0]?.url || hookedProduct?.imageUrl || null,
                    title: hookedOffer?.title || "Unknown",
                  };
                });

                // Get location from offer's pickup address
                const offerCity = offer.pickupAddress?.city;
                const offerCountry = offer.pickupAddress?.country;
                const locationDisplay = offerCity && offerCountry 
                  ? `${offerCity}, ${offerCountry.length > 2 ? offerCountry.substring(0, 2).toUpperCase() : offerCountry}`
                  : offerCity || offerCountry || null;

                // Determine condition badge display
                const conditionBadge = offer.offerInfo?.find(f => f.fieldName.toLowerCase() === 'condition')?.value;

                // Check if user has already hooked this offer
                const myOfferIds = myOffers.map((o) => o.offerId);
                const isAlreadyHooked = hooks.some((h) => h.toOfferId === offer.offerId && myOfferIds.includes(h.fromOfferId));
                
                return (
                  <div 
                    key={offer.offerId} 
                    className="rounded-xl border border-primary/30 bg-card overflow-hidden w-full card-shadow-primary cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setViewDetailsOfferId(offer.offerId)}
                  >
                    {/* Large main image section */}
                    <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                      {offer.images && offer.images.length > 0 ? (
                        <img 
                          src={offer.images[0].url} 
                          alt={offer.title} 
                          className="h-full w-full object-cover" 
                          crossOrigin="anonymous" 
                        />
                      ) : product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={offer.title} 
                          className="h-full w-full object-contain bg-white p-4" 
                          crossOrigin="anonymous" 
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {/* Condition badge - top left */}
                      {conditionBadge && typeof conditionBadge === 'string' && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold uppercase">
                            {conditionBadge}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content section */}
                    <div className="p-4">
                      {/* Title and location row */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            {offer.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.brand || product.subcategory} {product.model ? `. ${product.model}` : ""}
                          </p>
                        </div>
                        {locationDisplay && (
                          <div className="flex-shrink-0 text-right">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Location</p>
                            <p className="text-sm font-medium text-primary">{locationDisplay}</p>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {offer.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {offer.description}
                        </p>
                      )}

                      {/* Divider */}
                      <div className="h-px bg-border/50 my-3" />

                      {/* Bottom row: Hooked thumbnails + Hook button */}
                      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        {/* Hooked offer thumbnails preview */}
                        <div className="flex items-center gap-2">
                          {hookedOfferThumbnails.length > 0 && (
                            <div className="flex -space-x-2">
                              {hookedOfferThumbnails.map((thumbnail, idx) => (
                                <div 
                                  key={idx}
                                  className="h-6 w-6 rounded-md bg-secondary border border-background overflow-hidden flex-shrink-0"
                                >
                                  {thumbnail.image ? (
                                    <img 
                                      src={thumbnail.image} 
                                      alt={thumbnail.title}
                                      className="h-full w-full object-cover"
                                      crossOrigin="anonymous"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-muted">
                                      <Package className="h-3 w-3 text-muted-foreground/50" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {offer.outgoingHookCount > 0 && (
                            <button 
                              onClick={() => setViewDetailsOfferId(offer.offerId)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                              {offer.outgoingHookCount > hookedOfferThumbnails.length && (
                                <span className="bg-muted rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                                  +{offer.outgoingHookCount - hookedOfferThumbnails.length}
                                </span>
                              )}
                              <span className="uppercase text-[10px] tracking-wider">Details</span>
                              <span>&rarr;</span>
                            </button>
                          )}
                        </div>

                        {/* Hook button - only for other users' offers */}
                        {!isOwn && (
                          !hasOffers ? (
                            <button 
                              disabled 
                              className="rounded-full bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 cursor-not-allowed"
                            >
                              Hook
                            </button>
                          ) : !hasMatchingTypeOffers ? (
                            <button 
                              disabled 
                              className="rounded-full bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 cursor-not-allowed"
                            >
                              Hook
                            </button>
                          ) : isAlreadyHooked ? (
                            <span className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Hooked
                            </span>
                          ) : (
                            <button 
                              onClick={() => setHookTargetOfferId(offer.offerId)} 
                              className="rounded-full bg-muted hover:bg-primary/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors"
                            >
                              Hook
                            </button>
                          )
                        )}

                        {/* Own offer actions */}
                        {isOwn && (
                          <div className="flex items-center gap-2">
                            {showConfirmPickup && (
                              <button 
                                onClick={() => setPickupOfferId(offer.offerId)} 
                                className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                              >
                                Confirm Pickup
                              </button>
                            )}
                            {showPickupConfirmed && (
                              <button 
                                onClick={() => setPickupOfferId(offer.offerId)} 
                                className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors flex items-center gap-1.5"
                              >
                                <span>Confirmed</span>
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Own offer hooks accordion */}
                    {isOwn && offerHooks.length > 0 && (
                      <>
                        <div className="border-t border-border/50">
                          <button
                            onClick={(e) => { e.stopPropagation(); setHooksExpandedOfferId(hooksExpandedOfferId === offer.offerId ? null : offer.offerId); }}
                            className="w-full flex items-center justify-between px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <span className="text-xs font-medium uppercase tracking-wider">
                              Your Hooks ({offerHooks.length}/3)
                            </span>
                            {hooksExpandedOfferId === offer.offerId ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {hooksExpandedOfferId === offer.offerId && (
                          <div className="border-t border-border bg-secondary/20 p-3" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-2">
                              {offerHooks.map((hook) => {
                                const targetOffer = getOfferById(hook.toOfferId);
                                if (!targetOffer) return null;
                                const targetProduct = products.find((p) => p.productId === targetOffer.productId);
                                const canUnhook = hook.lockLevel === 0 && hook.isActive;

                                // Map hook status to display labels
                                const hookStatusLabel = hook.status === "reserved" ? "RESERVED" : 
                                                         hook.status === "processing" ? "PROCESSING" :
                                                         hook.status === "searching" ? "AWAITING" :
                                                         hook.status === "cycle_found" ? "CYCLE FOUND" :
                                                         hook.status === "exchanged" ? "EXCHANGED" : "EXPIRED";

                                return (
                                  <div 
                                    key={hook.hookId} 
                                    className="rounded-lg border border-border bg-card overflow-hidden"
                                    style={{ boxShadow: '0 4px 0 0 hsl(var(--primary) / 0.6)' }} // Yellow accent
                                  >
                                    <div className="p-3">
                                      <div className="flex gap-2.5 items-center">
                                        {/* Small thumbnail */}
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                                          {targetOffer.images && targetOffer.images.length > 0 ? (
                                            <img
                                              src={targetOffer.images[0].url}
                                              alt={targetOffer.title}
                                              className="h-full w-full object-cover"
                                              crossOrigin="anonymous"
                                            />
                                          ) : targetProduct?.imageUrl ? (
                                            <img
                                              src={targetProduct.imageUrl}
                                              alt={targetOffer.title}
                                              className="h-full w-full object-contain"
                                              crossOrigin="anonymous"
                                            />
                                          ) : (
                                            <Package className="h-5 w-5 text-muted-foreground/40" />
                                          )}
                                        </div>

                                        {/* Offer info with status indicator */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                              hook.status === "reserved" || hook.status === "processing" ? "bg-primary" :
                                              hook.status === "searching" || hook.status === "cycle_found" ? "bg-blue-500" :
                                              "bg-muted-foreground"
                                            }`} />
                                            <p className="text-sm font-medium text-foreground truncate">
                                              {targetOffer.title}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-xs font-medium uppercase ${
                                              hook.status === "reserved" ? "text-primary" :
                                              hook.status === "processing" ? "text-blue-500" :
                                              "text-muted-foreground"
                                            }`}>
                                              {hookStatusLabel}
                                            </span>
                                            {targetOffer.pickupAddress?.city && (
                                              <>
                                                <span className="text-muted-foreground">.</span>
                                                <span className="text-xs text-muted-foreground">
                                                  {targetOffer.pickupAddress.city}, {targetOffer.pickupAddress.country?.substring(0, 2).toUpperCase() || ""}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {/* Unhook / Locked button */}
                                        <button
                                          onClick={() => canUnhook && setShowUnhookDialog({ hookId: hook.hookId, offerTitle: targetOffer.title })}
                                          disabled={!canUnhook || unhookingId === hook.hookId}
                                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            canUnhook && unhookingId !== hook.hookId
                                              ? "bg-muted/50 text-foreground hover:bg-muted"
                                              : "text-muted-foreground/60"
                                          }`}
                                        >
                                          {unhookingId === hook.hookId ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : canUnhook ? "UNHOOK" : "LOCKED"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
      </div>

      {hookTargetOfferId && <HookOfferModal targetOfferId={hookTargetOfferId} onClose={() => setHookTargetOfferId(null)} />}
      {pickupOfferId && <PickupReadinessModal offerId={pickupOfferId} onClose={() => setPickupOfferId(null)} />}

      {/* Unhook Confirmation Dialog */}
      <AlertDialog open={!!showUnhookDialog} onOpenChange={(open) => !open && setShowUnhookDialog(null)}>
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
              onClick={() => showUnhookDialog && handleUnhook(showUnhookDialog.hookId)}
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
