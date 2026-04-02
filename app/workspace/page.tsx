"use client";

/**
 * ============================================================================
 * WORKSPACE PAGE - Main application workspace
 * ============================================================================
 * 
 * This is the main authenticated workspace where users can:
 * - Browse products by barter type (Goods, Automobile, Homes & Spaces)
 * - Manage their offers (My Offers)
 * - View notifications and chat (Chat)
 * - Add new offers (Add Offer button)
 * 
 * Navigation:
 * - Desktop: Collapsible sidebar on the left
 * - Mobile: Bottom navigation bar (app-like experience)
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlobalNav } from "@/components/global-nav";
import { useBarterStore } from "@/lib/store";
import { ProductsTab } from "@/components/app/products-tab";
import { MyOffersTab } from "@/components/app/my-offers-tab";
import { TabContentWrapper } from "@/components/app/tab-content-wrapper";
import { ChatTab } from "@/components/app/chat-tab";
import { AddOfferFlow } from "@/components/app/add-offer-flow";
import { AdminPanel } from "@/components/app/admin-panel";
import { SimulateTab } from "@/components/app/simulate-tab";
import { ProfileTab } from "@/components/app/profile-tab";
import { PickupReadinessModal } from "@/components/app/pickup-readiness-modal";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { BottomNav } from "@/components/app/bottom-nav";
import { NavigationConfirmDialog } from "@/components/app/navigation-confirm-dialog";
import { NavigationGuardProvider, useNavigationGuard } from "@/lib/navigation-guard";
import { Loader2, ShieldCheck } from "lucide-react";
import type { ProductType } from "@/lib/types";

// Tab type definition - profile is now a utility tab shown in tab content
type UtilityTab = "my-offers" | "chat" | "admin" | "simulate" | "profile";

// Inner component that uses the navigation guard
function WorkspaceContent() {
  // ---------------------------------------------------------------------------
  // STORE & ROUTER
  // ---------------------------------------------------------------------------
  const { auth, authReady, getUnreadCount, getTotalUnreadMessages } = useBarterStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    hasBlocker,
    setPendingNavigation,
    setShowConfirmDialog,
    pendingNavigation,
    clearAllBlockers,
  } = useNavigationGuard();
  
  // ---------------------------------------------------------------------------
  // LOCAL STATE
  // ---------------------------------------------------------------------------
  const [activeProductType, setActiveProductType] = useState<ProductType>("goods");
  const [activeUtilityTab, setActiveUtilityTab] = useState<UtilityTab | null>(null);
  const [addOfferOpen, setAddOfferOpen] = useState(false);
  const [addOfferStep, setAddOfferStep] = useState<1 | 2 | 3 | 4>(1);
  const [pickupModalOfferId, setPickupModalOfferId] = useState<string | null>(null);
  
  // Ref for scrollable content area - used to reset scroll on tab change
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // NAVIGATION HANDLERS WITH GUARD
  // ---------------------------------------------------------------------------
  const handleSelectProductType = useCallback((type: ProductType) => {
    // Check if there are unsaved changes (either offer creation or profile editing)
    if (hasBlocker()) {
      setPendingNavigation({ type: "product-type", value: type });
      setShowConfirmDialog(true);
      return;
    }
    // Close offer modal if open (no unsaved changes)
    if (addOfferOpen) {
      setAddOfferOpen(false);
    }
    setActiveProductType(type);
    setActiveUtilityTab(null);
  }, [hasBlocker, addOfferOpen, setPendingNavigation, setShowConfirmDialog]);

  const handleSelectUtilityTab = useCallback((tab: UtilityTab | null) => {
    // Check if there are unsaved changes (either offer creation or profile editing)
    if (hasBlocker()) {
      setPendingNavigation({ type: "utility-tab", value: tab });
      setShowConfirmDialog(true);
      return;
    }
    // Close offer modal if open (no unsaved changes)
    if (addOfferOpen) {
      setAddOfferOpen(false);
    }
    setActiveUtilityTab(tab);
  }, [hasBlocker, addOfferOpen, setPendingNavigation, setShowConfirmDialog]);

  // Handle confirmed navigation (after user confirms discard/save)
  const handleConfirmNavigation = useCallback(() => {
    // Close offer modal if it was open
    if (addOfferOpen) {
      setAddOfferOpen(false);
    }
    
    if (pendingNavigation) {
      if (pendingNavigation.type === "product-type") {
        setActiveProductType(pendingNavigation.value as ProductType);
        setActiveUtilityTab(null);
      } else if (pendingNavigation.type === "utility-tab") {
        setActiveUtilityTab(pendingNavigation.value as UtilityTab | null);
      }
      setPendingNavigation(null);
    }
  }, [pendingNavigation, setPendingNavigation, addOfferOpen]);

  // ---------------------------------------------------------------------------
  // COMPUTED VALUES (all hooks must be before conditional returns)
  // ---------------------------------------------------------------------------
  
  // Calculate total unread count for badge
  const unreadNotifications = getUnreadCount();
  const unreadMessages = getTotalUnreadMessages();
  const totalUnread = unreadNotifications + unreadMessages;

  const isAdmin = auth.user?.isAdmin === true;

  /**
   * NEW USER CHECK
   * ==============
   * New users who haven't completed their profile (Full Name, City, Country)
   * should be shown the Profile tab and have the sidebar hidden.
   * This ensures they complete mandatory fields before using the app.
   * 
   * BACKEND NOTE: These fields MUST be mapped to backend database:
   * - fullName (required)
   * - city (required) - Used for product filtering
   * - country (required) - Used for product filtering
   * 
   * Store in session: { fullName, city, country, isProfileComplete: true/false }
   */
  const isNewUser = !auth.user?.isProfileComplete;

  // Determine if navigation should be shown (hide for new users until profile complete)
  const showNavigation = !isNewUser;

  /**
   * BACKEND NOTE: User's city and country should be fetched from profile.
   * On login, we auto-detect location from IP address.
   * If profile city/country differs from auto-detected, re-fetch products.
   * Products API: GET /api/products?country={country}&city={city}
   */
  const userLocation = useMemo(() => {
    const city = auth.user?.profileAddress?.city || auth.user?.city || "";
    const country = auth.user?.profileAddress?.country || auth.user?.country || "";
    if (city && country) {
      return `${city}, ${country}`;
    }
    return city || country || "";
  }, [auth.user]);

  // ---------------------------------------------------------------------------
  // EFFECTS (all hooks must be before conditional returns)
  // ---------------------------------------------------------------------------

  // Handle URL tab parameter - only on initial load
  const [initialUrlHandled, setInitialUrlHandled] = useState(false);
  useEffect(() => {
    if (initialUrlHandled) return;
    const tab = searchParams.get("tab");
    if (tab === "profile") {
      setActiveUtilityTab("profile");
    }
    setInitialUrlHandled(true);
  }, [searchParams, initialUrlHandled]);

  // Authentication check - redirect if not logged in
  useEffect(() => {
    if (authReady && !auth.isAuthenticated) {
      router.replace("/login");
    }
  }, [authReady, auth.isAuthenticated, router]);

  // Force profile tab for new users
  useEffect(() => {
    if (authReady && auth.isAuthenticated && isNewUser && activeUtilityTab !== "profile") {
      setActiveUtilityTab("profile");
    }
  }, [authReady, auth.isAuthenticated, isNewUser, activeUtilityTab]);

  // Reset scroll position to top when switching tabs
  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [activeProductType, activeUtilityTab]);

  // ---------------------------------------------------------------------------
  // LOADING STATES (after all hooks)
  // ---------------------------------------------------------------------------
  
  if (!authReady) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalNav />
        <main className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalNav />
        <main className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Fixed Navbar */}
      <GlobalNav />

      {/* Main layout with fixed sidebar and scrollable content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - always visible, blurred for new users until profile complete */}
        <div className="relative">
          <SidebarNav
            activeProductType={activeProductType}
            activeUtilityTab={activeUtilityTab}
            onSelectProductType={showNavigation ? handleSelectProductType : () => {}}
            onSelectUtilityTab={showNavigation ? handleSelectUtilityTab : () => {}}
            onAddOffer={showNavigation ? () => { setAddOfferOpen(true); setAddOfferStep(1); } : () => {}}
            isAdmin={isAdmin}
            unreadCount={totalUnread}
            addOfferMode={addOfferOpen ? {
              currentStep: addOfferStep,
              onStepClick: (step) => setAddOfferStep(step),
              onClose: () => setAddOfferOpen(false),
            } : null}
          />
          {/* Blur overlay for new users */}
          {!showNavigation && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20" />
          )}
        </div>

        {/* Main content area with fixed header bar */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Header bar - shows current context */}
          <div className="flex-shrink-0 border-b border-border bg-card/95 backdrop-blur-md z-10">
            <div className="flex h-12 items-center justify-between px-4 lg:px-6">
              {/* Current view title */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {addOfferOpen && `Add New Offer - Step ${addOfferStep}`}
                  {!addOfferOpen && activeUtilityTab === "my-offers" && "My Offers"}
                  {!addOfferOpen && activeUtilityTab === "chat" && "Chat"}
                  {!addOfferOpen && activeUtilityTab === "admin" && "Admin Panel"}
                  {!addOfferOpen && activeUtilityTab === "simulate" && "Simulate"}
                  {!addOfferOpen && activeUtilityTab === "profile" && "Profile"}
                  {!addOfferOpen && !activeUtilityTab && activeProductType === "goods" && "General Goods Barter"}
                  {!addOfferOpen && !activeUtilityTab && activeProductType === "automobile" && "Automobile Barter"}
                  {!addOfferOpen && !activeUtilityTab && activeProductType === "home-spaces" && "Homes & Spaces Barter"}
                </span>
              </div>
              
              {/* User location from profile (City, Country) */}
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                {userLocation || "Set location in Profile"}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    <ShieldCheck className="h-3 w-3" />
                    Admin
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Tab content - scrollable area for all tab content */}
          <div ref={contentScrollRef} className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="px-4 py-6 lg:px-6">
              {/* Add Offer Flow - renders inline in tab content area */}
              {addOfferOpen && (
                <AddOfferFlow
                  open={true}
                  embedded={true}
                  currentStep={addOfferStep}
                  onStepChange={setAddOfferStep}
                  onClose={() => setAddOfferOpen(false)}
                  onSuccess={() => {
                    setAddOfferOpen(false);
                    setActiveUtilityTab("my-offers");
                  }}
                />
              )}

              {/* Utility tabs - hidden when Add Offer is open */}
              {!addOfferOpen && activeUtilityTab === "my-offers" && <MyOffersTab />}
              {!addOfferOpen && activeUtilityTab === "chat" && <ChatTab onOpenPickupModal={setPickupModalOfferId} />}
              {!addOfferOpen && activeUtilityTab === "admin" && isAdmin && <AdminPanel />}
              {!addOfferOpen && activeUtilityTab === "simulate" && isAdmin && <SimulateTab />}
              {!addOfferOpen && activeUtilityTab === "profile" && (
                <ProfileTab 
                  onProfileComplete={() => {
                    // Clear any blockers and navigate to main screen
                    clearAllBlockers();
                    setActiveUtilityTab(null);
                    setActiveProductType("goods");
                  }} 
                />
              )}
              
              {/* Product type tabs - key forces remount when switching types */}
              {!addOfferOpen && !activeUtilityTab && (
                <ProductsTab 
                  key={activeProductType} 
                  productType={activeProductType} 
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - hidden for new users or when Add Offer is open */}
      {showNavigation && !addOfferOpen && (
        <div className="lg:hidden">
          <BottomNav
            activeProductType={activeProductType}
            activeUtilityTab={activeUtilityTab}
            onSelectProductType={handleSelectProductType}
            onSelectUtilityTab={handleSelectUtilityTab}
            onAddOffer={() => { setAddOfferOpen(true); setAddOfferStep(1); }}
            isAdmin={isAdmin}
            unreadCount={totalUnread}
          />
        </div>
      )}



      {/* Pickup Readiness Modal - triggered from notifications */}
      {pickupModalOfferId && (
        <PickupReadinessModal
          offerId={pickupModalOfferId}
          onClose={() => setPickupModalOfferId(null)}
        />
      )}

      {/* Navigation Confirmation Dialog */}
      <NavigationConfirmDialog onConfirmNavigation={handleConfirmNavigation} />
    </div>
  );
}

// Main export wrapped with NavigationGuardProvider
export default function WorkspacePage() {
  return (
    <NavigationGuardProvider>
      <WorkspaceContent />
    </NavigationGuardProvider>
  );
}
