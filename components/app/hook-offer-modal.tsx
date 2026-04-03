"use client";

import { useState, useMemo, useCallback } from "react";
import { X, Loader2, AlertTriangle, AlertCircle, Package, ChevronDown, ChevronUp, Link2Off } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { generateGuid } from "@/lib/guid";
import { toast } from "sonner";
import { getProductTypeName } from "@/lib/product-types";
import type { HookStatus } from "@/lib/types";
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

// Hook status colors
const HOOK_STATUS_COLORS: Record<HookStatus, string> = {
  searching: "text-blue-500",
  cycle_found: "text-purple-500",
  reserved: "text-yellow-500",
  processing: "text-orange-500",
  exchanged: "text-green-500",
  expired: "text-muted-foreground",
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

        {/* Offer cards list */}
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
          {myOffers.map((offer) => {
            const outHooks = getHooksByFromOffer(offer.offerId);
            const atMax = outHooks.length >= 3;
            const alreadyHooked = alreadyHookedOfferIds.includes(offer.offerId);
            const isSelected = selectedOfferId === offer.offerId;
            const isExpanded = expandedOfferId === offer.offerId;
            const offerProduct = getProductById(offer.productId);
            
            // Card is selectable if not already hooked to this target
            // Even if at max hooks, user can unhook first
            const canSelect = !alreadyHooked;

            return (
              <div
                key={offer.offerId}
                className={`rounded-lg border overflow-hidden transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5 card-shadow-primary"
                    : alreadyHooked
                      ? "border-border bg-secondary/30 opacity-60"
                      : "border-border bg-card hover:border-primary/30"
                }`}
              >
                {/* Main card content - clickable to select */}
                <div
                  onClick={() => canSelect && setSelectedOfferId(offer.offerId)}
                  className={`p-3 ${canSelect ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <div className="flex gap-3 items-start">
                    {/* Image */}
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
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

                    {/* Offer info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {offer.title}
                        </p>
                        {/* Status badge */}
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${LOCK_LEVEL_BG_COLORS[offer.lockLevel]} ${LOCK_LEVEL_COLORS[offer.lockLevel]}`}>
                          {LOCK_LEVEL_LABELS[offer.lockLevel]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {offerProduct?.subcategory} . {offerProduct?.brand}
                      </p>
                      
                      {/* Hook count and status */}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${atMax ? "text-destructive" : "text-muted-foreground"}`}>
                          {outHooks.length}/3 hooks used
                        </span>
                        {alreadyHooked && (
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                            Already hooked
                          </span>
                        )}
                        {isSelected && !alreadyHooked && (
                          <span className="text-xs text-primary font-medium">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accordion toggle for hooks */}
                {outHooks.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedOfferId(isExpanded ? null : offer.offerId);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 border-t border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors bg-secondary/20"
                  >
                    <span>View hooked offers ({outHooks.length})</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}

                {/* Expanded hooks section */}
                {isExpanded && outHooks.length > 0 && (
                  <div className="border-t border-border/50 bg-secondary/10 p-3 space-y-2">
                    {outHooks.map((hook) => {
                      const hookedOffer = getOfferById(hook.toOfferId);
                      if (!hookedOffer) return null;
                      const hookedProduct = products.find((p) => p.productId === hookedOffer.productId);
                      const canUnhook = hook.lockLevel === 0 && hook.isActive;

                      return (
                        <div key={hook.hookId} className="rounded-lg border border-border bg-card overflow-hidden">
                          <div className="p-2.5">
                            <div className="flex gap-2 items-center">
                              {/* Small image */}
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary overflow-hidden">
                                {hookedOffer.images && hookedOffer.images.length > 0 ? (
                                  <img
                                    src={hookedOffer.images[0].url}
                                    alt={hookedOffer.title}
                                    className="h-full w-full object-cover"
                                    crossOrigin="anonymous"
                                  />
                                ) : hookedProduct?.imageUrl ? (
                                  <img
                                    src={hookedProduct.imageUrl}
                                    alt={hookedOffer.title}
                                    className="h-full w-full object-cover"
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground/40" />
                                )}
                              </div>

                              {/* Hooked offer info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {hookedOffer.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {hookedProduct?.subcategory}
                                </p>
                              </div>

                              {/* Offer status badge */}
                              <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${LOCK_LEVEL_BG_COLORS[hookedOffer.lockLevel]} ${LOCK_LEVEL_COLORS[hookedOffer.lockLevel]}`}>
                                {LOCK_LEVEL_LABELS[hookedOffer.lockLevel]}
                              </span>
                            </div>

                            {/* Hook status and unhook action */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                              {/* Hook status */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground">Hook:</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${HOOK_STATUS_BG_COLORS[hook.status]} ${HOOK_STATUS_COLORS[hook.status]}`}>
                                  {HOOK_STATUS_LABELS[hook.status]}
                                </span>
                              </div>

                              {/* Unhook button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canUnhook) {
                                    setShowUnhookDialog({ hookId: hook.hookId, offerTitle: hookedOffer.title });
                                  }
                                }}
                                disabled={!canUnhook || unhookingId === hook.hookId}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                  canUnhook && unhookingId !== hook.hookId
                                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30" 
                                    : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed border border-transparent"
                                }`}
                              >
                                {unhookingId === hook.hookId ? (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                ) : (
                                  <Link2Off className="h-2.5 w-2.5" />
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
