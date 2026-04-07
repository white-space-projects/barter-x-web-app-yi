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
import type { Product, HookStatus, Hook, Offer } from "@/lib/types";
import { LOCK_LEVEL_LABELS, LOCK_LEVEL_COLORS, LOCK_LEVEL_BG_COLORS } from "@/lib/types";
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

  // Fetch offer from API when editing (DB is single source of truth)
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

          {offers.length === 0 && !showInlineAdd ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {offers.map((offer) => {
                const isOwn = offer.ownerUserId === auth.user?.userId;
                const displayStatus = isOwn ? getOfferDisplayStatus(offer.offerId) : null;
const showConfirmPickup = isOwn && hasReservedHook(offer.offerId) && !offer.readyState;
                  const showPickupConfirmed = isOwn && offer.readyState;
                  const showPickupDate = isOwn && offer.readyState && offer.pickupReadyDate;
                
                return (
                  <div 
                    key={offer.offerId} 
                    className="rounded-xl border border-border bg-card overflow-hidden w-full card-shadow-primary cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => {
                      // Click anywhere on card opens offer details
                      setViewDetailsOfferId(offer.offerId);
                    }}
                  >
                    <div className="p-4 min-h-[88px]">
                      <div className="flex gap-3">
                        {/* Image - offer images as-is, product images on white background */}
                        {offer.images && offer.images.length > 0 ? (
                          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                            <img src={offer.images[0].url} alt={offer.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
                          </div>
                        ) : (
                          <ProductImage src={product.imageUrl} alt={offer.title} size="md" />
                        )}

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-sm font-medium text-foreground truncate">{offer.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {product.subcategory} <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" /> {product.brand}
                          </p>
                          <p className="text-xs text-primary font-medium">
                            {isOwn 
                              ? `Hooks ${offer.outgoingHookCount}/3` 
                              : offer.outgoingHookCount === 0 
                                ? "Not hooked yet"
                                : `Hooked to ${offer.outgoingHookCount} ${offer.outgoingHookCount === 1 ? "offer" : "offers"}`
                            }
                          </p>
                        </div>

                        <div className="flex flex-col items-end justify-start flex-shrink-0 gap-1">
                          {showPickupDate && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPickupOfferId(offer.offerId); }} 
                              className="text-xs text-primary hover:underline"
                            >
                              Pickup: <span className="underline">{offer.pickupReadyDate}</span>
                            </button>
                          )}
                          
                          {displayStatus && (
                            <p className={`text-xs font-medium ${HOOK_STATUS_COLORS[displayStatus]}`}>{HOOK_STATUS_LABELS[displayStatus]}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border/50 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                        {isOwn ? (
                          <>
                            {showConfirmPickup && (
                              <div className="flex justify-end">
                                <button onClick={() => setPickupOfferId(offer.offerId)} className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                                  Confirm Pickup Readiness
                                </button>
                              </div>
                            )}
                            {showPickupConfirmed && (
                              <div className="flex justify-end">
                                <button onClick={() => setPickupOfferId(offer.offerId)} className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors flex items-center gap-1.5">
                                  <span>Pickup Confirmed</span>
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            {/* Hooks accordion toggle */}
                            {(() => {
                              const offerHooks = getHooksByFromOffer(offer.offerId);
                              return offerHooks.length > 0 ? (
                                <button
                                  onClick={() => setHooksExpandedOfferId(hooksExpandedOfferId === offer.offerId ? null : offer.offerId)}
                                  className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                                >
                                  <span>Your Hooks ({offerHooks.length}/3)</span>
                                  {hooksExpandedOfferId === offer.offerId ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No hooks yet</span>
                              );
                            })()}
                          </>
                        ) : !hasOffers ? (
                          <div className="text-right">
                            <button disabled className="rounded-md bg-primary/40 px-3 py-1.5 text-xs font-medium text-primary-foreground/60 cursor-not-allowed">Hook this offer</button>
                            <p className="mt-1 text-xs text-muted-foreground">Add an offer first to hook this one.</p>
                          </div>
                        ) : !hasMatchingTypeOffers ? (
                          <div className="text-right">
                            <button disabled className="rounded-md bg-primary/40 px-3 py-1.5 text-xs font-medium text-primary-foreground/60 cursor-not-allowed">Hook this offer</button>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Add a <span className="font-medium">{getProductTypeName(product.productType)}</span> offer to hook.
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 justify-end">
                            {(() => {
                              const { canRequest, myMatchingOffer } = canRequestDirectExchange(offer.offerId);
                              if (canRequest && myMatchingOffer) {
                                return (
                                  <button onClick={() => handleRequestDirectExchange(offer, myMatchingOffer)} className="flex items-center gap-1 rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                                    <ArrowRightLeft className="h-3 w-3" />
                                    Request Direct Exchange
                                  </button>
                                );
                              }
                              return null;
                            })()}
                            <button onClick={() => setHookTargetOfferId(offer.offerId)} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                              Hook this offer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded hooks section for own offers */}
                    {isOwn && hooksExpandedOfferId === offer.offerId && (() => {
                      const offerHooks = getHooksByFromOffer(offer.offerId);
                      return offerHooks.length > 0 ? (
                        <div className="border-t border-border bg-secondary/20 p-3" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-2">
                            {offerHooks.map((hook) => {
                              const targetOffer = getOfferById(hook.toOfferId);
                              if (!targetOffer) return null;
                              const targetProduct = products.find((p) => p.productId === targetOffer.productId);
                              const canUnhook = hook.lockLevel === 0 && hook.isActive;

                              return (
                                <div key={hook.hookId} className="rounded-lg border border-border bg-card overflow-hidden">
                                  <div className="p-3">
                                    <div className="flex gap-2.5 items-center">
                                      {/* 48x48 Image - offer images as-is, product images on white */}
                                      {targetOffer.images && targetOffer.images.length > 0 ? (
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                                          <img
                                            src={targetOffer.images[0].url}
                                            alt={targetOffer.title}
                                            className="h-full w-full object-cover"
                                            crossOrigin="anonymous"
                                          />
                                        </div>
                                      ) : (
                                        <ProductImage 
                                          src={targetProduct?.imageUrl} 
                                          alt={targetOffer.title} 
                                          size="sm"
                                          className="h-12 w-12"
                                        />
                                      )}

                                      {/* Offer info */}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {targetOffer.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {targetProduct?.subcategory} . {targetProduct?.brand}
                                        </p>
                                      </div>

                                      {/* Offer status badge */}
                                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${LOCK_LEVEL_BG_COLORS[targetOffer.lockLevel]} ${LOCK_LEVEL_COLORS[targetOffer.lockLevel]}`}>
                                        {LOCK_LEVEL_LABELS[targetOffer.lockLevel]}
                                      </span>
                                    </div>

                                    {/* Hook status and unhook action */}
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                      {/* Hook status */}
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground">Hook:</span>
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${HOOK_STATUS_BG_COLORS[hook.status]} ${HOOK_STATUS_COLORS[hook.status]}`}>
                                          {HOOK_STATUS_LABELS[hook.status]}
                                        </span>
                                      </div>

                                      {/* Unhook button */}
                                      <button
                                        onClick={() => canUnhook && setShowUnhookDialog({ hookId: hook.hookId, offerTitle: targetOffer.title })}
                                        disabled={!canUnhook || unhookingId === hook.hookId}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                          canUnhook && unhookingId !== hook.hookId
                                            ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30" 
                                            : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed border border-transparent"
                                        }`}
                                      >
                                        {unhookingId === hook.hookId ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Link2Off className="h-3 w-3" />
                                        )}
                                        Unhook
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null;
                    })()}
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
