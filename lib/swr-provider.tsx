/**
 * ============================================================================
 * SWR PROVIDER
 * ============================================================================
 * 
 * Global SWR configuration provider.
 * Configures default behavior for all SWR hooks in the application.
 * ============================================================================
 */

"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Don't revalidate on window focus for better UX
        revalidateOnFocus: false,
        // Do revalidate when coming back online
        revalidateOnReconnect: true,
        // Dedupe requests within 5 seconds
        dedupingInterval: 5000,
        // Retry failed requests up to 3 times
        errorRetryCount: 3,
        // Wait 1 second between retries
        errorRetryInterval: 1000,
        // Show stale data while revalidating
        keepPreviousData: true,
        // Global error handler
        onError: (error, key) => {
          console.error(`[SWR] Error for ${key}:`, error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
