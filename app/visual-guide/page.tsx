"use client";

import { Package, Home, ArrowRight, ArrowDown, Check, MessageCircle, MapPin, Link2, Users, RefreshCw, Sparkles } from "lucide-react";

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
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-24">
        
        {/* ===== SECTION 1: Start with what you have ===== */}
        <section className="flex flex-col items-center">
          {/* Two starting options: Item OR Home */}
          <div className="flex items-center gap-12 md:gap-20">
            {/* Goods - Item you own */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-card border-2 border-border flex items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                <Package className="w-14 h-14 md:w-18 md:h-18 text-primary" />
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent" />
              </div>
              {/* Goods indicator */}
              <div className="mt-4 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-muted-foreground" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
            </div>

            {/* OR visual divider */}
            <div className="relative h-28 md:h-36 flex items-center">
              <div className="w-px h-full bg-gradient-to-b from-transparent via-border to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Rentals - Place you have */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-card border-2 border-border flex items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors">
                <Home className="w-14 h-14 md:w-18 md:h-18 text-primary" />
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent" />
              </div>
              {/* Rentals indicator */}
              <div className="mt-4 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-muted-foreground" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
            </div>
          </div>
        </section>

        {/* Flow Arrow */}
        <FlowArrow />

        {/* ===== SECTION 2: Create Offer ===== */}
        <section className="flex flex-col items-center">
          {/* Offer Card with plus */}
          <div className="relative">
            <div className="w-48 h-56 rounded-xl bg-card border-2 border-primary flex flex-col items-center justify-center gap-4 card-shadow-primary">
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
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Your Offer */}
            <div className="w-32 h-40 rounded-xl bg-card border-2 border-primary flex flex-col items-center justify-center gap-3 flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="w-10 h-1.5 rounded-full bg-secondary" />
            </div>

            {/* Hook Lines - Desktop */}
            <div className="hidden md:block">
              <svg width="100" height="140" className="text-primary">
                {/* Top hook */}
                <path d="M0,70 C30,70 50,20 90,20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
                <circle cx="95" cy="20" r="6" fill="currentColor" />
                {/* Middle hook */}
                <path d="M0,70 L90,70" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
                <circle cx="95" cy="70" r="6" fill="currentColor" />
                {/* Bottom hook */}
                <path d="M0,70 C30,70 50,120 90,120" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
                <circle cx="95" cy="120" r="6" fill="currentColor" />
              </svg>
            </div>

            {/* Hook Icon - Mobile */}
            <div className="md:hidden">
              <Link2 className="w-10 h-10 text-primary rotate-90" />
            </div>

            {/* 3 Hooked Offers */}
            <div className="flex flex-col gap-3">
              {[0.95, 0.75, 0.55].map((opacity, i) => (
                <div 
                  key={i}
                  className="w-36 h-14 rounded-lg bg-card border border-border flex items-center gap-3 px-3"
                  style={{ opacity }}
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
            </div>
          </div>

          {/* 3 dots indicator */}
          <div className="flex items-center gap-2 mt-8">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-3 h-3 rounded-full bg-primary" />
          </div>
        </section>

        {/* Flow Arrow */}
        <FlowArrow />

        {/* ===== SECTION 4: Loop Forms ===== */}
        <section className="flex flex-col items-center">
          {/* Circular Loop Visualization */}
          <div className="relative w-72 h-72 md:w-80 md:h-80">
            {/* Central Loop Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center z-10">
              <RefreshCw className="w-8 h-8 text-primary" />
            </div>

            {/* Circular Dashed Path */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
              <circle 
                cx="100" 
                cy="100" 
                r="75" 
                fill="none" 
                stroke="hsl(45 65% 47% / 0.4)" 
                strokeWidth="2"
                strokeDasharray="10 6"
              />
              {/* Direction arrows on circle */}
              <g>
                <polygon points="175,100 167,94 167,106" fill="hsl(45 65% 47%)" />
                <polygon points="100,25 94,33 106,33" fill="hsl(45 65% 47%)" />
                <polygon points="25,100 33,106 33,94" fill="hsl(45 65% 47%)" />
                <polygon points="100,175 106,167 94,167" fill="hsl(45 65% 47%)" />
              </g>
            </svg>

            {/* Users/Offers around the loop */}
            {[
              { angle: -90, Icon: Package },
              { angle: -18, Icon: Home },
              { angle: 54, Icon: Package },
              { angle: 126, Icon: Home },
              { angle: 198, Icon: Package },
            ].map(({ angle, Icon }, i) => {
              const radians = angle * (Math.PI / 180);
              const x = 50 + 40 * Math.cos(radians);
              const y = 50 + 40 * Math.sin(radians);
              return (
                <div
                  key={i}
                  className="absolute w-12 h-12 md:w-14 md:h-14 rounded-full bg-card border-2 border-primary flex items-center justify-center shadow-lg"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Flow Arrow */}
        <FlowArrow />

        {/* ===== SECTION 5: Everyone Confirms ===== */}
        <section className="flex flex-col items-center">
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
        </section>

        {/* Flow Arrow */}
        <FlowArrow />

        {/* ===== SECTION 6: Chat & Pickup Unlock ===== */}
        <section className="flex flex-col items-center">
          <div className="flex items-center gap-8 md:gap-12">
            {/* Chat Unlocked */}
            <div className="relative group">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-card border-2 border-success/50 flex items-center justify-center transition-colors group-hover:border-success">
                <MessageCircle className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
              {/* Unlocked badge */}
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-success flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 text-success-foreground" />
              </div>
            </div>

            {/* Connector */}
            <div className="w-8 h-0.5 bg-gradient-to-r from-success/50 to-success/50 hidden md:block" />

            {/* Pickup/Location Unlocked */}
            <div className="relative group">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-card border-2 border-success/50 flex items-center justify-center transition-colors group-hover:border-success">
                <MapPin className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
              {/* Unlocked badge */}
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-success flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 text-success-foreground" />
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4 py-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* ===== SECTION 7: What is a Hook? ===== */}
        <section className="flex flex-col items-center">
          {/* Hook visualization: Give -> Get */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* My Offer - I give */}
            <div className="relative">
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
            </div>

            {/* Hook Symbol */}
            <div className="flex flex-col items-center py-4">
              <Link2 className="w-12 h-12 md:w-14 md:h-14 text-primary" style={{ transform: 'rotate(45deg)' }} />
            </div>

            {/* Their Offer - I get */}
            <div className="relative">
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
            </div>
          </div>

          {/* Up to 3 hooks */}
          <div className="flex items-center gap-2 mt-10">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="w-10 h-10 rounded-full bg-card border-2 border-primary flex items-center justify-center"
              >
                <Link2 className="w-4 h-4 text-primary" style={{ transform: 'rotate(45deg)' }} />
              </div>
            ))}
          </div>
        </section>

        {/* ===== SECTION 8: What is a Loop? ===== */}
        <section className="flex flex-col items-center mt-16">
          {/* Chain: A -> B -> C -> back to A */}
          <div className="flex flex-col items-center">
            {/* Linear chain */}
            <div className="flex items-center gap-2">
              <UserNode />
              <ChainArrow />
              <UserNode />
              <ChainArrow />
              <UserNode />
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
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <Package className="w-5 h-5 text-primary" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="flex flex-col items-center pt-8 pb-12">
          <a 
            href="/app"
            className="group flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/20"
          >
            <Package className="w-7 h-7" />
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
function UserNode() {
  return (
    <div className="w-14 h-14 rounded-full bg-card border-2 border-border flex items-center justify-center">
      <Users className="w-6 h-6 text-muted-foreground" />
    </div>
  );
}

/* Chain arrow */
function ChainArrow() {
  return <ArrowRight className="w-6 h-6 text-primary mx-1" />;
}
