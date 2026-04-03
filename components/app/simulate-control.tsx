"use client";

/**
 * ============================================================================
 * TEMPORARY SIMULATE CONTROL - FOR TESTING ONLY
 * ============================================================================
 * 
 * A small dropdown control that allows manual testing of workflow states.
 * This component should be removed before production deployment.
 * 
 * USAGE:
 * Place this control on hooked offer cards to manually change the lock level
 * and test:
 * - Status badge changes
 * - Confirm pickup readiness visibility
 * - Disabling of delete/unhook/hook actions
 * - Movement into closed/open lists
 */

import { useState } from "react";
import type { LockLevel, HookStatus } from "@/lib/types";
import { useBarterStore } from "@/lib/store";
import { toast } from "sonner";

type SimulateControlProps = {
  /** Current lock level to highlight in the menu */
  currentLockLevel: LockLevel;
  /** ID of the hook to update */
  hookId: string;
  /** ID of the target offer to update */
  targetOfferId: string;
};

/**
 * TEMPORARY: Simulate control dropdown for testing workflow states.
 * Allows changing lock_level of an offer and its associated hook.
 */
export function SimulateControl({ currentLockLevel, hookId, targetOfferId }: SimulateControlProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { updateOffer, updateHook } = useBarterStore();

  const handleSimulate = (lockLevel: LockLevel) => {
    // Map lock level to hook status
    const statusMap: Record<LockLevel, HookStatus> = {
      0: "searching",
      1: "reserved",
      2: "processing",
      3: "exchanged",
    };

    // Update the target offer's lock level
    updateOffer(targetOfferId, {
      lockLevel,
      lockUpdatedAt: new Date().toISOString(),
    });

    // Update the hook's lock level and status to match
    updateHook(hookId, {
      lockLevel,
      status: statusMap[lockLevel],
      lockUpdatedAt: new Date().toISOString(),
    });

    const labels = ["Available", "Reserved", "Processing", "Exchanged"];
    toast.success(`[DEV] Simulated: ${labels[lockLevel]}`);
    setShowMenu(false);
  };

  const options: { value: LockLevel; label: string }[] = [
    { value: 0, label: "Available" },
    { value: 1, label: "Reserved" },
    { value: 2, label: "Processing" },
    { value: 3, label: "Exchanged" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-2 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/30 border-dashed hover:bg-amber-500/20 transition-colors"
        title="[DEV] Simulate status change"
      >
        Simulate
      </button>
      
      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            <div className="px-2 py-1 text-[10px] text-amber-600 font-medium uppercase tracking-wide border-b border-border mb-1">
              Test Status
            </div>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSimulate(option.value)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors ${
                  currentLockLevel === option.value ? "text-primary font-medium" : "text-foreground"
                }`}
              >
                {option.label}
                {currentLockLevel === option.value && " (current)"}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
