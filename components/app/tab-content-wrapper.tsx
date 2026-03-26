"use client";

/**
 * ============================================================================
 * TAB CONTENT WRAPPER
 * ============================================================================
 * 
 * A wrapper component that provides consistent layout for all tab content.
 * - 100% width and height, fills the available space
 * - Automatically expands when sidebar collapses
 * - Includes built-in scroll behavior
 * - Can display a detail panel (e.g., ViewOffersPanel) that replaces the main content
 * 
 * Usage:
 * <TabContentWrapper
 *   detailPanel={selectedProduct ? <ViewOffersPanel ... /> : null}
 *   onCloseDetail={() => setSelectedProduct(null)}
 * >
 *   <YourMainContent />
 * </TabContentWrapper>
 */

import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface TabContentWrapperProps {
  children: ReactNode;
  /** Optional detail panel to show (replaces main content when present) */
  detailPanel?: ReactNode | null;
  /** Callback when closing the detail panel */
  onCloseDetail?: () => void;
  /** Optional title for the detail panel header */
  detailTitle?: string;
  /** Optional subtitle for the detail panel header */
  detailSubtitle?: string;
  /** Optional header actions for the detail panel */
  detailHeaderActions?: ReactNode;
  /** Whether to show padding (default: true) */
  noPadding?: boolean;
}

export function TabContentWrapper({
  children,
  detailPanel,
  onCloseDetail,
  detailTitle,
  detailSubtitle,
  detailHeaderActions,
  noPadding = false,
}: TabContentWrapperProps) {
  // If detail panel is provided, show it instead of children
  if (detailPanel) {
    return (
      <div className="flex flex-col h-full w-full">
        {/* Detail Panel Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onCloseDetail}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              {detailTitle && (
                <h2 className="text-sm font-semibold text-foreground truncate">
                  {detailTitle}
                </h2>
              )}
              {detailSubtitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {detailSubtitle}
                </p>
              )}
            </div>
          </div>
          {detailHeaderActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {detailHeaderActions}
            </div>
          )}
        </div>

        {/* Detail Panel Content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className={noPadding ? "" : "p-4"}>
            {detailPanel}
          </div>
        </div>
      </div>
    );
  }

  // Default: show children - scroll is handled by the parent or the content itself
  return (
    <div className="flex flex-col h-full w-full overflow-y-auto">
      {children}
    </div>
  );
}
