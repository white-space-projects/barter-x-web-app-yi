"use client";

import { AppDemoVideo } from "@/components/landing/app-demo-video";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <Link href="/workspace">
            <Button size="sm" className="gap-1.5">
              Try the App
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="py-12 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              See BARTER-X in Action
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to trade items without money. From creating your first offer to completing an exchange.
            </p>
          </div>

          {/* Demo */}
          <div className="flex justify-center">
            <AppDemoVideo />
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Ready to start trading?</p>
            <Link href="/workspace">
              <Button size="lg" className="gap-2">
                Launch App
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
