"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Plus, ArrowLeft, ChevronRight, Bell, Sparkles } from "lucide-react";

/**
 * Notifications Page - Innovative visual notification system
 * 
 * This page demonstrates a new approach to notifications where
 * each user state is shown with visual, self-explaining cards
 * that guide users on what to do next.
 */

// Notification types that map to different user states
type NotificationType = "new_user" | "first_offer" | "awaiting_hooks" | "cycle_found";

export default function NotificationsPage() {
  const [activeNotification, setActiveNotification] = useState<NotificationType>("new_user");

  const notifications: { type: NotificationType; title: string; description: string }[] = [
    { type: "new_user", title: "Welcome Notification", description: "Shown when a new user joins - guides them to create their first offer" },
    { type: "first_offer", title: "First Offer Created", description: "Celebration and next steps after creating first offer" },
    { type: "awaiting_hooks", title: "Awaiting Hooks", description: "Encourages user to hook other offers" },
    { type: "cycle_found", title: "Cycle Found", description: "Exciting notification when a trade cycle is detected" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Notifications Design</span>
          </div>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Notification Type Selector */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {notifications.map((n) => (
            <button
              key={n.type}
              onClick={() => setActiveNotification(n.type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeNotification === n.type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {n.title}
            </button>
          ))}
        </div>

        {/* Description */}
        <p className="text-center text-muted-foreground text-sm mb-12">
          {notifications.find(n => n.type === activeNotification)?.description}
        </p>
      </div>

      {/* Main Content - Center Focused */}
      <main className="max-w-3xl mx-auto px-4 pb-24">
        {activeNotification === "new_user" && <NewUserNotification />}
        {activeNotification === "first_offer" && <FirstOfferNotification />}
        {activeNotification === "awaiting_hooks" && <AwaitingHooksNotification />}
        {activeNotification === "cycle_found" && <CycleFoundNotification />}
      </main>
    </div>
  );
}

/**
 * NEW USER NOTIFICATION
 * Shows an empty offer card with instructional arrows
 */
function NewUserNotification() {
  return (
    <div className="flex flex-col items-center">
      {/* Welcome Message */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Sparkles className="h-4 w-4" />
          Welcome to Barter-X
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Create Your First Offer</h1>
        <p className="text-muted-foreground">Follow 4 easy steps to list what you want to trade</p>
      </div>

      {/* Instructional Offer Card with Arrows */}
      <div className="relative w-full max-w-md">
        {/* STEP 1 Arrow - Points to Subcategory/Brand */}
        <div className="absolute -right-4 top-[140px] translate-x-full hidden lg:flex items-start gap-2">
          <svg width="60" height="30" className="text-primary" viewBox="0 0 60 30">
            <path d="M60 15 L20 15 L20 5 L0 15 L20 25 L20 15" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 max-w-[180px]">
            <span className="text-primary font-bold text-xs">STEP 1</span>
            <p className="text-xs text-foreground mt-1">Choose product model</p>
          </div>
        </div>

        {/* STEP 2 Arrow - Points to Image */}
        <div className="absolute -left-4 top-[80px] -translate-x-full hidden lg:flex items-start gap-2 flex-row-reverse">
          <svg width="60" height="30" className="text-primary" viewBox="0 0 60 30">
            <path d="M0 15 L40 15 L40 5 L60 15 L40 25 L40 15" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 max-w-[180px] text-right">
            <span className="text-primary font-bold text-xs">STEP 2</span>
            <p className="text-xs text-foreground mt-1">Add up to 7 images of your offer</p>
          </div>
        </div>

        {/* STEP 3 Arrow - Points to Title/Description/Condition */}
        <div className="absolute -right-4 top-[40px] translate-x-full hidden lg:flex items-start gap-2">
          <svg width="80" height="60" className="text-primary" viewBox="0 0 80 60">
            {/* Main arrow */}
            <path d="M80 30 L40 30 L40 10 L20 30 L40 50 L40 30" fill="none" stroke="currentColor" strokeWidth="2" />
            {/* Branch to condition badge */}
            <path d="M30 30 L30 10 L10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
            {/* Branch to title */}
            <path d="M30 30 L10 30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
          </svg>
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 max-w-[200px]">
            <span className="text-primary font-bold text-xs">STEP 3</span>
            <p className="text-xs text-foreground mt-1">Add Offer Title, Description and Condition</p>
          </div>
        </div>

        {/* STEP 4 Arrow - Points to Address */}
        <div className="absolute -left-4 top-[200px] -translate-x-full hidden lg:flex items-start gap-2 flex-row-reverse">
          <svg width="60" height="30" className="text-primary" viewBox="0 0 60 30">
            <path d="M0 15 L40 15 L40 5 L60 15 L40 25 L40 15" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 max-w-[180px] text-right">
            <span className="text-primary font-bold text-xs">STEP 4</span>
            <p className="text-xs text-foreground mt-1">Add your pickup address</p>
          </div>
        </div>

        {/* The Empty Offer Card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden w-full">
          {/* Image Area with Condition Badge */}
          <div className="relative aspect-[4/3] bg-secondary flex items-center justify-center">
            {/* Condition Badge - Top Left */}
            <div className="absolute top-3 left-3">
              <span className="inline-block px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm text-xs font-semibold text-muted-foreground border border-dashed border-muted-foreground/50">
                Condition
              </span>
            </div>
            
            {/* Placeholder Icon */}
            <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
              <Package className="h-16 w-16" />
              <span className="text-sm">Product Image</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 space-y-3">
            {/* Title Placeholder */}
            <div className="h-6 rounded bg-secondary/80 border border-dashed border-muted-foreground/30 flex items-center px-3">
              <span className="text-xs text-muted-foreground/60">Offer Title</span>
            </div>

            {/* Subcategory / Brand Placeholder */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 rounded bg-secondary/80 border border-dashed border-muted-foreground/30 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/60">Subcategory</span>
              </div>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50" />
              <div className="h-4 w-16 rounded bg-secondary/80 border border-dashed border-muted-foreground/30 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/60">Brand</span>
              </div>
            </div>

            {/* Description Placeholder */}
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-secondary/60 border border-dashed border-muted-foreground/20" />
              <div className="h-3 w-3/4 rounded bg-secondary/60 border border-dashed border-muted-foreground/20" />
            </div>

            {/* Address Placeholder */}
            <div className="flex items-center gap-1 text-primary/60">
              <div className="h-4 w-28 rounded bg-primary/10 border border-dashed border-primary/30 flex items-center justify-center">
                <span className="text-[10px] text-primary/70">Pickup Address</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex-1" />
              <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />
                Add Offer
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Steps - Shown below card on smaller screens */}
        <div className="lg:hidden mt-8 space-y-3">
          {[
            { step: 1, text: "Choose product model", target: "Subcategory & Brand" },
            { step: 2, text: "Add up to 7 images of your offer", target: "Image Area" },
            { step: 3, text: "Add Offer Title, Description and Condition", target: "Title & Condition" },
            { step: 4, text: "Add your pickup address", target: "Address" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 bg-card/50 rounded-lg p-3 border border-border">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {item.step}
              </span>
              <div>
                <p className="text-sm text-foreground font-medium">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.target}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * FIRST OFFER CREATED NOTIFICATION
 * Celebration after creating first offer
 */
function FirstOfferNotification() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Congratulations!</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        You&apos;ve created your first offer. Now it&apos;s time to find items you&apos;d like to trade for.
      </p>
      
      {/* Sample created offer card */}
      <div className="rounded-xl border border-primary/30 bg-card overflow-hidden w-full max-w-sm mb-8">
        <div className="relative aspect-[4/3] bg-secondary flex items-center justify-center">
          <span className="absolute top-3 left-3 inline-block px-3 py-1 rounded-full bg-primary/20 text-xs font-semibold text-primary">
            GOOD
          </span>
          <Package className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <div className="p-4">
          <p className="text-sm font-medium text-foreground">Your First Offer</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            Electronics <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" /> Phones
          </p>
          <p className="text-xs text-primary font-medium mt-1">Hooks 0/3</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 max-w-md">
        <h3 className="text-sm font-semibold text-foreground mb-3">What&apos;s next?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground text-left">Browse offers from other users</p>
          </div>
          <div className="flex items-start gap-3">
            <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground text-left">Hook up to 3 offers you&apos;d like to trade for</p>
          </div>
          <div className="flex items-start gap-3">
            <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground text-left">Wait for a trade cycle to be found</p>
          </div>
        </div>
        <button className="w-full mt-6 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          Browse Offers
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * AWAITING HOOKS NOTIFICATION
 * Encourages user to hook other offers
 */
function AwaitingHooksNotification() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 relative">
        <Package className="h-10 w-10 text-muted-foreground" />
        <div className="absolute -right-1 -top-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          0
        </div>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">No Hooks Yet</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Your offer needs at least one hook to participate in trade cycles. Browse offers and hook items you want!
      </p>
      
      {/* Visual explanation */}
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-center gap-4 mb-6">
          {/* Your offer */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center mb-2 border border-border">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Your Offer</span>
          </div>
          
          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <svg width="60" height="24" className="text-primary">
              <path d="M0 12 L40 12 M35 6 L45 12 L35 18" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-[10px] text-primary font-medium">HOOK</span>
          </div>
          
          {/* Target offer */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-lg bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center mb-2">
              <span className="text-2xl text-primary">?</span>
            </div>
            <span className="text-xs text-muted-foreground">Their Offer</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Hooking tells the system what you want. When a trade cycle is found, everyone gets what they hooked!
        </p>
        
        <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          Find Offers to Hook
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * CYCLE FOUND NOTIFICATION
 * Exciting notification when trade cycle is detected
 */
function CycleFoundNotification() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated celebration */}
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative w-24 h-24 rounded-full bg-primary/30 flex items-center justify-center">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-foreground mb-2">Trade Cycle Found!</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Great news! A trade cycle has been found that includes your offer. Confirm your pickup readiness to proceed.
      </p>
      
      {/* Cycle visualization */}
      <div className="bg-card border border-primary/30 rounded-xl p-6 max-w-lg w-full mb-8">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* User A gives to User B */}
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">You</span>
            </div>
            <svg width="30" height="16" className="text-primary">
              <path d="M0 8 L20 8 M16 4 L24 8 L16 12" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">B</span>
            </div>
            <svg width="30" height="16" className="text-muted-foreground">
              <path d="M0 8 L20 8 M16 4 L24 8 L16 12" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">C</span>
            </div>
            <svg width="30" height="16" className="text-muted-foreground">
              <path d="M0 8 L20 8 M16 4 L24 8 L16 12" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          
          <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">You</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          You give to B, B gives to C, C gives to You
        </p>
      </div>
      
      <div className="flex gap-3">
        <button className="px-6 py-3 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
          View Details
        </button>
        <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          Confirm Pickup Readiness
        </button>
      </div>
    </div>
  );
}
