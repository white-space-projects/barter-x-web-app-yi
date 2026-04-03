"use client";

import { useState, useMemo, useCallback } from "react";
import { X, Loader2, AlertTriangle, AlertCircle, Package, ChevronDown, ChevronUp, Link2Off } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { generateGuid } from "@/lib/guid";
import { toast } from "sonner";
import { getProductTypeName } from "@/lib/product-types";
import type { HookStatus, LockLevel } from "@/lib/types";
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

// Hook status colors - matching my-offers-tab.tsx
const HOOK_STATUS_COLORS: Record<HookStatus, string> = {
  searching: "text-muted-foreground",
  cycle_found: "text-primary",
  reserved: "text-primary",
  processing: "text-[#3b82f6]",
  exchanged: "text-muted-foreground",
  expired: "text-destructive",
};

const HOOK_STATUS_BG_COLORS: Record<HookStatus, string> = {
  searching: "bg-blue-500/10",
  cycle_found: "bg-purple-500/10",
  reserved: "bg-yellow-500/10",
  processing: "bg-orange-500/10",
  exchanged: "bg-green-500/10",
  expired: "bg-muted/50",
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
  targetOfferId: string;
  onClose: () => void;
};

export function HookOfferModal({ targetOfferId, onClose }: Props) {
  const { getMyOffers, addHook, getHooksByFromOffer, hooks, getOfferById, getProductById, products, removeHook } = useBarterStore();
  const allMyOffers = getMyOffers();
  
  // Get target offer's product type
  const targetOffer = getOfferById(targetOfferId);
  const targetProduct = targetOffer ? getProductById(targetOffer.productId) : null;
  const targetProductType = targetProduct?.productType || "goods";
  
  // Filter my offers to only those with matching product type
  const myOffers = useMemo(() => {
    return allMyOffers.filter((offer) => {
      const product = getProductById(offer.productId);
      return product?.productType === targetProductType;
    });
  }, [allMyOffers, getProductById, targetProductType]);
  
  // Check if user has any offers at all (for different message)
  const hasAnyOffers = allMyOffers.length > 0;
  const hasMatchingTypeOffers = myOffers.length > 0;
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const [unhookingId, setUnhookingId] = useState<string | null>(null);
  const [showUnhookDialog, setShowUnhookDialog] = useState<{ hookId: string; offerTitle: string } | null>(null);

  // Check if already hooked
  const alreadyHookedOfferIds = hooks
    .filter((h) => h.toOfferId === targetOfferId)
    .map((h) => h.fromOfferId);

  // Helper: Check if a hook can be removed
  function canRemoveHook(hook: { lockLevel: LockLevel; isActive: boolean }): boolean {
    return hook.lockLevel === 0 && hook.isActive;
  }

  // Handle unhook
  const handleUnhook = useCallback(async (hookId: string) => {
    setShowUnhookDialog(null);
    setUnhookingId(hookId);
    await new Promise((r) => setTimeout(r, 400));
    removeHook(hookId);
    setUnhookingId(null);
    toast.success("Offer unhooked successfully");
  }, [removeHook]);

  async function handleConfirm() {
    if (!selectedOfferId) return;
    
    // Check if selected offer has room for another hook
    const outHooks = getHooksByFromOffer(selectedOfferId);
    if (outHooks.length >= 3) {
      toast.error("This offer already has 3 hooks. Unhook one first.");
      return;
    }
    
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const hook = {
      hookId: generateGuid(),
      correlationId: generateGuid(),
      fromOfferId: selectedOfferId,
      toOfferId: targetOfferId,
      status: "searching" as const,
      lockLevel: 0 as const,
      isActive: true,
    };

    addHook(hook);
    setLoading(false);
    toast.success(
      "You've entered the trade engine. We'll notify you if someone picks your offer in exchange."
    );
    onClose();
  }

  return (
    <>
      {/* Backdrop - respects sidebar on desktop */}
      <div
        className="fixed inset-0 lg:left-56 z-[60] bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal - centered in content area */}
      <div className="fixed z-[70] inset-4 lg:inset-auto lg:left-[calc(50%+7rem)] lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            Choose your offer to hook
          </h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          Select an offer to hook. You can hook up to 3 offers from each of yours. 
          Unhook existing hooks if needed.
        </p>
        
        {/* Info about product type restriction */}
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Only <span className="font-medium text-foreground">{getProductTypeName(targetProductType)}</span> offers can hook with this offer.
          </p>
        </div>

        {/* Empty state when no matching offers */}
        {!hasMatchingTypeOffers && (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
            {hasAnyOffers ? (
              <>
                <p className="text-sm font-medium text-foreground mb-1">No matching offers</p>
                <p className="text-xs text-muted-foreground max-w-[250px]">
                  You don&apos;t have any <span className="font-medium">{getProductTypeName(targetProductType)}</span> offers. 
                  Create one to hook with this offer.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground mb-1">No offers yet</p>
                <p className="text-xs text-muted-foreground">
                  Add an offer first to start hooking.
                </p>
              </>
            )}
          </div>
        )}

        {/* Offer cards list - matching my-offers-tab design */}
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
          {myOffers.map((offer) => {
            const outHooks = getHooksByFromOffer(offer.offerId);
            const alreadyHooked = alreadyHookedOfferIds.includes(offer.offerId);
            const isSelected = selectedOfferId === offer.offerId;
            const isExpanded = expandedOfferId === offer.offerId;
            const offerProduct = getProductById(offer.productId);
            
            // Card is selectable if not already hooked to this target
            const canSelect = !alreadyHooked;

            return (
              <div
                key={offer.offerId}
                className={`rounded-xl border overflow-hidden transition-colors ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : alreadyHooked
                      ? "border-border bg-secondary/30 opacity-60"
                      : "border-border bg-card"
                } card-shadow-primary`}
              >
                {/* Card header - matching my-offers-tab design */}
                <div className="py-3 px-4">
                  <div className="flex gap-3">
                    {/* Clickable card area */}
                    <div 
                      className={`flex gap-3 flex-1 min-w-0 ${canSelect ? "cursor-pointer" : "cursor-not-allowed"}`}
                      onClick={() => canSelect && setSelectedOfferId(offer.offerId)}
                    >
                      {/* 64x64 Image */}
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                        {offer.images && offer.images.length > 0 ? (
                          <img
                            src={offer.images[0].url}
                            alt={offer.title}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : offerProduct?.imageUrl ? (
                          <img
                            src={offerProduct.imageUrl}
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
                          {offerProduct?.subcategory} . {offerProduct?.brand}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hooks {outHooks.length}/3
                        </p>
                        {alreadyHooked && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">
                            Already hooked to this offer
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side: radio button and status badge */}
                    <div className="flex-shrink-0 flex flex-col items-end justify-between h-16">
                      {/* Radio button indicator */}
                      <div 
                        onClick={() => canSelect && setSelectedOfferId(offer.offerId)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          canSelect ? "cursor-pointer" : "cursor-not-allowed"
                        } ${
                          isSelected
                            ? "border-primary bg-primary"
                            : alreadyHooked
                              ? "border-muted-foreground/30"
                              : "border-muted-foreground/50 hover:border-primary/50"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      
                      {/* Status badge with down arrow - accordion trigger */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedOfferId(isExpanded ? null : offer.offerId); }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${LOCK_LEVEL_BG_COLORS[offer.lockLevel]} ${LOCK_LEVEL_COLORS[offer.lockLevel]} hover:opacity-80`}
                      >
                        {LOCK_LEVEL_LABELS[offer.lockLevel]}
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded section: outgoing hooks - matching my-offers-tab design */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/30 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Your Outgoing Hooks ({outHooks.length}/3)
                      </p>
                      <button
                        onClick={() => setExpandedOfferId(null)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {outHooks.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        No hooks yet. This offer has all 3 hook slots available.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {outHooks.map((hook) => {
                          const targetOfferData = getOfferById(hook.toOfferId);
                          const targetProductData = targetOfferData
                            ? products.find((p) => p.productId === targetOfferData.productId)
                            : null;
                          
                          // Get the target offer's lock level for status badge display
                          const targetLockLevel = targetOfferData?.lockLevel ?? 0;

                          return (
                            <div
                              key={hook.hookId}
                              className="rounded-lg border border-border bg-card overflow-hidden card-shadow-primary"
                            >
                              {/* Compact hooked offer card - smaller padding and image */}
                              <div className="p-3">
                                <div className="flex gap-2.5 items-center">
                                  {/* 48x48 Image - smaller than main cards */}
                                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                                    {targetOfferData?.images && targetOfferData.images.length > 0 ? (
                                      <img
                                        src={targetOfferData.images[0].url}
                                        alt={targetOfferData?.title}
                                        className="h-full w-full object-cover"
                                        crossOrigin="anonymous"
                                      />
                                    ) : targetProductData?.imageUrl ? (
                                      <img
                                        src={targetProductData.imageUrl}
                                        alt={targetOfferData?.title}
                                        className="h-full w-full object-cover"
                                        crossOrigin="anonymous"
                                      />
                                    ) : (
                                      <Package className="h-5 w-5 text-muted-foreground/40" />
                                    )}
                                  </div>

                                  {/* Target offer info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {targetOfferData?.title || "Unknown Offer"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {targetProductData?.subcategory} . {targetProductData?.brand}
                                    </p>
                                  </div>

                                  {/* Status badge - inline right side */}
                                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${LOCK_LEVEL_BG_COLORS[targetLockLevel]} ${LOCK_LEVEL_COLORS[targetLockLevel]}`}>
                                    {LOCK_LEVEL_LABELS[targetLockLevel]}
                                  </span>
                                </div>

                                {/* Hook status and actions row */}
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                  {/* Hook status badge */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground">Hook:</span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${HOOK_STATUS_BG_COLORS[hook.status]} ${HOOK_STATUS_COLORS[hook.status]}`}>
                                      {HOOK_STATUS_LABELS[hook.status]}
                                    </span>
                                  </div>
                                  
                                  {/* Unhook button - always visible but disabled when locked */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (canRemoveHook(hook)) {
                                        setShowUnhookDialog({ hookId: hook.hookId, offerTitle: targetOfferData?.title || "Unknown" });
                                      }
                                    }}
                                    disabled={!canRemoveHook(hook) || unhookingId === hook.hookId}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                      canRemoveHook(hook) && unhookingId !== hook.hookId
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedOfferId || loading}
            className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Confirm hook"
            )}
          </button>
        </div>
      </div>

      {/* Unhook Confirmation Dialog */}
      <AlertDialog open={!!showUnhookDialog} onOpenChange={(open) => !open && setShowUnhookDialog(null)}>
        <AlertDialogContent className="max-w-[340px] rounded-xl z-[80]">
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
