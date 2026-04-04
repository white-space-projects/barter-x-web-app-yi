"use client";

/**
 * ============================================================================
 * OFFER CARD COMPONENT - Reusable offer display card
 * ============================================================================
 * 
 * PURPOSE:
 * This is a SHARED component used across the application to display offer cards
 * consistently. It handles both "own offers" (with edit/hooks functionality) and
 * "other user offers" (with hook/direct exchange functionality).
 * 
 * BACKEND INTEGRATION NOTES:
 * --------------------------
 * 1. DATA FIELDS DISPLAYED:
 *    - offer.title: String - The offer title
 *    - offer.description: String - Offer description (shown when expanded)
 *    - offer.hookedCount: Number - How many people have hooked this offer
 *    - offer.outgoingHookCount: Number - How many offers this offer has hooked (max 3)
 *    - offer.readyForCommit: Boolean - Has owner confirmed pickup readiness
 *    - offer.pickupReadyDate: String - Date when pickup was confirmed (format: "DD/MM/YY")
 *    - offer.pickupAddress: Object - Address for pickup (only shown after both parties confirm)
 * 
 * 2. RELATED DATA:
 *    - product: The product this offer belongs to (for image, category, brand)
 *    - hooks: Array of Hook objects FROM this offer (outgoing hooks)
 *    - targetOffer: The offer being hooked TO (for displaying hook targets)
 * 
 * 3. ACTIONS TO IMPLEMENT:
 *    - onEdit: Opens edit modal - PATCH /api/offers/{offerId}
 *    - onConfirmPickup: Opens pickup confirmation - POST /api/offers/{offerId}/confirm-pickup
 *    - onHook: Hook this offer - POST /api/hooks with {fromOfferId, toOfferId}
 *    - onRequestDirectExchange: Request 1:1 trade - POST /api/direct-exchange-requests
 *    - onUnhook: Remove a hook - DELETE /api/hooks/{hookId}
 * 
 * 4. STATUS FLOW (on hooks, not offers):
 *    searching -> cycle_found -> reserved -> processing -> exchanged
 *    Any status can also go to "expired"
 * 
 * USAGE:
 * ------
 * <OfferCard
 *   offer={offer}              // Required: The offer data
 *   variant="own"              // "own" for my offers, "other" for browsing
 *   showHooks={true}           // Whether to show expandable hooks section
 *   onEdit={() => {}}          // Handler for edit action
 *   onConfirmPickup={() => {}} // Handler for pickup confirmation
 *   onHook={() => {}}          // Handler for hooking this offer
 * />
 */

import { useState, useMemo } from "react";
import {
  Package,
  Pencil,
  ArrowRightLeft,
  Unlink,
  MapPin,
  MessageSquare,
  Loader2,
  Home,
} from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { toast } from "sonner";
import type { Offer, Hook, HookStatus, Product } from "@/lib/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Hook status colors - maps hook status to Tailwind text color class
 * BACKEND NOTE: These statuses come from the Hook model, not the Offer model
 */
export const HOOK_STATUS_COLORS: Record<HookStatus, string> = {
  searching: "text-muted-foreground",    // Gray - actively searching for cycle
  cycle_found: "text-primary",           // Yellow - cycle detected, pending confirmation
  reserved: "text-primary",              // Yellow - confirmed in trade cycle
  processing: "text-[#3b82f6]",          // Blue - trade in progress (committed)
  exchanged: "text-muted-foreground",    // Gray - trade completed
  expired: "text-destructive",           // Red - hook expired (timeout or cancelled)
};

/**
 * Hook status display labels
 */
export const HOOK_STATUS_LABELS: Record<HookStatus, string> = {
  searching: "Searching",
  cycle_found: "Cycle Found",
  reserved: "Reserved",
  processing: "Committed",
  exchanged: "Exchanged",
  expired: "Expired",
};

/**
 * Props for the OfferCard component
 */
type OfferCardProps = {
  /** The offer to display */
  offer: Offer;
  
  /** Display variant: "own" shows edit/hooks, "other" shows hook button */
  variant: "own" | "other";
  
  /** The product this offer belongs to (for image, category display) */
  product?: Product;
  
  /** Whether to show the expandable hooks section (for "own" variant) */
  showHooks?: boolean;
  
  /** Whether the hooks section is initially expanded */
  initialExpanded?: boolean;
  
  /** Callback when edit button is clicked */
  onEdit?: (offerId: string) => void;
  
  /** Callback when confirm pickup button is clicked */
  onConfirmPickup?: (offerId: string) => void;
  
  /** Callback when hook button is clicked (for "other" variant) */
  onHook?: (offerId: string) => void;
  
  /** Callback when view details button is clicked */
  onViewDetails?: (offerId: string) => void;
  
  /** Callback when direct exchange is requested */
  onRequestDirectExchange?: (offerId: string, myMatchingOfferId: string) => void;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OfferCard({
  offer,
  variant,
  product,
  showHooks = false,
  initialExpanded = false,
  onEdit,
  onConfirmPickup,
  onHook,
  onViewDetails,
  onRequestDirectExchange,
}: OfferCardProps) {
  // ---------------------------------------------------------------------------
  // STORE ACCESS
  // ---------------------------------------------------------------------------
  const {
    auth,
    products,
    hooks,
    getHooksByFromOffer,
    getOfferById,
    removeHook,
    updateHook,
    updateOffer,
    addNotification,
    getOrCreateConversation,
    getMyOffers,
  } = useBarterStore();

  // ---------------------------------------------------------------------------
  // LOCAL STATE
  // ---------------------------------------------------------------------------
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [unhookingId, setUnhookingId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // DERIVED DATA
  // ---------------------------------------------------------------------------
  
  // Get product if not provided
  const offerProduct = product || products.find((p) => p.productId === offer.productId);
  
  // Get hooks FROM this offer (outgoing hooks)
  const offerHooks = getHooksByFromOffer(offer.offerId);
  
  // Check if this is the current user's offer
  const isOwnOffer = offer.ownerUserId === auth.user?.userId;
  
  // Get user's offers for direct exchange check
  const myOffers = getMyOffers();
  const hasOffers = myOffers.length > 0;
  
  // Check if current user has already hooked this offer
  const isAlreadyHooked = useMemo(() => {
    if (isOwnOffer) return false;
    const myOfferIds = myOffers.map((o) => o.offerId);
    return hooks.some((h) => h.toOfferId === offer.offerId && myOfferIds.includes(h.fromOfferId));
  }, [isOwnOffer, myOffers, hooks, offer.offerId]);

  // ---------------------------------------------------------------------------
  // STATUS HELPERS
  // ---------------------------------------------------------------------------
  
  /**
   * Get highest priority status for display on offer card
   * BACKEND NOTE: Status priority determines what badge to show
   * Priority order: processing > reserved > null (don't show others)
   */
  function getDisplayStatus(): HookStatus | null {
    if (offerHooks.some((h) => h.status === "processing")) return "processing";
    if (offerHooks.some((h) => h.status === "reserved")) return "reserved";
    return null;
  }

  /**
   * Check if any hook is reserved (triggers "Confirm Pickup" button)
   */
  function hasReservedHook(): boolean {
    return offerHooks.some((h) => h.status === "reserved");
  }

  /**
   * Check if any hook is processing/committed (show pickup date)
   */
  function hasProcessingHook(): boolean {
    return offerHooks.some((h) => h.status === "processing");
  }

  /**
   * Format pickup address for display
   * BACKEND NOTE: Address fields are optional, concatenate non-empty ones
   */
  function formatPickupAddress(targetOffer: Offer): string | null {
    const addr = targetOffer.pickupAddress;
    if (!addr) return null;
    
    const parts: string[] = [];
    if (addr.addressLine1) parts.push(addr.addressLine1);
    if (addr.addressLine2) parts.push(addr.addressLine2);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.zip) parts.push(addr.zip);
    if (addr.country) parts.push(addr.country);
    
    return parts.length > 0 ? parts.join(", ") : null;
  }

  /**
   * Check if user can request direct exchange
   * BACKEND NOTE: User can request if they have an offer in a product 
   * that this offer is hooked to
   */
  function canRequestDirectExchange(): { canRequest: boolean; myMatchingOffer: Offer | null } {
    // Get products this offer is hooked to
    const hookedProductIds = new Set<string>();
    offerHooks.forEach((hook) => {
      const targetOffer = getOfferById(hook.toOfferId);
      if (targetOffer) {
        hookedProductIds.add(targetOffer.productId);
      }
    });
    
    // Check if any of my offers are in those products
    for (const myOffer of myOffers) {
      if (hookedProductIds.has(myOffer.productId)) {
        return { canRequest: true, myMatchingOffer: myOffer };
      }
    }
    
    return { canRequest: false, myMatchingOffer: null };
  }

  // ---------------------------------------------------------------------------
  // COMPUTED VALUES
  // ---------------------------------------------------------------------------
  
  const displayStatus = variant === "own" ? getDisplayStatus() : null;
  const showConfirmPickup = variant === "own" && hasReservedHook() && !offer.readyState;
  const showPickupConfirmed = variant === "own" && offer.readyState;
  const showPickupDate = variant === "own" && (hasProcessingHook() || offer.readyState) && offer.pickupReadyDate;
  const { canRequest: canDirectExchange, myMatchingOffer } = variant === "other" ? canRequestDirectExchange() : { canRequest: false, myMatchingOffer: null };

  // ---------------------------------------------------------------------------
  // ACTION HANDLERS
  // ---------------------------------------------------------------------------
  
  /**
   * Handle unhooking (removing a hook)
   * BACKEND: DELETE /api/hooks/{hookId}
   */
  async function handleUnhook(hookId: string) {
    setUnhookingId(hookId);
    // TODO: Replace with actual API call
    await new Promise((r) => setTimeout(r, 400)); // Simulated delay
    removeHook(hookId);
    setUnhookingId(null);
    toast.success("Hook removed. You can now hook a different offer.");
  }

  /**
   * Simulate status change (TESTING ONLY - remove in production)
   */
  function handleSimulateReserved(hookId: string) {
    updateHook(hookId, { status: "reserved", targetUserDistance: 12 });
    toast.success("Simulated: Hook status changed to Reserved.");
  }

  /**
   * Simulate target pickup confirm (TESTING ONLY - remove in production)
   */
  function handleSimulateTargetPickupConfirm(targetOfferId: string, hookId: string) {
    const targetOffer = getOfferById(targetOfferId);
    updateOffer(targetOfferId, {
      readyForCommit: true,
      pickupReadyDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }),
      pickupAddress: {
        country: "Netherlands",
        city: "Amsterdam",
        state: "North Holland",
        addressLine1: "Damrak 1",
        zip: "1012 AB",
      },
    });
    
    addNotification({
      type: "pickup_confirm",
      hookId,
      offerId: offer.offerId,
      title: "Pickup Confirmed",
      message: `The user for "${targetOffer?.title}" has confirmed pickup readiness.`,
      actionType: "view_chat",
      actionLabel: "Open Chat",
    });

    if (targetOffer) {
      getOrCreateConversation(hookId, offer.offerId, targetOfferId, targetOffer.ownerUserId, "User");
    }
    
    toast.success("Simulated: Other user confirmed pickup readiness.");
  }

  /**
   * Handle direct exchange request
   * BACKEND: POST /api/direct-exchange-requests
   */
  function handleDirectExchange() {
    if (onRequestDirectExchange && myMatchingOffer) {
      onRequestDirectExchange(offer.offerId, myMatchingOffer.offerId);
    } else if (myMatchingOffer) {
      addNotification({
        type: "direct_exchange_req",
        offerId: offer.offerId,
        fromUserId: auth.user?.userId,
        fromUserName: auth.user?.name,
        title: "Direct Exchange Request",
        message: `${auth.user?.name || "A user"} has requested a direct exchange with their "${myMatchingOffer.title}" for your "${offer.title}".`,
        actionType: "view_offer",
        actionLabel: "View Offer",
      });
      toast.success("Direct exchange request sent!");
    }
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  
  return (
    <div 
      className="rounded-xl border border-border bg-card overflow-hidden w-full card-shadow-primary cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => onViewDetails?.(offer.offerId)}
    >
      {/* Main card content - 88px min height */}
      <div className="p-4 min-h-[88px]">
        <div className="flex gap-3">
          {/* Product image (64x64) */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
            {offerProduct?.imageUrl ? (
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
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm font-medium text-foreground truncate">
                {offer.title}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {offerProduct?.subcategory} <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" /> {offerProduct?.brand}
              </p>
              <p className="text-xs text-primary font-medium">
                {variant === "own"
                  ? `Hooks ${offer.outgoingHookCount}/3`
                  : offer.outgoingHookCount === 0
                    ? "Not hooked yet"
                    : `Hooked to ${offer.outgoingHookCount} ${offer.outgoingHookCount === 1 ? "offer" : "offers"}`}
              </p>
            </div>

          {/* Right side actions */}
          <div className="flex flex-col items-end justify-start flex-shrink-0 gap-1">
            {/* Pickup date (own offers with confirmed pickup) */}
            {showPickupDate && (
              <button
                onClick={(e) => { e.stopPropagation(); onConfirmPickup?.(offer.offerId); }}
                className="text-xs text-primary hover:underline"
              >
                Pickup: <span className="underline">{offer.pickupReadyDate}</span>
              </button>
            )}
            
            {/* Edit button (own offers only) */}
            {variant === "own" && onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(offer.offerId); }}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit offer"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}

            {/* Status badge (own offers only) */}
            {displayStatus && (
              <p className={`text-xs font-medium ${HOOK_STATUS_COLORS[displayStatus]}`}>
                {HOOK_STATUS_LABELS[displayStatus]}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons area */}
        <div className="mt-3 pt-2 border-t border-border/50 flex flex-wrap gap-2 justify-end">
          {variant === "own" ? (
            /* OWN OFFER: Confirm pickup button or Pickup Confirmed with edit */
            <>
              {showConfirmPickup && (
                <button
                  onClick={() => onConfirmPickup?.(offer.offerId)}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Confirm Pickup Readiness
                </button>
              )}
              {showPickupConfirmed && (
                <button
                  onClick={() => onConfirmPickup?.(offer.offerId)}
                  className="rounded-md bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20 transition-colors flex items-center gap-1.5"
                >
                  <span>Pickup Confirmed</span>
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </>
          ) : (
            /* OTHER OFFER: Hook / Direct Exchange buttons */
            <>
              {isOwnOffer ? (
                <span className="text-xs text-muted-foreground italic">
                  This is your offer
                </span>
              ) : !hasOffers ? (
                <div className="text-right">
                  <button
                    disabled
                    className="rounded-md bg-primary/40 px-3 py-1.5 text-xs font-medium text-primary-foreground/60 cursor-not-allowed"
                  >
                    Hook this offer
                  </button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add an offer first to hook this one.
                  </p>
                </div>
              ) : (
                <>
                  {canDirectExchange && !isAlreadyHooked && (
                    <button
                      onClick={handleDirectExchange}
                      className="flex items-center gap-1 rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Direct Exchange
                    </button>
                  )}
                  <button
                    onClick={() => !isAlreadyHooked && onHook?.(offer.offerId)}
                    disabled={isAlreadyHooked}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      isAlreadyHooked
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {isAlreadyHooked ? "Hooked" : "Hook this offer"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded hooks section (own offers only) */}
      {variant === "own" && showHooks && isExpanded && offerHooks.length > 0 && (
        <div className="border-t border-border bg-secondary/20">
          <div className="p-4">
            <h4 className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your outgoing hooks ({offerHooks.length}/3)
            </h4>
            <div className="flex flex-col gap-2">
              {offerHooks.map((hook) => {
                const targetOffer = getOfferById(hook.toOfferId);
                if (!targetOffer) return null;
                const targetProduct = products.find((p) => p.productId === targetOffer.productId);

                // Can unhook only if searching or cycle_found
                const canUnhook = hook.status === "searching" || hook.status === "cycle_found";
                
                // Show address/chat only when reserved/processing AND target confirmed pickup
                const canShowAddressAndChat =
                  (hook.status === "reserved" || hook.status === "processing") &&
                  targetOffer.readyForCommit === true;
                
                const targetAddress = canShowAddressAndChat ? formatPickupAddress(targetOffer) : null;

                return (
                  <div
                    key={hook.hookId}
                    className="flex flex-col rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      {/* Target offer image */}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                        {targetProduct?.imageUrl ? (
                          <img
                            src={targetProduct.imageUrl}
                            alt={targetOffer.title}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {targetOffer.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {targetProduct?.subcategory} . {targetProduct?.brand}
                        </p>
                        {(hook.status === "reserved" || hook.status === "processing") && hook.targetUserDistance && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {hook.targetUserDistance} km away
                          </span>
                        )}
                      </div>

                      {/* Status and actions */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-xs font-medium ${HOOK_STATUS_COLORS[hook.status]}`}>
                          {HOOK_STATUS_LABELS[hook.status]}
                        </span>

                        <div className="flex gap-1.5">
                          {canShowAddressAndChat && (
                            <span className="flex items-center gap-1 text-[10px] text-primary">
                              <MessageSquare className="h-3 w-3" />
                              Chat via Chat tab
                            </span>
                          )}

                          {canUnhook && (
                            <button
                              onClick={() => handleUnhook(hook.hookId)}
                              disabled={unhookingId === hook.hookId}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-destructive/70 hover:text-destructive hover:border-destructive/30 transition-colors"
                              title="Remove this hook"
                            >
                              {unhookingId === hook.hookId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Unlink className="h-3 w-3" />
                              )}
                            </button>
                          )}

                          {/* TESTING ONLY - Simulate buttons */}
                          {hook.status === "searching" && (
                            <button
                              onClick={() => handleSimulateReserved(hook.hookId)}
                              className="text-[10px] text-primary underline hover:no-underline ml-1"
                              title="Simulate reserved status"
                            >
                              Sim
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address section */}
                    {canShowAddressAndChat && targetAddress && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-start gap-2">
                          <Home className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Pickup Address:</p>
                            <p className="text-xs text-foreground">{targetAddress}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TESTING ONLY - Simulate target pickup confirm */}
                    {(hook.status === "reserved" || hook.status === "processing") && !targetOffer.readyForCommit && (
                      <button
                        onClick={() => handleSimulateTargetPickupConfirm(targetOffer.offerId, hook.hookId)}
                        className="mt-2 text-[10px] text-primary underline hover:no-underline"
                      >
                        Simulate: Other user confirms pickup
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
