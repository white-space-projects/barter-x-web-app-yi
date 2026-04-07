"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Car,
  Home,
  Package,
  MessageSquare,
  FlaskConical,
  Plus,
  MoreHorizontal,
  X,
  User,
  Building2,
  Briefcase,
} from "lucide-react";
import type { ProductType } from "@/lib/types";

type Props = {
  activeProductType: ProductType;
  activeUtilityTab: string | null;
  onSelectProductType: (type: ProductType) => void;
  onSelectUtilityTab: (tab: string | null) => void;
  onAddOffer: () => void;
  isAdmin: boolean;
  unreadCount?: number;
};

export function BottomNav({
  activeProductType,
  activeUtilityTab,
  onSelectProductType,
  onSelectUtilityTab,
  onAddOffer,
  isAdmin,
  unreadCount = 0,
}: Props) {
  const [showMore, setShowMore] = useState(false);

  // Primary nav items (always visible) - only active types
  const primaryItems = [
    {
      id: "goods" as ProductType,
      label: "Goods",
      icon: ShoppingBag,
      type: "product-type" as const,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    // Coming soon - show in nav but disabled
    {
      id: "rentals" as ProductType,
      label: "Rentals",
      icon: Building2,
      type: "product-type" as const,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      isComingSoon: true,
    },
    {
      id: "mini-jobs" as ProductType,
      label: "Jobs",
      icon: Briefcase,
      type: "product-type" as const,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      isComingSoon: true,
    },
  ];

  // Secondary items (in more menu) - includes profile as utility tab
  // Note: Ownership is hidden from UI
  const secondaryItems = [
    {
      id: "my-offers",
      label: "My Offers",
      icon: Package,
      type: "utility" as const,
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      type: "utility" as const,
      badge: unreadCount,
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      type: "utility" as const,
    },
    // Admin tab removed - product image management moved to Back Office
    ...(isAdmin
      ? [
          {
            id: "simulate",
            label: "Simulate",
            icon: FlaskConical,
            type: "utility" as const,
          },
        ]
      : []),
  ];

  const isProductTypeActive = (type: ProductType) => {
    return !activeUtilityTab && activeProductType === type;
  };

  const isUtilityActive = (id: string) => {
    return activeUtilityTab === id;
  };

  const handleProductTypeClick = (type: ProductType) => {
    onSelectProductType(type);
    onSelectUtilityTab(null);
    setShowMore(false);
  };

  const handleUtilityClick = (id: string) => {
    onSelectUtilityTab(id);
    setShowMore(false);
  };

  // Check if any secondary item is active
  const isMoreActive = secondaryItems.some((item) => isUtilityActive(item.id));

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu panel */}
      {showMore && (
        <div className="fixed bottom-[72px] left-0 right-0 z-50 mx-4 mb-2 rounded-2xl border border-border bg-card shadow-xl lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium text-foreground">More Options</span>
            <button
              onClick={() => setShowMore(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const active = item.type === "utility" ? isUtilityActive(item.id) : isProductTypeActive(item.id as ProductType);
              const isComingSoon = "isComingSoon" in item && item.isComingSoon;
              const itemColor = "color" in item ? item.color : undefined;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isComingSoon) return;
                    if (item.type === "product-type") {
                      handleProductTypeClick(item.id as ProductType);
                    } else {
                      handleUtilityClick(item.id);
                    }
                  }}
                  disabled={isComingSoon}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                    isComingSoon
                      ? "opacity-60 cursor-not-allowed"
                      : active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active && itemColor ? itemColor : ""}`} />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {isComingSoon && (
                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      Coming Soon
                    </span>
                  )}
                  {"badge" in item && item.badge && item.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
            
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Product type tabs */}
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isProductTypeActive(item.id);
            const isComingSoon = "isComingSoon" in item && item.isComingSoon;
            return (
              <button
                key={item.id}
                onClick={() => !isComingSoon && handleProductTypeClick(item.id)}
                disabled={isComingSoon}
                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[60px] ${
                  isComingSoon ? "opacity-60" : active ? item.bgColor : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active && !isComingSoon ? item.color : "text-muted-foreground"}`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    active && !isComingSoon ? item.color : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
                {isComingSoon && (
                  <span className="absolute -top-0.5 -right-0.5 text-[7px] uppercase tracking-wide px-1 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                    Soon
                  </span>
                )}
              </button>
            );
          })}

          {/* Center Add button */}
          <button
            onClick={onAddOffer}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[60px] ${
              isMoreActive || showMore ? "bg-secondary/80" : ""
            }`}
          >
            <MoreHorizontal
              className={`h-5 w-5 ${
                isMoreActive || showMore ? "text-foreground" : "text-muted-foreground"
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                isMoreActive || showMore ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              More
            </span>
            {/* Badge for unread messages */}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
