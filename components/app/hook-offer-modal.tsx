"use client";

import { useState, useMemo } from "react";
import { X, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { generateGuid } from "@/lib/guid";
import { toast } from "sonner";
import { getProductTypeName } from "@/lib/product-types";

type Props = {
  targetOfferId: string;
  onClose: () => void;
};

export function HookOfferModal({ targetOfferId, onClose }: Props) {
  const { getMyOffers, addHook, getHooksByFromOffer, hooks, getOfferById, getProductById } = useBarterStore();
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

  // Check if already hooked
  const alreadyHookedOfferIds = hooks
    .filter((h) => h.toOfferId === targetOfferId)
    .map((h) => h.fromOfferId);

  async function handleConfirm() {
    if (!selectedOfferId) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const hook = {
      hookId: generateGuid(),
      correlationId: generateGuid(),
      fromOfferId: selectedOfferId,
      toOfferId: targetOfferId,
      status: "searching" as const,
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
          Which of your offers do you want to use? You can hook up to 3 offers
          from each of yours.
        </p>
        
        {/* Info about product type restriction */}
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Only <span className="font-medium text-foreground">{getProductTypeName(targetProductType)}</span> offers can hook with this offer. 
            Offers from different types cannot be exchanged.
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
                  You don't have any <span className="font-medium">{getProductTypeName(targetProductType)}</span> offers. 
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

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {myOffers.map((offer) => {
            const outHooks = getHooksByFromOffer(offer.offerId);
            const atMax = outHooks.length >= 3;
            const alreadyHooked = alreadyHookedOfferIds.includes(offer.offerId);
            const disabled = atMax || alreadyHooked;

            return (
              <button
                key={offer.offerId}
                disabled={disabled}
                onClick={() => setSelectedOfferId(offer.offerId)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selectedOfferId === offer.offerId
                    ? "border-primary bg-primary/10"
                    : disabled
                      ? "border-border bg-secondary/30 opacity-50 cursor-not-allowed"
                      : "border-border bg-secondary/50 hover:border-primary/30"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {offer.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {outHooks.length}/3 hooks used
                  </p>
                </div>
                {atMax && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Max 3
                  </span>
                )}
                {alreadyHooked && !atMax && (
                  <span className="text-xs text-muted-foreground">
                    Already hooked
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedOfferId || loading}
            className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Confirm hook"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
