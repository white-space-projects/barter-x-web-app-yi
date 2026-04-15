"use client";

import { useState, useMemo, useEffect } from "react";
import { Package, ChevronDown, ChevronUp, MapPin, MessageSquare, Pencil, MoreHorizontal, X, Link2Off, Eye, Trash2 } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { useBarterData } from "@/lib/data-provider";
import type { HookStatus, LockLevel, Offer, Product } from "@/lib/types";
import { OfferCardShimmer } from "./offer-card-shimmer";
import { LOCK_LEVEL_LABELS, LOCK_LEVEL_COLORS, LOCK_LEVEL_BG_COLORS, LOCK_LEVEL_HELPER_TEXT } from "@/lib/types";
import { PickupReadinessModal } from "./pickup-readiness-modal";
import { AddOfferFlow } from "./add-offer-flow";
import { ViewOfferDetails } from "./view-offer-details";
import { ProductImage } from "./product-image";
import { toast } from "sonner";
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

// Hook status background colors
const HOOK_STATUS_BG_COLORS: Record<HookStatus, string> = {
  searching: "bg-blue-500/10",
  cycle_found: "bg-purple-500/10",
  reserved: "bg-yellow-500/10",
  processing: "bg-orange-500/10",
  exchanged: "bg-green-500/10",
  expired: "bg-muted/50",
};

// My Offer status labels based on lock_level (per design spec)
const MY_OFFER_STATUS_LABELS: Record<LockLevel, string | null> = {
  0: null,              // No status label for lock_level 0
  1: "Cycle formed",    // lock_level 1
  2: "Exchange initiated", // lock_level 2  
  3: "Exchange complete",  // lock_level 3
};

// Progress bar stage mapping (1-3)
const PROGRESS_STAGES: Record<LockLevel, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
};

export function MyOffersTab() {
  const { getMyOffers, getHooksByFromOffer, getOfferById, removeHook, updateHook, updateOffer, products, addNotification, getOrCreateConversation } =
    useBarterStore();
  
  // Get loading state from data provider
  const { offersLoading } = useBarterData();
  
  // Memoize my offers to prevent recalculation on every render
  const myOffers = useMemo(() => getMyOffers(), [getMyOffers]);

  // Sub-tab state: "open" or "closed"
  const [activeSubTab, setActiveSubTab] = useState<"open" | "closed">("open");
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [pickupOffer, setPickupOffer] = useState<string | null>(null);
  const [editOffer, setEditOffer] = useState<string | null>(null);
  const [viewOffer, setViewOffer] = useState<string | null>(null);
  const [mobileMenuOffer, setMobileMenuOffer] = useState<string | null>(null);
  // For adding an offer to a linked product from ViewOfferDetails
  const [addOfferToProduct, setAddOfferToProduct] = useState<Product | null>(null);
  // Delete confirmation dialog
  const [deleteOfferDialog, setDeleteOfferDialog] = useState<{ offerId: string; title: string } | null>(null);
  
  // Fetch offer from API when editing (DB is single source of truth)
  // MUST be declared here before any conditional returns to follow Rules of Hooks
  const [offerToEdit, setOfferToEdit] = useState<Offer | null>(null);
  const [loadingEditOffer, setLoadingEditOffer] = useState(false);
  
  useEffect(() => {
    if (editOffer) {
      setLoadingEditOffer(true);
      fetch(`/api/data/offers/${editOffer}`)
        .then(res => res.json())
        .then(data => {
          if (data.offer) {
            // Merge with store data for images (not yet in DB)
            const storeOffer = getOfferById(editOffer);
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
  }, [editOffer, getOfferById]);

  // Helper: Get product for an offer
  function getProductForOffer(offer: { productId: string }) {
    return products.find((p) => p.productId === offer.productId);
  }

  // Helper: Check if an offer can be modified (not locked)
  function canModifyOffer(offer: { lockLevel: LockLevel; isActive: boolean }): boolean {
    return offer.lockLevel === 0 && offer.isActive;
  }

  // Helper: Check if an offer can be hooked to
  function canHookOffer(offer: { lockLevel: LockLevel; isActive: boolean }): boolean {
    return offer.lockLevel <= 1 && offer.isActive;
  }

  // Helper: Check if a hook can be removed
  function canRemoveHook(hook: { lockLevel: LockLevel; isActive: boolean }): boolean {
    return hook.lockLevel === 0 && hook.isActive;
  }

  // Helper: Check if readiness can be confirmed (lockLevel == 1)
  function canConfirmReadiness(offer: { lockLevel: LockLevel; isActive: boolean; readyState: boolean }): boolean {
    return offer.lockLevel === 1 && offer.isActive && !offer.readyState;
  }

  // Helper: Check if readiness can be toggled off (only at lockLevel 1)
  function canToggleReadinessOff(offer: { lockLevel: LockLevel; readyState: boolean }): boolean {
    return offer.lockLevel === 1 && offer.readyState;
  }

  // Helper: Get exchanged hook for closed offers
  function getExchangedHook(offerId: string) {
    const hooks = getHooksByFromOffer(offerId);
    return hooks.find((h) => h.status === "exchanged" || h.lockLevel === 3);
  }

  // Split offers using lockLevel:
  // Open Offers: isActive=true AND lockLevel is 0, 1, or 2
  // Closed Offers: lockLevel === 3 (EXCHANGED)
  const { openOffers, closedOffers } = useMemo(() => ({
    openOffers: myOffers.filter((o) => o.isActive && o.lockLevel < 3),
    closedOffers: myOffers.filter((o) => o.lockLevel === 3),
  }), [myOffers]);

  const displayedOffers = activeSubTab === "open" ? openOffers : closedOffers;

  // Handle unhook action - check lock level first
  function handleUnhook(hookId: string, hook: { lockLevel: LockLevel; isActive: boolean }) {
    if (!canRemoveHook(hook)) {
      toast.error("Cannot remove this hook - it is locked in a trade process");
      return;
    }
    removeHook(hookId);
    toast.success("Hook removed successfully");
  }

  // Handle deactivate/delete offer - soft delete using isActive
  function handleDeactivateOffer(offerId: string, offer: { lockLevel: LockLevel; isActive: boolean }) {
    if (!canModifyOffer(offer)) {
      toast.error("Cannot delete this offer - it is locked in a trade process");
      return;
    }
    updateOffer(offerId, { 
      isActive: false, 
      isActiveUpdatedAt: new Date().toISOString() 
    });
    toast.success("Offer deactivated");
  }

  // Handle confirm pickup readiness
  function handleConfirmReadiness(offerId: string) {
    updateOffer(offerId, {
      readyState: true,
      readyUpdatedAt: new Date().toISOString(),
    });
    toast.success("Pickup readiness confirmed");
  }

  // Handle toggle readiness off (only when lockLevel == 1)
  function handleUnconfirmReadiness(offerId: string) {
    updateOffer(offerId, {
      readyState: false,
      readyUpdatedAt: new Date().toISOString(),
    });
    toast.info("Pickup readiness removed");
  }

  // Handle open chat action
  function handleOpenChat(hookId: string, myOfferId: string, targetOfferId: string) {
    const targetOffer = getOfferById(targetOfferId);
    if (!targetOffer) return;
    
    getOrCreateConversation(hookId, myOfferId, targetOfferId, targetOffer.ownerUserId);
    toast.info("Chat opened. Check the Chat tab.");
  }

  // If viewing offer details, show ViewOfferDetails inline
  if (viewOffer) {
    return (
      <div className="w-full">
        <ViewOfferDetails
          offerId={viewOffer}
          onClose={() => setViewOffer(null)}
          onEdit={(offer) => {
            setViewOffer(null);
            setEditOffer(offer.offerId);
          }}
          onAddOfferToProduct={(product) => {
            setViewOffer(null);
            setAddOfferToProduct(product);
          }}
        />
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

  // If editing an offer, show embedded AddOfferFlow with editOffer prop
  if (editOffer && offerToEdit) {
    return (
      <div className="w-full">
        <AddOfferFlow
          open={true}
          onClose={() => setEditOffer(null)}
          onSuccess={() => setEditOffer(null)}
          editOffer={offerToEdit}
          embedded={true}
        />
      </div>
    );
  }
  
  // Show loading state while fetching offer for edit
  if (editOffer && loadingEditOffer) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground mt-4">Loading offer...</p>
        </div>
      </div>
    );
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

      {/* Offers list - show shimmer while loading */}
      {offersLoading ? (
        <OfferCardShimmer count={4} variant="my-offers" />
      ) : displayedOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">
            {activeSubTab === "open"
              ? "No open offers."
              : "No closed offers yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 items-start">
          {displayedOffers.map((offer) => {
            const product = getProductForOffer(offer);
            const hooks = getHooksByFromOffer(offer.offerId);
            const isExpanded = expandedOffer === offer.offerId;
            const exchangedHook = activeSubTab === "closed" ? getExchangedHook(offer.offerId) : null;
            const exchangedTargetOffer = exchangedHook ? getOfferById(exchangedHook.toOfferId) : null;
            
            // Workflow-based UI logic
            const showConfirmPickup = canConfirmReadiness(offer);
            const showReadyLabel = offer.readyState && offer.lockLevel >= 1;
            const canUnconfirmReady = canToggleReadinessOff(offer);
            const showPickupDate = offer.readyState && offer.pickupReadyDate;

            // My Offer Status Label
            const statusLabel = MY_OFFER_STATUS_LABELS[offer.lockLevel];
            const progressStage = PROGRESS_STAGES[offer.lockLevel];

            return (
              <div
                key={offer.offerId}
                className="rounded-xl border border-primary/30 bg-card overflow-hidden w-full card-shadow-primary relative"
              >
                {/* Card header with status label */}
                <div className="p-4">
                  {/* Status label at top if lock_level > 0 */}
                  {statusLabel && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {statusLabel}
                      </span>
                      {/* Lock level badge */}
                      <span className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-medium">
                        L{offer.lockLevel}
                      </span>
                    </div>
                  )}

{/* Main content: 64x64 image + info */}
                  <div 
                    className="flex gap-3 cursor-pointer"
                    onClick={() => setViewOffer(offer.offerId)}
                  >
                    {/* 64x64 Image */}
                    {offer.images && offer.images.length > 0 ? (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                        <img
                          src={offer.images[0].url}
                          alt={offer.title}
                          className="h-full w-full object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                    ) : (
                      <ProductImage 
                        src={product?.imageUrl} 
                        alt={offer.title} 
                        size="md"
                      />
                    )}

                    {/* Content - Title + Subcategory/Brand only (no description) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-base font-semibold text-foreground truncate">
                        {offer.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {product?.subcategory} · {product?.brand}
                      </p>
                    </div>
                  </div>

{/* Progress bar - only shown when lock_level > 0 */}
                  {progressStage > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-end mb-2">
                        <span className="text-xs font-medium text-primary">
                          {progressStage} / 3
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map((stage) => (
                          <div
                            key={stage}
                            className={`h-2 flex-1 rounded-full transition-colors ${
                              stage <= progressStage
                                ? "bg-primary"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirm Pickup button - full width when lock_level >= 1 */}
                  {showConfirmPickup && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPickupOffer(offer.offerId); }}
                      className="w-full mt-4 py-3 text-sm font-semibold uppercase tracking-wider rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
                    >
                      Confirm Pickup Readiness
                    </button>
                  )}
                  
                  {/* Pickup Confirmed indicator */}
                  {showReadyLabel && !showConfirmPickup && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPickupOffer(offer.offerId); }}
                      className="w-full mt-4 py-3 text-sm font-semibold uppercase tracking-wider rounded-full bg-green-500/20 text-green-500 border border-green-500/30 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Pickup Confirmed</span>
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  {/* Action buttons row: Edit, Delete, (3-dots for mobile) */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                    {/* Edit button - always visible, disabled when locked */}
                    <button
                      onClick={(e) => { e.stopPropagation(); canModifyOffer(offer) && setEditOffer(offer.offerId); }}
                      disabled={!canModifyOffer(offer)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        canModifyOffer(offer)
                          ? "bg-secondary text-foreground hover:bg-secondary/80"
                          : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                      }`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    {/* Delete button - always visible, disabled when locked */}
                    <button
                      onClick={(e) => { e.stopPropagation(); canModifyOffer(offer) && setDeleteOfferDialog({ offerId: offer.offerId, title: offer.title }); }}
                      disabled={!canModifyOffer(offer)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        canModifyOffer(offer)
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>

                    {/* Mobile 3-dots menu */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setMobileMenuOffer(offer.offerId); }}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors lg:hidden rounded-lg hover:bg-secondary"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Hooked Offers Accordion Section */}
                <div className="border-t border-border/50">
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedOffer(isExpanded ? null : offer.offerId); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="text-xs font-medium uppercase tracking-wider">
                      Hooked Offers ({hooks.length}/3)
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Expanded hooked offers - yellow accent for offer flow */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/20 px-4 py-3">
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

                          // Map hook status to display labels
                          const hookStatusLabel = hook.status === "reserved" ? "RESERVED" : 
                                                   hook.status === "processing" ? "PROCESSING" :
                                                   hook.status === "searching" ? "AWAITING" :
                                                   hook.status === "cycle_found" ? "CYCLE FOUND" :
                                                   hook.status === "exchanged" ? "EXCHANGED" : "EXPIRED";

                          return (
                            <div
                              key={hook.hookId}
                              className="rounded-lg border border-border bg-card overflow-hidden h-[88px]"
                              style={{ boxShadow: '0 4px 0 0 hsl(var(--primary) / 0.6)' }}
                            >
                              {/* Hooked offer row - 88px height, 64x64 image */}
                              <div className="p-3 h-full flex items-center">
                                <div className="flex gap-3 items-center w-full">
                                  {/* 64x64 Image */}
                                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                                    {targetOffer?.images && targetOffer.images.length > 0 ? (
                                      <img
                                        src={targetOffer.images[0].url}
                                        alt={targetOffer?.title}
                                        className="h-full w-full object-cover"
                                        crossOrigin="anonymous"
                                      />
                                    ) : targetProduct?.imageUrl ? (
                                      <img
                                        src={targetProduct.imageUrl}
                                        alt={targetOffer?.title}
                                        className="h-full w-full object-cover"
                                        crossOrigin="anonymous"
                                      />
                                    ) : (
                                      <Package className="h-6 w-6 text-muted-foreground/40" />
                                    )}
                                  </div>

                                  {/* Offer info: Title + Status pill + Location */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {targetOffer?.title || "Unknown Offer"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {/* Status pill */}
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                                        hook.status === "reserved" ? "bg-primary/20 text-primary" :
                                        hook.status === "processing" ? "bg-blue-500/20 text-blue-500" :
                                        hook.status === "searching" ? "bg-blue-500/10 text-blue-400" :
                                        hook.status === "cycle_found" ? "bg-purple-500/20 text-purple-400" :
                                        hook.status === "exchanged" ? "bg-green-500/20 text-green-500" :
                                        "bg-muted text-muted-foreground"
                                      }`}>
                                        {hookStatusLabel}
                                      </span>
                                      {/* Location */}
                                      {targetOffer?.pickupAddress?.city && (
                                        <>
                                          <span className="text-muted-foreground">·</span>
                                          <span className="text-xs text-muted-foreground">
                                            {targetOffer.pickupAddress.city}, {targetOffer.pickupAddress.country?.substring(0, 2).toUpperCase() || ""}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Unhook button - old style */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); canRemoveHook(hook) && handleUnhook(hook.hookId, hook); }}
                                    disabled={!canRemoveHook(hook)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors ${
                                      canRemoveHook(hook)
                                        ? "bg-muted text-foreground hover:bg-muted/80"
                                        : "text-muted-foreground/60"
                                    }`}
                                  >
                                    {canRemoveHook(hook) ? "Unhook" : "Locked"}
                                  </button>
                                </div>
                              </div>
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

      {/* Mobile Action Sheet Overlay */}
      {mobileMenuOffer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileMenuOffer(null)}
          />
          {/* Action Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
            <div className="space-y-1">
              <button
                onClick={() => {
                  setViewOffer(mobileMenuOffer);
                  setMobileMenuOffer(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors text-left"
              >
                <Eye className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">View offer details</span>
              </button>
              <button
                onClick={() => {
                  setEditOffer(mobileMenuOffer);
                  setMobileMenuOffer(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors text-left"
              >
                <Pencil className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Edit offer</span>
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOffer(null)}
              className="w-full mt-4 py-3 rounded-lg bg-secondary text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {pickupOffer && (
        <PickupReadinessModal
          offerId={pickupOffer}
          onClose={() => setPickupOffer(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOfferDialog} onOpenChange={(open) => !open && setDeleteOfferDialog(null)}>
        <AlertDialogContent className="max-w-[340px] rounded-xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Delete this offer?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will permanently remove &quot;{deleteOfferDialog?.title}&quot; from the marketplace. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => {
                if (deleteOfferDialog) {
                  const offer = getOfferById(deleteOfferDialog.offerId);
                  if (offer) {
                    handleDeactivateOffer(deleteOfferDialog.offerId, offer);
                  }
                }
                setDeleteOfferDialog(null);
              }}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete
            </AlertDialogAction>
            <AlertDialogCancel className="w-full mt-0">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
