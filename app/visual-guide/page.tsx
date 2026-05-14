"use client";

import { Package, Home, ArrowRight, ArrowDown, Check, MessageCircle, MapPin, Link2, Users, RefreshCw, Sparkles, Laptop, Bike, Camera, Guitar } from "lucide-react";

export default function VisualGuidePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-foreground">
            BARTER-<span className="text-primary">X</span>
          </a>
          <a 
            href="/app" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-20">
        
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">How Barter-X Works</h1>
          <p className="text-muted-foreground text-lg">Trade what you have for what you want - no money needed</p>
        </div>

        {/* ===== SECTION 1: Start with what you have ===== */}
        <section className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Start With What You Have</h2>
          <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
            List an item you own or a space you can rent out
          </p>
          
          {/* Two starting options: Item OR Home */}
          <div className="flex items-center gap-12 md:gap-20">
            {/* Goods - Item you own */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-card border-2 border-border flex items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                <Package className="w-14 h-14 md:w-16 md:h-16 text-primary" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent" />
              </div>
              <span className="mt-4 text-sm font-medium text-foreground">Goods</span>
              <span className="text-xs text-muted-foreground">Items you own</span>
            </div>

            {/* OR visual divider */}
            <div className="relative h-28 md:h-36 flex items-center">
              <div className="w-px h-full bg-gradient-to-b from-transparent via-border to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">OR</span>
              </div>
            </div>

            {/* Rentals - Place you have */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-card border-2 border-border flex items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                <Home className="w-14 h-14 md:w-16 md:h-16 text-primary" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent" />
              </div>
              <span className="mt-4 text-sm font-medium text-foreground">Rentals</span>
              <span className="text-xs text-muted-foreground">Spaces to share</span>
            </div>
          </div>
        </section>

        {/* Flow Arrow */}
        <FlowArrow />

        {/* ===== SECTION 2: Create Offer ===== */}
        <section className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Create Your Offer</h2>
          <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
            Add photos, description, and condition of what you&apos;re offering
          </p>
          
          {/* Offer Card with plus */}
          <div className="relative">
            <div className="w-48 h-56 rounded-xl bg-card border-2 border-primary flex flex-col items-center justify-center gap-4">
              {/* Image placeholder */}
              <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center">
                <Package className="w-10 h-10 text-muted-foreground/50" />
              </div>
              {/* Title placeholder lines */}
              <div className="space-y-2 w-full px-4">
                <div className="w-full h-2.5 rounded-full bg-secondary" />
                <div className="w-2/3 h-2 rounded-full bg-secondary/60 mx-auto" />
              </div>
              {/* Add indicator */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </div>
            {/* Glow */}
            <div className="absolute inset-0 rounded-xl bg-primary/15 blur-2xl -z-10" />
          </div>
        </section>

        {/* Flow Arrow */}
        <FlowArrow />

        {/* ===== SECTION 3: Hook up to 3 offers ===== */}
        <section className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Hook What You Want</h2>
          <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
            Browse offers and hook up to 3 items you&apos;d like to trade for
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Your Offer */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-40 rounded-xl bg-card border-2 border-primary flex flex-col items-center justify-center gap-3 flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="w-10 h-1.5 rounded-full bg-secondary" />
              </div>
              <span className="mt-2 text-xs text-muted-foreground">Your Offer</span>
            </div>

            {/* Hook Lines - Desktop */}
            <div className="hidden md:flex flex-col items-center">
              <Link2 className="w-10 h-10 text-primary" style={{ transform: 'rotate(45deg)' }} />
              <span className="text-xs text-muted-foreground mt-1">Hook</span>
            </div>

            {/* Hook Icon - Mobile */}
            <div className="md:hidden flex flex-col items-center">
              <Link2 className="w-10 h-10 text-primary rotate-90" />
              <span className="text-xs text-muted-foreground mt-1">Hook</span>
            </div>

            {/* 3 Hooked Offers */}
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className="w-36 h-14 rounded-lg bg-card border border-border flex items-center gap-3 px-3"
                  style={{ opacity: 1 - (i - 1) * 0.2 }}
                >
                  <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-secondary" />
                    <div className="w-2/3 h-1.5 rounded-full bg-secondary/60" />
                  </div>
                </div>
              ))}
              <span className="text-xs text-muted-foreground text-center">Up to 3 hooks</span>
            </div>
          </div>
        </section>

        {/* Flow Arrow */}
        <FlowArrow />

        {/* ===== SECTION 4: Loop Forms ===== */}
        <section className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">A Trade Loop Forms</h2>
          <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
            When hooks connect in a circle, everyone gets what they want
          </p>
          
          {/* Loop Visualization - Each person with HAS and WANTS */}
          <div className="relative w-full max-w-2xl">
            {/* The Loop - Shows 4 people and their items */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Person 1: Has Laptop, Wants Cycle */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-card border-2 border-primary flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="currentColor">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border w-full">
                  <Laptop className="w-8 h-8 text-primary" />
                  <span className="text-[10px] text-muted-foreground">HAS</span>
                </div>
                <div className="my-1.5 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-primary/10 border border-primary/30 w-full">
                  <Bike className="w-8 h-8 text-primary" />
                  <span className="text-[10px] text-primary">WANTS</span>
                </div>
              </div>

              {/* Person 2: Has Cycle, Wants Camera */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-card border-2 border-primary flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="currentColor">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border w-full">
                  <Bike className="w-8 h-8 text-primary" />
                  <span className="text-[10px] text-muted-foreground">HAS</span>
                </div>
                <div className="my-1.5 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-primary/10 border border-primary/30 w-full">
                  <Camera className="w-8 h-8 text-primary" />
                  <span className="text-[10px] text-primary">WANTS</span>
                </div>
              </div>

              {/* Person 3: Has Camera, Wants Guitar */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-card border-2 border-primary flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="currentColor">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border w-full">
                  <Camera className="w-8 h-8 text-primary" />
                  <span className="text-[10px] text-muted-foreground">HAS</span>
                </div>
                <div className="my-1.5 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-primary/10 border border-primary/30 w-full">
                  <Guitar className="w-8 h-8 text-primary" />
                  <span className="text-[10px] text-primary">WANTS</span>
                </div>
              </div>

              {/* Person 4: Has Guitar, Wants Laptop */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-card border-2 border-primary flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="currentColor">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border w-full">
                  <Guitar className="w-8 h-8 text-primary" />
                  <span className="text-[10px] text-muted-foreground">HAS</span>
                </div>
                <div className="my-1.5 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-primary/10 border border-primary/30 w-full">
                  <Laptop className="w-8 h-8 text-primary" />
                  <span className="text-[10px] text-primary">WANTS</span>
                </div>
              </div>
            </div>

            {/* Loop Connection Arrows */}
            <div className="flex items-center justify-center mt-6 gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
                <RefreshCw className="w-4 h-4 text-success" />
                <span className="text-xs text-success font-medium">Loop Complete</span>
              </div>
            </div>

            {/* Flow explanation - simplified visual */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Laptop className="w-4 h-4 text-primary" />
                <ArrowRight className="w-3 h-3" />
                <Bike className="w-4 h-4 text-primary" />
                <ArrowRight className="w-3 h-3" />
                <Camera className="w-4 h-4 text-primary" />
                <ArrowRight className="w-3 h-3" />
                <Guitar className="w-4 h-4 text-primary" />
                <ArrowRight className="w-3 h-3" />
                <Laptop className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </section>

        {/* Flow Arrow */}
        <FlowArrow />

        {/* ===== SECTION 5: Everyone Confirms ===== */}
        <section className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Everyone Confirms</h2>
          <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
            All participants review and confirm the trade to proceed
          </p>
          
          <div className="flex items-center gap-3 md:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-success/20 border-2 border-success flex items-center justify-center"
              >
                <Check className="w-5 h-5 md:w-6 md:h-6 text-success" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">All 5 participants confirmed</p>
        </section>

        {/* Flow Arrow */}
        <FlowArrow />

        {/* ===== SECTION 6: Chat & Pickup Unlock ===== */}
        <section className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Chat & Exchange</h2>
          <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
            Contact details unlock so you can arrange pickup
          </p>
          
          <div className="flex items-center gap-8 md:gap-12">
            {/* Chat Unlocked */}
            <div className="relative group flex flex-col items-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-card border-2 border-success/50 flex items-center justify-center transition-colors group-hover:border-success">
                <MessageCircle className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
              {/* Unlocked badge */}
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-success flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 text-success-foreground" />
              </div>
              <span className="text-xs text-muted-foreground mt-3">Chat Unlocked</span>
            </div>

            {/* Connector */}
            <div className="w-8 h-0.5 bg-gradient-to-r from-success/50 to-success/50 hidden md:block" />

            {/* Pickup/Location Unlocked */}
            <div className="relative group flex flex-col items-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-card border-2 border-success/50 flex items-center justify-center transition-colors group-hover:border-success">
                <MapPin className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
              {/* Unlocked badge */}
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-success flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 text-success-foreground" />
              </div>
              <span className="text-xs text-muted-foreground mt-3">Location Shared</span>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4 py-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs font-medium text-muted-foreground px-3">KEY CONCEPTS</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-transparent" />
        </div>

        {/* ===== SECTION 7: What is a Hook? ===== */}
        <section className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">What is a Hook?</h2>
          <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
            A hook means &quot;I want that&quot; - you give yours, they give theirs
          </p>
          
          {/* Hook visualization: Give -> Get */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* My Offer - I give */}
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-24 md:w-24 md:h-28 rounded-xl bg-card border-2 border-primary flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="w-8 h-1.5 rounded-full bg-secondary" />
              </div>
              {/* Give indicator */}
              <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-6 h-6 rounded-full bg-destructive/30 border border-destructive/50 flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-destructive" />
              </div>
              <span className="text-xs text-muted-foreground mt-2">You Give</span>
            </div>

            {/* Hook Symbol */}
            <div className="flex flex-col items-center py-4">
              <Link2 className="w-12 h-12 md:w-14 md:h-14 text-primary" style={{ transform: 'rotate(45deg)' }} />
            </div>

            {/* Their Offer - I get */}
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-24 md:w-24 md:h-28 rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div className="w-8 h-1.5 rounded-full bg-secondary" />
              </div>
              {/* Get indicator */}
              <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-6 h-6 rounded-full bg-success/30 border border-success/50 flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-success rotate-180" />
              </div>
              <span className="text-xs text-muted-foreground mt-2">You Get</span>
            </div>
          </div>

          {/* Up to 3 hooks note */}
          <div className="flex items-center gap-3 mt-8 px-4 py-3 bg-card/50 rounded-lg border border-border">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className="w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center"
                >
                  <Link2 className="w-3 h-3 text-primary" style={{ transform: 'rotate(45deg)' }} />
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">You can hook up to 3 offers</span>
          </div>
        </section>

        {/* ===== SECTION 8: What is a Loop? ===== */}
        <section className="flex flex-col items-center mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">What is a Loop?</h2>
          <p className="text-muted-foreground text-sm mb-8 text-center max-w-md">
            A loop is when hooks connect in a circle - everyone trades at once
          </p>
          
          {/* Chain: A -> B -> C -> back to A */}
          <div className="flex flex-col items-center">
            {/* Linear chain */}
            <div className="flex items-center gap-2">
              <UserNode label="A" />
              <ChainArrow />
              <UserNode label="B" />
              <ChainArrow />
              <UserNode label="C" />
            </div>

            {/* Loop back visual */}
            <svg width="220" height="50" className="text-primary mt-1">
              <path 
                d="M200,5 Q215,25 200,45 L20,45 Q5,25 20,5" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeDasharray="8 4"
              />
              <polygon points="20,5 12,13 28,13" fill="currentColor" />
            </svg>

            {/* Everyone gets something */}
            <div className="flex items-center gap-6 mt-6">
              {["A", "B", "C"].map((label) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <span className="text-xs text-muted-foreground">{label} gets item</span>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
              Everyone in the loop receives what they hooked
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="flex flex-col items-center pt-8 pb-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">Ready to Trade?</h2>
          <p className="text-muted-foreground text-sm mb-6 text-center">
            Create your first offer and start bartering
          </p>
          <a 
            href="/app"
            className="group flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/20"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </section>
      </main>
    </div>
  );
}

/* Flow arrow component */
function FlowArrow() {
  return (
    <div className="flex justify-center">
      <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center">
        <ArrowDown className="w-5 h-5 text-primary" />
      </div>
    </div>
  );
}

/* User node for chain */
function UserNode({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-full bg-card border-2 border-border flex items-center justify-center">
        <Users className="w-6 h-6 text-muted-foreground" />
      </div>
      <span className="text-xs font-medium text-foreground mt-1">{label}</span>
    </div>
  );
}

/* Chain arrow */
function ChainArrow() {
  return <ArrowRight className="w-6 h-6 text-primary mx-1" />;
}
