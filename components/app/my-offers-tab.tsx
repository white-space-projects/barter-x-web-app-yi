"use client";

import { useState, useMemo } from "react";
import { Package, ChevronDown, ChevronUp, MapPin, MessageSquare, Pencil, MoreHorizontal, X, Link2Off } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import type { HookStatus } from "@/lib/types";
import { PickupReadinessModal } from "./pickup-readiness-modal";
import { EditOfferModal } from "./edit-offer-modal";
import { toast } from "sonner";

/**
 * MY OFFERS TAB
 * Shows all offers owned by the current user with management features.
 * 
 * BACKEND INTEGRATION:
 * - GET /api/offers/mine - Fetch user's offers (with pagination)
 * - DELETE /api/hooks/:id - Remove a hook
 * - POST /api/conversations - Get or create conversation
 */

// Hook status display colors
const HOOK_STATUS_COLORS: Record<HookStatus, string> = {
  searching: "text-muted-foreground",
  cycle_found: "text-primary",
  reserved: "text-primary",
  processing: "text-[#3b82f6]",
  exchanged: "text-muted-foreground",
  expired: "text-destructive",
};

// Hook status display labels
const HOOK_STATUS_LABELS: Record<HookStatus, string> = {
  searching: "Searching",
  cycle_found: "Cycle Found",
  reserved: "Reserved",
  processing: "Committed",
  exchanged: "Exchanged",
  expired: "Expired",
};

export function MyOffersTab() {
  const { getMyOffers, getHooksByFromOffer, getOfferById, removeHook, updateHook, updateOffer, products, addNotification, getOrCreateConversation } =
    useBarterStore();
  
  // Memoize my offers to prevent recalculation on every render
  const myOffers = useMemo(() => getMyOffers(), [getMyOffers]);

  // Sub-tab state: "open" or "closed"
  const [activeSubTab, setActiveSubTab] = useState<"open" | "closed">("open");
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [pickupOffer, setPickupOffer] = useState<string | null>(null);
  const [editOffer, setEditOffer] = useState<string | null>(null);

  // Helper: Get product for an offer
  function getProductForOffer(offer: { productId: string }) {
    return products.find((p) => p.productId === offer.productId);
  }

  // Helper: Check if offer has any hook with "exchanged" status
  function hasExchangedHook(offerId: string): boolean {
    const hooks = getHooksByFromOffer(offerId);
    return hooks.some((h) => h.status === "exchanged");
  }

  // Helper: Check if offer has any hook with "reserved" status
  function hasReservedHook(offerId: string): boolean {
    const hooks = getHooksByFromOffer(offerId);
    return hooks.some((h) => h.status === "reserved");
  }

  // Helper: Check if offer has any hook with "processing" status
  function hasProcessingHook(offerId: string): boolean {
    const hooks = getHooksByFromOffer(offerId);
    return hooks.some((h) => h.status === "processing");
  }

  // Helper: Get highest priority status for display
  function getOfferDisplayStatus(offerId: string): HookStatus | null {
    const hooks = getHooksByFromOffer(offerId);
    if (hooks.some((h) => h.status === "processing")) return "processing";
    if (hooks.some((h) => h.status === "reserved")) return "reserved";
    return null;
  }

  // Helper: Get exchanged hook for closed offers
  function getExchangedHook(offerId: string) {
    const hooks = getHooksByFromOffer(offerId);
    return hooks.find((h) => h.status === "exchanged");
  }

  // Split offers: "open" = no exchanged hooks, "closed" = has an exchanged hook
  const { openOffers, closedOffers } = useMemo(() => ({
    openOffers: myOffers.filter((o) => !hasExchangedHook(o.offerId)),
    closedOffers: myOffers.filter((o) => hasExchangedHook(o.offerId)),
  }), [myOffers]);

  const displayedOffers = activeSubTab === "open" ? openOffers : closedOffers;

  // Handle unhook action
  function handleUnhook(hookId: string) {
    removeHook(hookId);
    toast.success("Hook removed successfully");
  }

  // Handle open chat action
  function handleOpenChat(hookId: string, myOfferId: string, targetOfferId: string) {
    const targetOffer = getOfferById(targetOfferId);
    if (!targetOffer) return;
    
    getOrCreateConversation(hookId, myOfferId, targetOfferId, targetOffer.ownerUserId);
    toast.info("Chat opened. Check the Chat tab.");
  }

  return (
    <div className="w-full">
      {/* Sub-tabs: Open Offers / Closed Offers */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveSubTab("open")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeSubTab === "open"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Open Offers
        </button>
        <button
          onClick={() => setActiveSubTab("closed")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeSubTab === "closed"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Closed Offers
        </button>
      </div>

      {/* Offers list */}
      {displayedOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">
            {activeSubTab === "open"
              ? "No open offers."
              : "No closed offers yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {displayedOffers.map((offer) => {
            const product = getProductForOffer(offer);
            const hooks = getHooksByFromOffer(offer.offerId);
            const isExpanded = expandedOffer === offer.offerId;
            const displayStatus = activeSubTab === "open" ? getOfferDisplayStatus(offer.offerId) : null;
            const exchangedHook = activeSubTab === "closed" ? getExchangedHook(offer.offerId) : null;
            const exchangedTargetOffer = exchangedHook ? getOfferById(exchangedHook.toOfferId) : null;
            const showConfirmPickup = activeSubTab === "open" && hasReservedHook(offer.offerId) && !offer.readyForCommit;
            const showPickupDate = activeSubTab === "open" && (hasProcessingHook(offer.offerId) || offer.readyForCommit) && offer.pickupReadyDate;

            return (
              <div
                key={offer.offerId}
                className="rounded-xl border border-border bg-card overflow-hidden w-full card-shadow-primary"
              >
                <div className="p-4 min-h-[88px]">
                  <div className="flex gap-3">
                    {/* 64x64 Image - show offer's first image if available, else product image */}
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
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
                        <Package className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-medium text-foreground truncate">
                        {offer.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product?.subcategory} . {product?.brand}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hooks {offer.outgoingHookCount}/3
                      </p>
                    </div>

                    {/* Right side: actions + status */}
                    <div className="flex flex-col items-end justify-start flex-shrink-0 gap-1">
                      {/* Pickup date (clickable to edit) - shown at top when confirmed */}
                      {showPickupDate && (
                        <button
                          onClick={() => setPickupOffer(offer.offerId)}
                          className="text-xs text-primary hover:underline"
                        >
                          Pickup: <span className="underline">{offer.pickupReadyDate}</span>
                        </button>
                      )}

                      {/* Edit and expand buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditOffer(offer.offerId)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit offer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setExpandedOffer(isExpanded ? null : offer.offerId)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Status badge (only if reserved or processing/committed) */}
                      {displayStatus && (
                        <p className={`text-xs font-medium ${HOOK_STATUS_COLORS[displayStatus]}`}>
                          {HOOK_STATUS_LABELS[displayStatus]}
                        </p>
                      )}
                      {activeSubTab === "closed" && (
                        <p className="text-xs font-medium text-muted-foreground">
                          Exchanged
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Confirm Pickup button - positioned same as "Hook this offer" */}
                  {showConfirmPickup && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex justify-end">
                      <button
                        onClick={() => setPickupOffer(offer.offerId)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Confirm Pickup Readiness
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded section: outgoing hooks */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/30 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Your Outgoing Hooks ({hooks.length}/3)
                      </p>
                      <button
                        onClick={() => setExpandedOffer(null)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {hooks.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        No hooks yet. Browse products to hook offers.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {hooks.map((hook) => {
                          const targetOffer = getOfferById(hook.toOfferId);
                          const targetProduct = targetOffer
                            ? products.find((p) => p.productId === targetOffer.productId)
                            : null;

                          return (
                            <div
                              key={hook.hookId}
                              className="rounded-lg border border-border bg-card p-3"
                            >
                              <div className="flex gap-3">
                                {/* Target offer image */}
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                                  {targetProduct?.imageUrl ? (
                                    <img
                                      src={targetProduct.imageUrl}
                                      alt={targetOffer?.title}
                                      className="h-full w-full object-cover"
                                      crossOrigin="anonymous"
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 text-muted-foreground/40" />
                                  )}
                                </div>

                                {/* Target offer info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {targetOffer?.title || "Unknown Offer"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {targetProduct?.subcategory} . {targetProduct?.brand}
                                  </p>
                                  {hook.targetUserDistance && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <MapPin className="h-3 w-3" />
                                      {hook.targetUserDistance} km away
                                    </p>
                                  )}
                                </div>

                                {/* Hook status and actions */}
                                <div className="flex flex-col items-end gap-1">
                                  <p className={`text-xs font-medium ${HOOK_STATUS_COLORS[hook.status]}`}>
                                    {HOOK_STATUS_LABELS[hook.status]}
                                  </p>

                                  {/* Actions based on status */}
                                  {hook.status === "searching" && (
                                    <button
                                      onClick={() => handleUnhook(hook.hookId)}
                                      className="flex items-center gap-1 text-xs text-destructive hover:underline"
                                    >
                                      <Link2Off className="h-3 w-3" />
                                      Unhook
                                    </button>
                                  )}
                                  {(hook.status === "reserved" || hook.status === "processing") && (
                                    <button
                                      onClick={() => handleOpenChat(hook.hookId, offer.offerId, hook.toOfferId)}
                                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                      Chat via Chat tab
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Show pickup address if hook is processing/committed */}
                              {hook.status === "processing" && targetOffer?.pickupAddress && (
                                <div className="mt-2 pt-2 border-t border-border/50">
                                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span>
                                      <strong>Pickup Address:</strong><br />
                                      {targetOffer.pickupAddress.street}, {targetOffer.pickupAddress.city}, {targetOffer.pickupAddress.state}, {targetOffer.pickupAddress.postalCode}, {targetOffer.pickupAddress.country}
                                    </span>
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Closed offer: show exchanged with info */}
                {activeSubTab === "closed" && exchangedTargetOffer && (
                  <div className="border-t border-border bg-secondary/30 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      Exchanged With
                    </p>
                    <div className="flex gap-3 items-center">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                        <Package className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {exchangedTargetOffer.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Completed on {exchangedHook?.exchangedDate || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {pickupOffer && (
        <PickupReadinessModal
          offerId={pickupOffer}
          onClose={() => setPickupOffer(null)}
        />
      )}
      {editOffer && (
        <EditOfferModal
          offerId={editOffer}
          onClose={() => setEditOffer(null)}
        />
      )}
    </div>
  );
}
