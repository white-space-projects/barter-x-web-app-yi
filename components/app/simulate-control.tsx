"use client";

/**
 * TEMPORARY SIMULATE CONTROL - FOR TESTING ONLY
 * Remove before production deployment.
 */

import { useState } from "react";
import type { LockLevel, HookStatus } from "@/lib/types";
import { useBarterStore } from "@/lib/store";
import { toast } from "sonner";

type SimulateControlProps = {
  currentLockLevel: LockLevel;
  hookId: string;
  targetOfferId: string;
};

export function SimulateControl({ currentLockLevel, hookId, targetOfferId }: SimulateControlProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { updateOffer, updateHook } = useBarterStore();

  const handleSimulate = (lockLevel: LockLevel) => {
    console.log("[v0] handleSimulate:", { lockLevel, hookId, targetOfferId });
    
    const statusMap: Record<LockLevel, HookStatus> = {
      0: "searching",
      1: "reserved",
      2: "processing",
      3: "exchanged",
    };

    updateOffer(targetOfferId, {
      lockLevel,
      lockUpdatedAt: new Date().toISOString(),
    });

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
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          console.log("[v0] Simulate clicked");
          setShowMenu((prev) => !prev);
        }}
        className="px-2 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/30 border-dashed hover:bg-amber-500/20 transition-colors"
      >
        Simulate
      </button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          
          <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
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
        </>
      )}
    </div>
  );
}
