/**
 * ============================================================================
 * WORKFLOW HELPERS
 * ============================================================================
 * 
 * Centralized utility functions for workflow-related business logic.
 * These helpers ensure consistent application of workflow rules across the app.
 * 
 * BACKEND DEVELOPER NOTES:
 * - These rules map to the database fields in application.offers and application.hooks
 * - Lock levels: 0=AVAILABLE, 1=RESERVED, 2=PROCESSING, 3=EXCHANGED
 * - Backend should enforce these same rules in API endpoints
 */

import type { LockLevel, Offer, Hook } from "./types";

// =============================================================================
// OFFER ACTION RULES
// =============================================================================

/**
 * Check if an offer can be deleted/deactivated
 * Rule: Cannot delete/deactivate if lock_level >= 1
 */
export function canDeleteOffer(offer: Pick<Offer, "lockLevel" | "isActive">): boolean {
  return offer.lockLevel === 0 && offer.isActive;
}

/**
 * Check if an offer can be edited
 * Rule: Can edit only if lock_level === 0 and isActive
 */
export function canEditOffer(offer: Pick<Offer, "lockLevel" | "isActive">): boolean {
  return offer.lockLevel === 0 && offer.isActive;
}

/**
 * Check if pickup readiness can be confirmed
 * Rule: Can confirm only when lock_level === 1 and isActive === true
 */
export function canConfirmPickupReadiness(offer: Pick<Offer, "lockLevel" | "isActive" | "readyState">): boolean {
  return offer.lockLevel === 1 && offer.isActive && !offer.readyState;
}

/**
 * Check if pickup readiness can be toggled off
 * Rule: Can only toggle off at lock_level === 1
 */
export function canToggleReadinessOff(offer: Pick<Offer, "lockLevel" | "readyState">): boolean {
  return offer.lockLevel === 1 && offer.readyState;
}

/**
 * Check if the Confirm Pickup Readiness CTA should be shown
 * Visibility rule: Show only when lock_level === 1 AND is_active === true
 */
export function shouldShowConfirmPickupCTA(offer: Pick<Offer, "lockLevel" | "isActive" | "readyState">): boolean {
  return offer.lockLevel === 1 && offer.isActive && !offer.readyState;
}

// =============================================================================
// HOOK ACTION RULES
// =============================================================================

/**
 * Check if a hook can be removed (unhook)
 * Rule: Cannot unhook if hook.lock_level >= 1
 */
export function canUnhook(hook: Pick<Hook, "lockLevel" | "isActive">): boolean {
  return hook.lockLevel === 0 && hook.isActive;
}

/**
 * Check if new hooks can be created from an offer
 * Rule: Cannot create new hooks if offer.lock_level >= 2
 */
export function canCreateHookFromOffer(offer: Pick<Offer, "lockLevel" | "isActive">): boolean {
  return offer.lockLevel < 2 && offer.isActive;
}

// =============================================================================
// MARKETPLACE/HOOKABILITY RULES
// =============================================================================

/**
 * Check if an offer is hookable (can be hooked to)
 * Rule: Only show/allow hooking to offers where:
 * - is_active === true
 * - lock_level <= 1
 */
export function isOfferHookable(offer: Pick<Offer, "lockLevel" | "isActive">): boolean {
  return offer.isActive && offer.lockLevel <= 1;
}

/**
 * Filter offers for marketplace display
 * Rule: Only show offers where is_active === true AND lock_level <= 1
 */
export function filterHookableOffers<T extends Pick<Offer, "lockLevel" | "isActive">>(offers: T[]): T[] {
  return offers.filter(isOfferHookable);
}

// =============================================================================
// OFFER STATUS CLASSIFICATION
// =============================================================================

/**
 * Check if an offer should be in the "Closed" tab
 * Rule: lock_level === 3 (EXCHANGED)
 */
export function isOfferClosed(offer: Pick<Offer, "lockLevel">): boolean {
  return offer.lockLevel === 3;
}

/**
 * Check if an offer should be in the "Open" tab
 * Rule: isActive AND lock_level < 3
 */
export function isOfferOpen(offer: Pick<Offer, "lockLevel" | "isActive">): boolean {
  return offer.isActive && offer.lockLevel < 3;
}

// =============================================================================
// SIMULATION HELPERS (TEMPORARY - FOR TESTING ONLY)
// =============================================================================

/**
 * Get available simulation states for an offer
 * Used by the temporary simulate control
 */
export function getSimulationLockLevels(): { value: LockLevel; label: string }[] {
  return [
    { value: 0, label: "Available" },
    { value: 1, label: "Reserved" },
    { value: 2, label: "Processing" },
    { value: 3, label: "Exchanged" },
  ];
}

/**
 * Map lock level to corresponding hook status (for simulation)
 */
export function lockLevelToHookStatus(lockLevel: LockLevel): "searching" | "reserved" | "processing" | "exchanged" {
  switch (lockLevel) {
    case 0: return "searching";
    case 1: return "reserved";
    case 2: return "processing";
    case 3: return "exchanged";
  }
}
