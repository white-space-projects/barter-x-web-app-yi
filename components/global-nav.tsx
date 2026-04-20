"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, MapPin } from "lucide-react";
import { useBarterStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

// Global navigation component for the app

const PUBLIC_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/feedback", label: "Feedback & questions" },
];

export function GlobalNav() {
  const { auth } = useBarterStore();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // User location from profile (City, Country)
  const userLocation = useMemo(() => {
    const city = auth.user?.profileAddress?.city || auth.user?.city || "";
    const country = auth.user?.profileAddress?.country || auth.user?.country || "";
    if (city && country) {
      return `${city}, ${country}`;
    }
    return city || country || "";
  }, [auth.user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      {/* 
        Navbar positioning:
        - Brand name is positioned to align with center of expanded sidebar (w-56 = 224px, center = 112px)
        - Left padding on desktop: pl-[76px] positions brand at ~112px from left (center of 224px sidebar)
        - Right padding matches for symmetry
        - This stays fixed regardless of sidebar collapse state or page
      */}
      <div className="flex h-14 items-center justify-between px-4 lg:pl-[76px] lg:pr-6">
        {/* Left: Wordmark - Brand name in primary yellow, centered above expanded sidebar */}
        <Link
          href="/"
          className="flex items-center text-lg font-bold tracking-tight flex-shrink-0"
        >
          <span className="text-primary">BARTER-X</span>
        </Link>

        {/* Center: Desktop nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          {auth.isAuthenticated && (
            <Link
              href="/workspace"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/workspace")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              App
            </Link>
          )}
        </nav>

        {/* Right: Auth area - shows user location (City, Country) when logged in */}
        <div className="hidden items-center gap-3 md:flex">
          {auth.isAuthenticated ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {userLocation || "Set location"}
            </span>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {auth.isAuthenticated && (
              <Link
                href="/workspace"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  pathname.startsWith("/workspace")
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                App
              </Link>
            )}
          </nav>
          <div className="mt-3 border-t border-border pt-3">
            {auth.isAuthenticated ? (
              <span className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {userLocation || "Set location"}
              </span>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
