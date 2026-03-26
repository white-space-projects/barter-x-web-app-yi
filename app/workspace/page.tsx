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

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlobalNav } from "@/components/global-nav";
import { useBarterStore } from "@/lib/store";
import { ProductsTab } from "@/components/app/products-tab";
import { MyOffersTab } from "@/components/app/my-offers-tab";
import { TabContentWrapper } from "@/components/app/tab-content-wrapper";
import { ChatTab } from "@/components/app/chat-tab";
import { AddOfferModal } from "@/components/app/add-offer-modal";
import { AdminPanel } from "@/components/app/admin-panel";
import { SimulateTab } from "@/components/app/simulate-tab";
import { ProfileTab } from "@/components/app/profile-tab";
import { PickupReadinessModal } from "@/components/app/pickup-readiness-modal";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { BottomNav } from "@/components/app/bottom-nav";
import { Loader2, ShieldCheck } from "lucide-react";
import type { ProductType } from "@/lib/types";

// Tab type definition - profile is now a utility tab shown in tab content
type UtilityTab = "my-offers" | "chat" | "admin" | "simulate" | "profile";

export default function WorkspacePage() {
  // ---------------------------------------------------------------------------
  // STORE & ROUTER
  // ---------------------------------------------------------------------------
  const { auth, authReady, getUnreadCount, getTotalUnreadMessages } = useBarterStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ---------------------------------------------------------------------------
  // LOCAL STATE
  // ---------------------------------------------------------------------------
  const [activeProductType, setActiveProductType] = useState<ProductType>("goods");
  const [activeUtilityTab, setActiveUtilityTab] = useState<UtilityTab | null>(null);
  const [addOfferOpen, setAddOfferOpen] = useState(false);
  const [pickupModalOfferId, setPickupModalOfferId] = useState<string | null>(null);

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
            onSelectProductType={showNavigation ? setActiveProductType : () => {}}
            onSelectUtilityTab={showNavigation ? setActiveUtilityTab : () => {}}
            onAddOffer={showNavigation ? () => setAddOfferOpen(true) : () => {}}
            isAdmin={isAdmin}
            unreadCount={totalUnread}
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
                  {activeUtilityTab === "my-offers" && "My Offers"}
                  {activeUtilityTab === "chat" && "Chat"}
                  {activeUtilityTab === "admin" && "Admin Panel"}
                  {activeUtilityTab === "simulate" && "Simulate"}
                  {activeUtilityTab === "profile" && "Profile"}
                  {!activeUtilityTab && activeProductType === "goods" && "General Goods Barter"}
                  {!activeUtilityTab && activeProductType === "automobile" && "Automobile Barter"}
                  {!activeUtilityTab && activeProductType === "home-spaces" && "Homes & Spaces Barter"}
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

          {/* Tab content - full height, all tabs use TabContentWrapper for consistent scroll behavior */}
          <div className="flex-1 flex flex-col overflow-hidden pb-20 lg:pb-0 px-4 py-6 lg:px-6">
            {/* Utility tabs */}
            {activeUtilityTab === "my-offers" && (
              <TabContentWrapper>
                <MyOffersTab />
              </TabContentWrapper>
            )}
            {activeUtilityTab === "chat" && (
              <TabContentWrapper>
                <ChatTab onOpenPickupModal={setPickupModalOfferId} />
              </TabContentWrapper>
            )}
            {activeUtilityTab === "admin" && isAdmin && (
              <TabContentWrapper>
                <AdminPanel />
              </TabContentWrapper>
            )}
            {activeUtilityTab === "simulate" && isAdmin && (
              <TabContentWrapper>
                <SimulateTab />
              </TabContentWrapper>
            )}
            {activeUtilityTab === "profile" && (
              <TabContentWrapper>
                <ProfileTab 
                  onProfileComplete={() => {
                    // Navigate to main screen (Goods Barter tab by default)
                    setActiveUtilityTab(null);
                    setActiveProductType("goods");
                  }} 
                />
              </TabContentWrapper>
            )}
              
            {/* Product type tabs - ProductsTab has its own TabContentWrapper internally */}
            {!activeUtilityTab && <ProductsTab productType={activeProductType} />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - hidden for new users until profile is complete */}
      {showNavigation && (
        <div className="lg:hidden">
          <BottomNav
            activeProductType={activeProductType}
            activeUtilityTab={activeUtilityTab}
            onSelectProductType={setActiveProductType}
            onSelectUtilityTab={setActiveUtilityTab}
            onAddOffer={() => setAddOfferOpen(true)}
            isAdmin={isAdmin}
            unreadCount={totalUnread}
          />
        </div>
      )}

      {/* Global Add Offer Modal */}
      <AddOfferModal
        open={addOfferOpen}
        onClose={() => setAddOfferOpen(false)}
      />

      {/* Pickup Readiness Modal - triggered from notifications */}
      {pickupModalOfferId && (
        <PickupReadinessModal
          offerId={pickupModalOfferId}
          onClose={() => setPickupModalOfferId(null)}
        />
      )}
    </div>
  );
}
