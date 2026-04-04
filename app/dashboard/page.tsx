"use client";

import { GlobalNav } from "@/components/global-nav";
import { useBarterStore } from "@/lib/store";
import {
  Users,
  Tag,
  Link2,
  RotateCcw,
  CheckCircle2,
  Package,
} from "lucide-react";

const METRIC_ICONS = {
  totalUsers: Users,
  activeOffers: Tag,
  activeHooks: Link2,
  reservedCycles: RotateCcw,
  committedOffers: CheckCircle2,
  totalProducts: Package,
};

const METRIC_LABELS: Record<string, string> = {
  totalUsers: "Registered Users",
  activeOffers: "Active Offers",
  activeHooks: "Active Hooks",
  reservedCycles: "Reserved Cycles",
  committedOffers: "Committed Offers",
  totalProducts: "Total Products",
};

export default function DashboardPage() {
  const { dashboardStats } = useBarterStore();

  const metrics = Object.entries(dashboardStats).map(([key, value]) => ({
    key,
    value,
    label: METRIC_LABELS[key] || key,
    Icon: METRIC_ICONS[key as keyof typeof METRIC_ICONS],
  }));

  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl text-balance">
            Platform Dashboard
          </h1>
          <p className="mt-2 text-base text-muted-foreground lg:text-lg text-pretty">
            Live metrics across the Barter-X exchange network.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(({ key, value, label, Icon }) => (
            <div
              key={key}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {label}
                </span>
                {Icon && (
                  <Icon className="h-4.5 w-4.5 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                )}
              </div>
              <p className="mt-3 text-4xl font-bold tracking-tight text-foreground">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            How does Barter-X work?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed text-pretty">
            Barter-X is a marketplace where people exchange used products
            without money. You add an offer, hook what you want, and the trade
            engine forms cycles that connect everyone{"'"}s wants. No currency involved
            -- just fair exchanges.
          </p>
          <a
            href="/how-it-works"
            className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Learn more about the process
            <svg
              className="ml-1.5 h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </a>
        </div>
      </main>
    </div>
  );
}
