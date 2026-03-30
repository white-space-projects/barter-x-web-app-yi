"use client";

/**
 * ============================================================================
 * NAVIGATION GUARD CONTEXT
 * ============================================================================
 * 
 * Manages navigation blocking when there are unsaved changes.
 * Used to prevent accidental navigation away from:
 * - Offer creation (add-offer-modal)
 * - Profile editing (profile-tab)
 * 
 * Components register their "dirty" state, and navigation is blocked
 * with a confirmation dialog when trying to navigate away.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

type NavigationBlocker = {
  id: string;
  message: string;
  onSave?: () => Promise<void> | void;
  type: "offer-creation" | "profile-edit";
};

type PendingNavigation = {
  type: "product-type" | "utility-tab";
  value: string | null;
};

type NavigationGuardContextType = {
  // Register a blocker when there are unsaved changes
  registerBlocker: (blocker: NavigationBlocker) => void;
  // Unregister when changes are saved or discarded
  unregisterBlocker: (id: string) => void;
  // Check if navigation should be blocked
  hasBlocker: () => boolean;
  // Get the current blocker info
  getActiveBlocker: () => NavigationBlocker | null;
  // Pending navigation info (what the user tried to navigate to)
  pendingNavigation: PendingNavigation | null;
  setPendingNavigation: (nav: PendingNavigation | null) => void;
  // Confirmation dialog state
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  // Clear all blockers (used after confirming discard)
  clearAllBlockers: () => void;
};

const NavigationGuardContext = createContext<NavigationGuardContextType | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const [blockers, setBlockers] = useState<NavigationBlocker[]>([]);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const registerBlocker = useCallback((blocker: NavigationBlocker) => {
    setBlockers((prev) => {
      // Remove existing blocker with same id and add new one
      const filtered = prev.filter((b) => b.id !== blocker.id);
      return [...filtered, blocker];
    });
  }, []);

  const unregisterBlocker = useCallback((id: string) => {
    setBlockers((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const hasBlocker = useCallback(() => {
    return blockers.length > 0;
  }, [blockers]);

  const getActiveBlocker = useCallback(() => {
    // Priority: offer-creation > profile-edit
    const offerBlocker = blockers.find((b) => b.type === "offer-creation");
    if (offerBlocker) return offerBlocker;
    return blockers[0] || null;
  }, [blockers]);

  const clearAllBlockers = useCallback(() => {
    setBlockers([]);
  }, []);

  const value = useMemo(() => ({
    registerBlocker,
    unregisterBlocker,
    hasBlocker,
    getActiveBlocker,
    pendingNavigation,
    setPendingNavigation,
    showConfirmDialog,
    setShowConfirmDialog,
    clearAllBlockers,
  }), [
    registerBlocker,
    unregisterBlocker,
    hasBlocker,
    getActiveBlocker,
    pendingNavigation,
    showConfirmDialog,
    clearAllBlockers,
  ]);

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error("useNavigationGuard must be used within NavigationGuardProvider");
  }
  return context;
}
