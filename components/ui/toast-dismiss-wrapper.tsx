"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * A wrapper that dismisses all toasts when user taps anywhere on the screen.
 * This is especially useful on mobile to quickly dismiss notifications.
 */
export function ToastDismissWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function handleTap(e: TouchEvent | MouseEvent) {
      // Don't dismiss if clicking on the toast itself (let close button work)
      const target = e.target as HTMLElement;
      if (target.closest("[data-sonner-toast]")) {
        return;
      }
      toast.dismiss();
    }

    // Use touchstart for mobile, click for desktop
    document.addEventListener("touchstart", handleTap, { passive: true });
    
    return () => {
      document.removeEventListener("touchstart", handleTap);
    };
  }, []);

  return <>{children}</>;
}
