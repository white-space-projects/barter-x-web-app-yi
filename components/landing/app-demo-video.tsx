"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  Maximize2,
  ShoppingBag,
  Package,
  Link2,
  Check,
  ArrowRight,
  MessageSquare,
  Shield,
  Sparkles,
  ChevronRight,
  Plus,
  Home,
  User,
  Clock,
  CheckCircle2,
  Send,
  Lock,
  Unlock
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Demo step configuration
const DEMO_STEPS = [
  {
    id: "intro",
    title: "Welcome to BARTER-X",
    subtitle: "The smart way to trade",
    duration: 3000,
  },
  {
    id: "browse",
    title: "Browse Offers",
    subtitle: "Discover items others want to trade",
    duration: 4000,
  },
  {
    id: "create-offer",
    title: "Create Your Offer",
    subtitle: "List what you have to trade",
    duration: 4500,
  },
  {
    id: "select-product",
    title: "Select Product",
    subtitle: "Choose the exact item",
    duration: 3500,
  },
  {
    id: "offer-details",
    title: "Add Details",
    subtitle: "Describe condition and preferences",
    duration: 4000,
  },
  {
    id: "offer-published",
    title: "Offer Published!",
    subtitle: "Your offer is now live",
    duration: 3000,
  },
  {
    id: "find-hook",
    title: "Find What You Want",
    subtitle: "Browse offers to hook",
    duration: 4000,
  },
  {
    id: "hook-offer",
    title: "Hook an Offer",
    subtitle: "Connect your item to theirs",
    duration: 4000,
  },
  {
    id: "hook-confirmed",
    title: "Hook Created!",
    subtitle: "Waiting for cycle detection",
    duration: 3000,
  },
  {
    id: "my-offers",
    title: "My Offers",
    subtitle: "Track your trading activity",
    duration: 3500,
  },
  {
    id: "cycle-detected",
    title: "Cycle Detected!",
    subtitle: "A trade match has been found",
    duration: 4000,
  },
  {
    id: "reserved",
    title: "Status: Reserved",
    subtitle: "Your offer is locked in a cycle",
    duration: 3500,
  },
  {
    id: "pickup-confirm",
    title: "Confirm Pickup",
    subtitle: "Verify your address details",
    duration: 4000,
  },
  {
    id: "escrow-pay",
    title: "Pay Escrow",
    subtitle: "Secure the transaction",
    duration: 4000,
  },
  {
    id: "escrow-complete",
    title: "Escrow Complete",
    subtitle: "Ready for exchange",
    duration: 3000,
  },
  {
    id: "chat",
    title: "Chat with Trader",
    subtitle: "Coordinate pickup details",
    duration: 4500,
  },
  {
    id: "exchange",
    title: "Exchange Complete!",
    subtitle: "Trade successful",
    duration: 4000,
  },
  {
    id: "outro",
    title: "Start Trading Today",
    subtitle: "Join thousands of barterers",
    duration: 3500,
  },
];

// Phone frame component
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px] md:w-[360px]">
      {/* Phone bezel */}
      <div className="relative rounded-[2.5rem] bg-gradient-to-b from-zinc-700 to-zinc-900 p-2 shadow-2xl">
        {/* Inner frame */}
        <div className="relative rounded-[2rem] bg-black overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-24 h-6 bg-black rounded-b-2xl" />
          
          {/* Screen content */}
          <div className="relative bg-background rounded-[2rem] overflow-hidden aspect-[9/19.5]">
            {children}
          </div>
        </div>
      </div>
      
      {/* Reflection effect */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </div>
  );
}

// Mock app status bar
function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 py-2 text-[10px] text-foreground/80">
      <span className="font-medium">9:41</span>
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          {[1,2,3,4].map((i) => (
            <div key={i} className={`w-1 rounded-sm ${i <= 3 ? 'bg-foreground/80' : 'bg-foreground/30'}`} style={{ height: 4 + i * 2 }} />
          ))}
        </div>
        <span className="ml-1">5G</span>
        <div className="ml-1 w-6 h-3 rounded-sm border border-foreground/50 relative">
          <div className="absolute inset-0.5 bg-green-500 rounded-sm" style={{ width: '80%' }} />
        </div>
      </div>
    </div>
  );
}

// Mock bottom nav
function MockBottomNav({ activeTab = "goods" }: { activeTab?: string }) {
  const tabs = [
    { id: "goods", icon: ShoppingBag, label: "Goods" },
    { id: "home", icon: Home, label: "Spaces" },
    { id: "add", icon: Plus, label: "Add", isCenter: true },
    { id: "offers", icon: Package, label: "Offers" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex flex-col items-center gap-0.5 ${
              tab.isCenter 
                ? "relative -mt-4" 
                : tab.id === activeTab 
                  ? "text-primary" 
                  : "text-muted-foreground"
            }`}
          >
            {tab.isCenter ? (
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <tab.icon className="h-5 w-5 text-primary-foreground" />
              </div>
            ) : (
              <>
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px]">{tab.label}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Individual screen components for each step
function IntroScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-primary/20 to-background p-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 animate-pulse">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground text-center">BARTER-X</h2>
      <p className="text-sm text-muted-foreground mt-2 text-center">Trade without money</p>
    </div>
  );
}

function BrowseScreen() {
  const offers = [
    { title: "iPhone 14 Pro", subtitle: "Excellent condition", color: "bg-blue-500/20" },
    { title: "MacBook Air M2", subtitle: "Like new, with box", color: "bg-purple-500/20" },
    { title: "Sony WH-1000XM5", subtitle: "Noise cancelling", color: "bg-green-500/20" },
  ];

  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold">Goods</h1>
        <p className="text-xs text-muted-foreground">23 offers available</p>
      </div>
      <div className="flex-1 overflow-hidden p-3 space-y-2">
        {offers.map((offer, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border animate-fadeInUp"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className={`w-12 h-12 rounded-lg ${offer.color} flex items-center justify-center`}>
              <Package className="h-5 w-5 text-foreground/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{offer.title}</p>
              <p className="text-xs text-muted-foreground">{offer.subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>
      <MockBottomNav activeTab="goods" />
    </div>
  );
}

function CreateOfferScreen() {
  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <Plus className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Create Offer</h1>
          <p className="text-xs text-muted-foreground">Step 1 of 4</p>
        </div>
      </div>
      <div className="flex-1 p-4">
        <p className="text-sm text-muted-foreground mb-4">What type of item?</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: ShoppingBag, label: "Goods", selected: true },
            { icon: Home, label: "Home Space", selected: false },
          ].map((type, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                type.selected 
                  ? "border-primary bg-primary/10" 
                  : "border-border bg-card"
              }`}
            >
              <type.icon className={`h-6 w-6 ${type.selected ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm ${type.selected ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {type.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <Button className="w-full">Continue</Button>
      </div>
    </div>
  );
}

function SelectProductScreen() {
  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold">Select Product</h1>
        <p className="text-xs text-muted-foreground">Choose your item</p>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search products..."
            className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-sm"
            defaultValue="iPhone"
          />
        </div>
        <div className="space-y-2">
          {["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15"].map((product, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border-2 transition-all ${
                i === 0 ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <p className={`text-sm ${i === 0 ? "text-primary font-medium" : ""}`}>{product}</p>
              <p className="text-xs text-muted-foreground">Apple Smartphone</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OfferDetailsScreen() {
  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold">Offer Details</h1>
        <p className="text-xs text-muted-foreground">Step 3 of 4</p>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Title</label>
          <div className="px-4 py-3 rounded-xl bg-secondary text-sm">
            iPhone 15 Pro Max - 256GB
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Condition</label>
          <div className="flex gap-2">
            {["New", "Like New", "Good"].map((cond, i) => (
              <div
                key={i}
                className={`px-3 py-1.5 rounded-full text-xs ${
                  i === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {cond}
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <div className="px-4 py-3 rounded-xl bg-secondary text-sm text-muted-foreground">
            Perfect condition, always used with case...
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <Button className="w-full">Publish Offer</Button>
      </div>
    </div>
  );
}

function OfferPublishedScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-green-500/20 to-background p-6">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 animate-scaleIn">
        <Check className="h-8 w-8 text-green-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground text-center">Offer Published!</h2>
      <p className="text-sm text-muted-foreground mt-2 text-center">Your offer is now visible to others</p>
      <div className="mt-6 p-4 rounded-xl bg-card border border-border w-full">
        <p className="text-sm font-medium">iPhone 15 Pro Max - 256GB</p>
        <p className="text-xs text-muted-foreground">Like New • Electronics</p>
      </div>
    </div>
  );
}

function FindHookScreen() {
  const offers = [
    { title: "MacBook Pro 14\"", user: "Alex", match: "92%" },
    { title: "iPad Pro 12.9\"", user: "Sarah", match: "87%" },
    { title: "AirPods Max", user: "Mike", match: "78%" },
  ];

  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold">Find to Hook</h1>
        <p className="text-xs text-muted-foreground">Items you might want</p>
      </div>
      <div className="flex-1 p-3 space-y-2">
        {offers.map((offer, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{offer.title}</p>
              <p className="text-xs text-muted-foreground">by {offer.user}</p>
            </div>
            <div className="text-xs text-primary font-medium">{offer.match}</div>
          </div>
        ))}
      </div>
      <MockBottomNav activeTab="goods" />
    </div>
  );
}

function HookOfferScreen() {
  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold">Hook Offer</h1>
      </div>
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <div className="relative">
          {/* My offer */}
          <div className="p-3 rounded-xl bg-card border-2 border-primary w-48 mb-8">
            <p className="text-xs text-primary font-medium mb-1">Your Offer</p>
            <p className="text-sm font-medium">iPhone 15 Pro Max</p>
          </div>
          
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-16">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-bounce">
              <Link2 className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          
          {/* Target offer */}
          <div className="p-3 rounded-xl bg-card border-2 border-border w-48 mt-4">
            <p className="text-xs text-muted-foreground mb-1">Hook To</p>
            <p className="text-sm font-medium">MacBook Pro 14"</p>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <Button className="w-full gap-2">
          <Link2 className="h-4 w-4" />
          Create Hook
        </Button>
      </div>
    </div>
  );
}

function HookConfirmedScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-primary/20 to-background p-6">
      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-scaleIn">
        <Link2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground text-center">Hook Created!</h2>
      <p className="text-sm text-muted-foreground mt-2 text-center">Waiting for cycle detection</p>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-4 w-4 animate-spin" />
        <span>Scanning for matches...</span>
      </div>
    </div>
  );
}

function MyOffersScreen() {
  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold">My Offers</h1>
        <p className="text-xs text-muted-foreground">2 active offers</p>
      </div>
      <div className="flex-1 p-3 space-y-2">
        <div className="p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">iPhone 15 Pro Max</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">Pending</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link2 className="h-3 w-3" />
            <span>Hooked to MacBook Pro</span>
          </div>
        </div>
      </div>
      <MockBottomNav activeTab="offers" />
    </div>
  );
}

function CycleDetectedScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-green-500/10 to-background p-6">
      <div className="relative mb-6">
        {/* Animated cycle */}
        <div className="w-32 h-32 relative">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-green-500/50 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute inset-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-green-500 animate-pulse" />
          </div>
        </div>
      </div>
      <h2 className="text-xl font-bold text-green-500 text-center">Cycle Detected!</h2>
      <p className="text-sm text-muted-foreground mt-2 text-center">A 3-way trade match found</p>
      <div className="mt-4 text-xs text-center text-muted-foreground">
        <p>You → Alex → Sarah → You</p>
      </div>
    </div>
  );
}

function ReservedScreen() {
  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold">My Offers</h1>
      </div>
      <div className="flex-1 p-3">
        <div className="p-3 rounded-xl bg-card border-2 border-green-500/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">iPhone 15 Pro Max</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Reserved
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Part of a 3-way cycle</p>
          <Button size="sm" className="w-full">Confirm Pickup</Button>
        </div>
      </div>
      <MockBottomNav activeTab="offers" />
    </div>
  );
}

function PickupConfirmScreen() {
  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold">Confirm Pickup</h1>
        <p className="text-xs text-muted-foreground">Step 1 of 2</p>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Pickup Address</label>
          <div className="px-4 py-3 rounded-xl bg-secondary text-sm">
            123 Main Street, Apt 4B
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">City</label>
          <div className="px-4 py-3 rounded-xl bg-secondary text-sm">
            San Francisco, CA 94102
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Shield className="h-4 w-4 text-yellow-500 mt-0.5" />
          <p className="text-xs text-yellow-500/80">
            Address will only be shared after escrow is paid
          </p>
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <Button className="w-full">Continue to Escrow</Button>
      </div>
    </div>
  );
}

function EscrowPayScreen() {
  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold">Pay Escrow</h1>
        <p className="text-xs text-muted-foreground">Secure your trade</p>
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-2">Security Deposit</p>
          <p className="text-2xl font-bold text-foreground">$50.00</p>
          <p className="text-xs text-muted-foreground mt-1">Refundable after successful exchange</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>Protected by BARTER-X escrow</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>Full refund if trade fails</span>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <Button className="w-full">Pay $50.00</Button>
      </div>
    </div>
  );
}

function EscrowCompleteScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-green-500/20 to-background p-6">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 animate-scaleIn">
        <Shield className="h-8 w-8 text-green-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground text-center">Escrow Complete!</h2>
      <p className="text-sm text-muted-foreground mt-2 text-center">Trade is now secured</p>
      <div className="mt-4 flex items-center gap-2">
        <Unlock className="h-4 w-4 text-green-500" />
        <span className="text-xs text-green-500">Address shared with trader</span>
      </div>
    </div>
  );
}

function ChatScreen() {
  const messages = [
    { from: "them", text: "Hi! When can I pick up the iPhone?" },
    { from: "me", text: "Hey! Tomorrow afternoon works for me" },
    { from: "them", text: "Perfect! Around 3pm?" },
    { from: "me", text: "Sounds good. See you then!" },
  ];

  return (
    <div className="flex flex-col h-full">
      <StatusBar />
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">Alex</h1>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-hidden">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                msg.from === "me"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-foreground rounded-bl-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full bg-secondary text-sm"
          />
          <Button size="icon" className="rounded-full h-10 w-10">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExchangeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-primary/20 to-background p-6">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-scaleIn">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        {/* Confetti-like elements */}
        <div className="absolute -top-2 -left-2 w-3 h-3 rounded-full bg-yellow-500 animate-ping" />
        <div className="absolute -top-1 -right-3 w-2 h-2 rounded-full bg-green-500 animate-ping" style={{ animationDelay: '0.2s' }} />
        <div className="absolute -bottom-1 -left-3 w-2 h-2 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0.4s' }} />
      </div>
      <h2 className="text-xl font-bold text-primary text-center">Exchange Complete!</h2>
      <p className="text-sm text-muted-foreground mt-2 text-center">Trade successful</p>
      <div className="mt-6 p-4 rounded-xl bg-card border border-border w-full">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">You received</p>
            <p className="text-sm font-medium">MacBook Pro 14"</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">You gave</p>
            <p className="text-sm font-medium">iPhone 15 Pro</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-green-500 mt-4">Escrow refunded: $50.00</p>
    </div>
  );
}

function OutroScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-primary/20 to-background p-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground text-center">Start Trading Today</h2>
      <p className="text-sm text-muted-foreground mt-2 text-center">Join thousands of smart traders</p>
      <div className="mt-6">
        <Button className="gap-2">
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Screen renderer
function ScreenRenderer({ stepId }: { stepId: string }) {
  switch (stepId) {
    case "intro": return <IntroScreen />;
    case "browse": return <BrowseScreen />;
    case "create-offer": return <CreateOfferScreen />;
    case "select-product": return <SelectProductScreen />;
    case "offer-details": return <OfferDetailsScreen />;
    case "offer-published": return <OfferPublishedScreen />;
    case "find-hook": return <FindHookScreen />;
    case "hook-offer": return <HookOfferScreen />;
    case "hook-confirmed": return <HookConfirmedScreen />;
    case "my-offers": return <MyOffersScreen />;
    case "cycle-detected": return <CycleDetectedScreen />;
    case "reserved": return <ReservedScreen />;
    case "pickup-confirm": return <PickupConfirmScreen />;
    case "escrow-pay": return <EscrowPayScreen />;
    case "escrow-complete": return <EscrowCompleteScreen />;
    case "chat": return <ChatScreen />;
    case "exchange": return <ExchangeScreen />;
    case "outro": return <OutroScreen />;
    default: return <IntroScreen />;
  }
}

// Main component
export function AppDemoVideo() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const currentStep = DEMO_STEPS[currentStepIndex];
  const totalDuration = DEMO_STEPS.reduce((sum, step) => sum + step.duration, 0);

  // Auto-advance steps
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentStepIndex < DEMO_STEPS.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        setCurrentStepIndex(0); // Loop back
      }
    }, currentStep.duration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, isPlaying, currentStep.duration]);

  // Update progress
  useEffect(() => {
    if (!isPlaying) return;

    const startTime = Date.now();
    const stepDuration = currentStep.duration;
    const previousDuration = DEMO_STEPS.slice(0, currentStepIndex).reduce((sum, step) => sum + step.duration, 0);

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const stepProgress = Math.min(elapsed / stepDuration, 1);
      const totalProgress = (previousDuration + stepProgress * stepDuration) / totalDuration;
      setProgress(totalProgress * 100);
    };

    const interval = setInterval(updateProgress, 50);
    return () => clearInterval(interval);
  }, [currentStepIndex, isPlaying, currentStep.duration, totalDuration]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const restart = useCallback(() => {
    setCurrentStepIndex(0);
    setProgress(0);
    setIsPlaying(true);
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStepIndex(index);
    const previousDuration = DEMO_STEPS.slice(0, index).reduce((sum, step) => sum + step.duration, 0);
    setProgress((previousDuration / totalDuration) * 100);
  }, [totalDuration]);

  return (
    <div className="relative">
      {/* Phone demo */}
      <PhoneFrame>
        <div className="relative h-full">
          <ScreenRenderer stepId={currentStep.id} />
        </div>
      </PhoneFrame>

      {/* Controls */}
      <div className="mt-6 max-w-[360px] mx-auto">
        {/* Progress bar */}
        <div className="h-1 bg-secondary rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {DEMO_STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`flex-shrink-0 h-1.5 rounded-full transition-all ${
                index === currentStepIndex
                  ? "w-6 bg-primary"
                  : index < currentStepIndex
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Step info */}
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-foreground">{currentStep.title}</p>
          <p className="text-xs text-muted-foreground">{currentStep.subtitle}</p>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={restart}
            className="h-10 w-10 rounded-full"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={togglePlay}
            className="h-12 w-12 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          <div className="w-10" /> {/* Spacer for symmetry */}
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {currentStepIndex + 1} / {DEMO_STEPS.length}
        </p>
      </div>
    </div>
  );
}
