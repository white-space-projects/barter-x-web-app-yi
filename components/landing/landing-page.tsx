"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Package, Link2, RotateCcw, Shield, Sparkles, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, hasStarted]);

  return { count, start: () => setHasStarted(true) };
}

// Intersection observer hook
function useInView(threshold = 0.1) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return { ref: setRef, isInView };
}

// Stats counter component
function StatCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const { ref, isInView } = useInView(0.3);
  const { count, start } = useAnimatedCounter(value, 2000);

  useEffect(() => {
    if (isInView) start();
  }, [isInView, start]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// Feature card component
function FeatureCard({ icon: Icon, title, description, index }: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  index: number;
}) {
  return (
    <div 
      className="group relative p-6 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// Step card component
function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
          {number}
        </div>
        {number < 4 && <div className="w-px h-full bg-border mt-2" />}
      </div>
      <div className="pb-8">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Banner */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="mx-auto max-w-7xl px-4 py-2.5 text-center">
          <p className="text-sm text-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Coming Soon</span>
              <span className="text-muted-foreground mx-1.5">|</span>
              <span className="text-muted-foreground">Join the waitlist for early access</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary ml-1" />
            </span>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-black text-primary-foreground">X</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">BARTER-X</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How it Works
              </Link>
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
              <Link href="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Chat
              </Link>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/backoffice" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Back Office
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/workspace">
                <Button size="sm" className="gap-1.5">
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-4 space-y-3">
              <Link 
                href="#how-it-works" 
                className="block text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link 
                href="#features" 
                className="block text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#faq" 
                className="block text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link 
                href="/chat" 
                className="block text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Chat
              </Link>
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex gap-3">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/workspace" className="flex-1">
                    <Button size="sm" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
                <Link 
                  href="/backoffice" 
                  className="block text-center text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Back Office
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 lg:px-6 lg:pt-24 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">The Future of Exchange</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance leading-tight">
              Trade What You Have.
              <br />
              <span className="text-primary">Get What You Want.</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
              BARTER-X is the world&apos;s first smart exchange platform. No money needed. 
              Create offers, connect with others, and let our engine find perfect multi-party trades.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/workspace">
                <Button size="lg" className="gap-2 text-base px-8 h-12">
                  Start Trading Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="text-base px-8 h-12">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                <span>Escrow Protected</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span>Smart Cycle Matching</span>
              </div>
            </div>
          </div>

          {/* Hero Visual - Cycle Animation */}
          <div className="mt-16 lg:mt-20 relative">
            <div className="aspect-video max-w-4xl mx-auto rounded-2xl border border-border bg-card/50 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Simplified cycle visualization */}
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  {/* Center hub */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                      <RotateCcw className="h-7 w-7 text-primary animate-spin" style={{ animationDuration: "8s" }} />
                    </div>
                  </div>
                  
                  {/* Orbiting nodes */}
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="absolute inset-0 animate-spin"
                      style={{ 
                        animationDuration: "12s",
                        animationDelay: `${i * -3}s`
                      }}
                    >
                      <div 
                        className="absolute h-12 w-12 rounded-xl bg-card border border-border shadow-lg flex items-center justify-center"
                        style={{ 
                          top: "50%", 
                          left: "50%",
                          transform: `translate(-50%, -50%) translateY(-${110}px) rotate(${-i * 90}deg)`
                        }}
                      >
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}

                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
                    <circle 
                      cx="160" 
                      cy="160" 
                      r="110" 
                      fill="none" 
                      stroke="hsl(var(--border))" 
                      strokeWidth="1"
                      strokeDasharray="8 4"
                      className="animate-spin"
                      style={{ 
                        transformOrigin: "center",
                        animationDuration: "20s",
                        animationDirection: "reverse"
                      }}
                    />
                  </svg>
                </div>
              </div>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={10000} label="Users Waiting" suffix="+" />
            <StatCounter value={50000} label="Potential Offers" suffix="+" />
            <StatCounter value={0} label="Money Required" suffix="" />
            <StatCounter value={100} label="Satisfaction Rate" suffix="%" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight text-balance">
              Exchange in 4 Simple Steps
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              No haggling. No cash. Just smart, fair exchanges powered by our cycle detection engine.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Steps */}
            <div className="space-y-0">
              <StepCard 
                number={1} 
                title="Create Your Offer" 
                description="List what you have and what you're looking for. Add photos, set your location, and describe the condition."
              />
              <StepCard 
                number={2} 
                title="Hook What You Want" 
                description="Browse available offers and 'hook' items you want. This signals your interest and creates potential trade paths."
              />
              <StepCard 
                number={3} 
                title="Cycle Detection" 
                description="Our smart engine finds multi-party cycles where everyone gets what they want simultaneously. A→B→C→A, and beyond."
              />
              <StepCard 
                number={4} 
                title="Secure Exchange" 
                description="Confirm readiness, pay a small escrow deposit for commitment, then complete your pickup. Everyone wins."
              />
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-8">
                <div className="aspect-square relative">
                  {/* Cycle visualization */}
                  <svg viewBox="0 0 400 400" className="w-full h-full">
                    {/* Background circle */}
                    <circle cx="200" cy="200" r="150" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
                    
                    {/* Animated path */}
                    <circle 
                      cx="200" 
                      cy="200" 
                      r="150" 
                      fill="none" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="3"
                      strokeDasharray="150 800"
                      strokeLinecap="round"
                      className="animate-spin"
                      style={{ transformOrigin: "center", animationDuration: "4s" }}
                    />

                    {/* Nodes */}
                    {[0, 120, 240].map((angle, i) => {
                      const rad = (angle - 90) * (Math.PI / 180);
                      const x = 200 + 150 * Math.cos(rad);
                      const y = 200 + 150 * Math.sin(rad);
                      const labels = ["Alice", "Bob", "Carol"];
                      const items = ["Camera", "Laptop", "Phone"];
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="35" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
                          <text x={x} y={y - 8} textAnchor="middle" className="fill-foreground text-xs font-semibold">{labels[i]}</text>
                          <text x={x} y={y + 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">{items[i]}</text>
                        </g>
                      );
                    })}

                    {/* Center */}
                    <circle cx="200" cy="200" r="40" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth="2" />
                    <text x="200" y="196" textAnchor="middle" className="fill-primary text-[10px] font-medium">CYCLE</text>
                    <text x="200" y="210" textAnchor="middle" className="fill-primary text-[10px] font-medium">FOUND</text>
                  </svg>
                </div>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Alice wants Bob&apos;s laptop. Bob wants Carol&apos;s phone. Carol wants Alice&apos;s camera. 
                  <span className="text-primary font-medium"> Everyone trades. Everyone wins.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary mb-2">FEATURES</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight text-balance">
              Built for Trust & Simplicity
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Everything you need for safe, seamless exchanges without money.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Link2}
              title="Smart Hooking"
              description="Express interest in items by 'hooking' them. Our system tracks all connections to find perfect matches."
              index={0}
            />
            <FeatureCard 
              icon={RotateCcw}
              title="Cycle Detection"
              description="Advanced algorithms find multi-party exchange cycles. Not just 2-way trades - chains of any length."
              index={1}
            />
            <FeatureCard 
              icon={Shield}
              title="Escrow Protection"
              description="Small refundable deposits ensure commitment. Both parties are protected throughout the exchange."
              index={2}
            />
            <FeatureCard 
              icon={Package}
              title="Verified Listings"
              description="Every offer is reviewed. Photos required. Clear descriptions. Know exactly what you're getting."
              index={3}
            />
            <FeatureCard 
              icon={Sparkles}
              title="Real-Time Matching"
              description="As new offers are added, our engine continuously searches for cycle opportunities."
              index={4}
            />
            <FeatureCard 
              icon={ArrowRight}
              title="Guided Exchanges"
              description="Step-by-step flow from offer creation to successful pickup. We guide you through every step."
              index={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="relative rounded-3xl border border-border bg-card overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
            
            <div className="relative px-6 py-16 md:px-12 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight text-balance">
                Ready to Start Trading?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                Join thousands of people already exchanging items without money. 
                Your first trade is just a few clicks away.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/workspace">
                  <Button size="lg" className="gap-2 text-base px-8 h-12">
                    Launch App
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28 bg-card/30">
        <div className="mx-auto max-w-3xl px-4 lg:px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary mb-2">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Common Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How is this different from regular selling?",
                a: "You don't need money. Instead of selling an item and using that money to buy another, BARTER-X finds direct exchange paths. You trade what you have for what you want, even through multi-party cycles."
              },
              {
                q: "What if nobody wants my item?",
                a: "Our cycle detection goes beyond 2-way trades. Even if no one directly wants your item, someone in a chain might. We find paths like A→B→C→D→A where everyone gets what they want."
              },
              {
                q: "How does the escrow work?",
                a: "When a cycle is found, all participants pay a small refundable deposit. This ensures commitment. After successful exchanges, deposits are returned. If someone fails to complete, they forfeit their deposit."
              },
              {
                q: "What can I trade?",
                a: "Electronics, collectibles, home goods, sports equipment, books, and more. We focus on items that can be safely exchanged at a pickup location."
              },
              {
                q: "Is it safe?",
                a: "Yes. All users are verified. Escrow protects both parties. Exchanges happen at agreed public locations. Our rating system helps identify trustworthy traders."
              }
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-5 text-left">
                  <span className="font-medium text-foreground">{faq.q}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-base font-black text-primary-foreground">X</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">BARTER-X</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/workspace" className="hover:text-foreground transition-colors">
                App
              </Link>
              <Link href="/how-it-works" className="hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} BARTER-X. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
