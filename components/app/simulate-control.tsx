"use client";

/**
 * TEMPORARY SIMULATE CONTROL - FOR TESTING ONLY
 * Remove before production deployment.
 */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { LockLevel, HookStatus } from "@/lib/types";
import { useBarterStore } from "@/lib/store";
import { toast } from "sonner";

type SimulateControlProps = {
  currentLockLevel: LockLevel;
  hookId: string;
  sourceOfferId: string;  // My offer
  targetOfferId: string;  // Target offer I hooked to
};

export function SimulateControl({ currentLockLevel, hookId, sourceOfferId, targetOfferId }: SimulateControlProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { updateOffer, updateHook, addNotification } = useBarterStore();

  // Calculate menu position when opened
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - 140), // 140 is min-w of dropdown, ensure at least 8px from left edge
      });
    }
  }, [showMenu]);

  const handleSimulate = (lockLevel: LockLevel) => {
    const statusMap: Record<LockLevel, HookStatus> = {
      0: "searching",
      1: "reserved",
      2: "processing",
      3: "exchanged",
    };

    // Update BOTH offers' lockLevel (source = my offer, target = their offer)
    updateOffer(sourceOfferId, {
      lockLevel,
      lockUpdatedAt: new Date().toISOString(),
    });
    
    updateOffer(targetOfferId, {
      lockLevel,
      lockUpdatedAt: new Date().toISOString(),
    });

    updateHook(hookId, {
      lockLevel,
      status: statusMap[lockLevel],
      lockUpdatedAt: new Date().toISOString(),
    });

    // When setting to Reserved, send notification only (no chat message - chat enabled after both confirm)
    if (lockLevel === 1) {
      addNotification({
        type: "cycle_found",
        title: "Barter Cycle Found!",
        message: "A cycle has been matched. Confirm your pickup readiness to proceed.",
        offerId: sourceOfferId,
        hookId: hookId,
        actionType: "confirm_pickup",
        actionLabel: "Confirm Pickup",
      });
    }

    const labels = ["Available", "Reserved", "Processing", "Exchanged"];
    toast.success(`[DEV] Simulated: ${labels[lockLevel]} for both offers`);
    setShowMenu(false);
  };

  const options: { value: LockLevel; label: string }[] = [
    { value: 0, label: "Available" },
    { value: 1, label: "Reserved" },
    { value: 2, label: "Processing" },
    { value: 3, label: "Exchanged" },
  ];

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowMenu((prev) => !prev);
        }}
        className="px-2 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/30 border-dashed hover:bg-amber-500/20 transition-colors"
      >
        Simulate
      </button>
      
      {showMenu && typeof document !== "undefined" && createPortal(
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          
          {/* Dropdown menu - fixed position via portal to escape overflow containers */}
          <div 
            className="fixed z-[9999] bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className="px-2 py-1 text-[10px] text-amber-600 font-medium uppercase tracking-wide border-b border-border mb-1">
              Test Status
            </div>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSimulate(option.value);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors ${
                  currentLockLevel === option.value ? "text-primary font-medium" : "text-foreground"
                }`}
              >
                {option.label}
                {currentLockLevel === option.value && " (current)"}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
