"use client";

import { useState, useMemo } from "react";
import { X, AlertCircle, Package, MoreHorizontal, Eye, ArrowRightLeft, Pencil, Plus } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import type { Product, HookStatus } from "@/lib/types";
import { HookOfferModal } from "./hook-offer-modal";
import { OfferDetailsModal } from "./offer-details-modal";
import { InlineAddOffer } from "./inline-add-offer";
import { PickupReadinessModal } from "./pickup-readiness-modal";
import { EditOfferModal } from "./edit-offer-modal";
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

type Props = {
  product: Product;
  onClose: () => void;
};

// VIEW OFFERS PANEL - Displays all offers within a product
// Shows different actions based on ownership (owner vs other users)
export function ViewOffersPanel({ product, onClose }: Props) {
  const { getOffersByProduct, auth, products, hooks, getOfferById, getProductById, addNotification, getHooksByFromOffer, getMyOffers } = useBarterStore();
  const offers = getOffersByProduct(product.productId);
  
  const [hookTargetOfferId, setHookTargetOfferId] = useState<string | null>(null);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const [viewDetailsOfferId, setViewDetailsOfferId] = useState<string | null>(null);
  const [navigateToProductId, setNavigateToProductId] = useState<string | null>(null);
  const [pickupOfferId, setPickupOfferId] = useState<string | null>(null);
  const [editOfferId, setEditOfferId] = useState<string | null>(null);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  
  const navigateToProduct = navigateToProductId ? products.find((p) => p.productId === navigateToProductId) : null;
  const myOffers = useMemo(() => getMyOffers(), [getMyOffers]);
  const hasOffers = myOffers.length > 0;
  
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

  return (
    <>
      {/* On mobile: fixed full-screen overlay. On desktop: inline panel that fills content area */}
      {/* Mobile backdrop */}
      <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden" onClick={onClose} />

      {/* Panel - fixed on mobile, absolute positioned within content on desktop */}
      <div className="fixed inset-0 z-50 bg-card overflow-y-auto lg:absolute lg:inset-0 lg:z-30">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-sm p-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">Offers for {product.title}</h2>
            <p className="text-xs text-muted-foreground truncate">{product.subcategory} / {product.brand}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInlineAdd(true)} 
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Offer
            </button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label="Close panel">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Inline Add Offer Form - shows when Add Offer is clicked */}
          {showInlineAdd && (
            <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">Add New Offer</h3>
                <button 
                  onClick={() => setShowInlineAdd(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <InlineAddOffer 
                product={product} 
                onClose={() => setShowInlineAdd(false)}
                onOfferAdded={() => setShowInlineAdd(false)}
              />
            </div>
          )}

          {offers.length === 0 && !showInlineAdd ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <AlertCircle className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">No offers yet for this product.</p>
              <button 
                onClick={() => setShowInlineAdd(true)}
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
                const isExpanded = expandedOfferId === offer.offerId;
                const displayStatus = isOwn ? getOfferDisplayStatus(offer.offerId) : null;
                const showConfirmPickup = isOwn && hasReservedHook(offer.offerId) && !offer.readyForCommit;
                const showPickupDate = isOwn && offer.readyForCommit && offer.pickupReadyDate;
                
                return (
                  <div 
                    key={offer.offerId} 
                    className="rounded-xl border border-border bg-card overflow-hidden w-full card-shadow-primary cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => {
                      // On desktop, toggle expand; on mobile, do nothing (use 3-dots)
                      if (window.innerWidth >= 640) {
                        setExpandedOfferId(isExpanded ? null : offer.offerId);
                      }
                    }}
                  >
                    <div className="p-4 min-h-[88px]">
                      <div className="flex gap-3">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                          {offer.images && offer.images.length > 0 ? (
                            <img src={offer.images[0].url} alt={offer.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
                          ) : product.imageUrl ? (
                            <img src={product.imageUrl} alt={offer.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground/40" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-sm font-medium text-foreground truncate">{offer.title}</p>
                          <p className="text-xs text-muted-foreground">{product.subcategory} . {product.brand}</p>
                          <p className="text-xs text-muted-foreground">
                            {isOwn ? `Hooks ${offer.outgoingHookCount}/3` : `${offer.hookedCount} ${offer.hookedCount === 1 ? "person" : "people"} hooked this`}
                          </p>
                        </div>

                        <div className="flex flex-col items-end justify-start flex-shrink-0 gap-1">
                          {showPickupDate && (
                            <button onClick={() => setPickupOfferId(offer.offerId)} className="text-xs text-primary hover:underline">
                              Pickup: <span className="underline">{offer.pickupReadyDate}</span>
                            </button>
                          )}
                          
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setViewDetailsOfferId(offer.offerId)} className="p-1.5 rounded-md text-primary border border-primary/30 hover:bg-primary/10 transition-colors" title="View offer details">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {isOwn && (
                              <button onClick={() => setEditOfferId(offer.offerId)} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Edit offer">
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {/* 3-dots menu - mobile only, on desktop click card to expand */}
                            <button onClick={() => setExpandedOfferId(isExpanded ? null : offer.offerId)} className="p-1 text-muted-foreground hover:text-foreground transition-colors sm:hidden">
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          </div>
                          
                          {displayStatus && (
                            <p className={`text-xs font-medium ${HOOK_STATUS_COLORS[displayStatus]}`}>{HOOK_STATUS_LABELS[displayStatus]}</p>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Description:</p>
                          <p className="text-sm text-foreground">{offer.description}</p>
                          <p className="mt-2 text-xs text-muted-foreground/70 italic">Pickup address will be visible after hook is reserved and pickup is confirmed.</p>
                        </div>
                      )}

                      <div className="mt-3 pt-2 border-t border-border/50 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                        {isOwn ? (
                          showConfirmPickup ? (
                            <div className="flex justify-end">
                              <button onClick={() => setPickupOfferId(offer.offerId)} className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                                Confirm Pickup Readiness
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic text-right">This is your offer</span>
                          )
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
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {hookTargetOfferId && <HookOfferModal targetOfferId={hookTargetOfferId} onClose={() => setHookTargetOfferId(null)} />}
      {pickupOfferId && <PickupReadinessModal offerId={pickupOfferId} onClose={() => setPickupOfferId(null)} />}
      {editOfferId && <EditOfferModal offerId={editOfferId} onClose={() => setEditOfferId(null)} />}
      {viewDetailsOfferId && (
        <OfferDetailsModal
          offerId={viewDetailsOfferId}
          onClose={() => setViewDetailsOfferId(null)}
          onNavigateToProduct={(productId) => {
            setViewDetailsOfferId(null);
            setNavigateToProductId(productId);
          }}
        />
      )}

      {navigateToProduct && (
        <div className="fixed inset-0 lg:left-56 z-[80] bg-background/70 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Add offer to {navigateToProduct.title}</h3>
                <p className="text-xs text-muted-foreground">{navigateToProduct.subcategory} / {navigateToProduct.brand}</p>
              </div>
              <button onClick={() => setNavigateToProductId(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <InlineAddOffer product={navigateToProduct} onOfferAdded={() => setNavigateToProductId(null)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
