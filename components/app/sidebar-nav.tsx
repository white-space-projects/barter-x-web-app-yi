"use client";

import { useState } from "react";
import {
  Repeat,
  Car,
  Home,
  Package,
  MessageSquare,
  ShieldCheck,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
} from "lucide-react";
import type { ProductType } from "@/lib/types";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "product-type" | "utility";
  productType?: ProductType;
  color?: string;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  // Product Types
  {
    id: "cross-product",
    label: "Cross-Product",
    icon: Repeat,
    type: "product-type",
    productType: "cross-product",
    color: "text-blue-500",
  },
  {
    id: "automobile",
    label: "Automobile",
    icon: Car,
    type: "product-type",
    productType: "automobile",
    color: "text-orange-500",
  },
  {
    id: "home-spaces",
    label: "Home & Spaces",
    icon: Home,
    type: "product-type",
    productType: "home-spaces",
    color: "text-green-500",
  },
  // Utility tabs
  {
    id: "my-offers",
    label: "My Offers",
    icon: Package,
    type: "utility",
    color: "text-primary",
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageSquare,
    type: "utility",
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    type: "utility",
    adminOnly: true,
  },
  {
    id: "simulate",
    label: "Simulate",
    icon: FlaskConical,
    type: "utility",
    adminOnly: true,
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    type: "utility",
  },
];

type Props = {
  activeProductType: ProductType;
  activeUtilityTab: string | null;
  onSelectProductType: (type: ProductType) => void;
  onSelectUtilityTab: (tab: string | null) => void;
  onAddOffer: () => void;
  isAdmin: boolean;
  unreadCount?: number;
};

export function SidebarNav({
  activeProductType,
  activeUtilityTab,
  onSelectProductType,
  onSelectUtilityTab,
  onAddOffer,
  isAdmin,
  unreadCount = 0,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const productTypeItems = NAV_ITEMS.filter((item) => item.type === "product-type");
  const utilityItems = NAV_ITEMS.filter(
    (item) => item.type === "utility" && (!item.adminOnly || isAdmin)
  );

  const isActive = (item: NavItem) => {
    if (item.type === "product-type") {
      return !activeUtilityTab && activeProductType === item.productType;
    }
    return activeUtilityTab === item.id;
  };

  const handleClick = (item: NavItem) => {
    if (item.type === "product-type" && item.productType) {
      onSelectProductType(item.productType);
      onSelectUtilityTab(null);
    } else {
      onSelectUtilityTab(item.id);
    }
  };

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-border bg-card/50 transition-all duration-300 h-full ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-end p-2 border-b border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Add Offer Button */}
      <div className="p-3">
        <button
          onClick={onAddOffer}
          className={`flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 ${
            collapsed ? "w-10 h-10 p-0" : "w-full py-2.5 px-3"
          }`}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Add Offer</span>}
        </button>
      </div>

      {/* Product Types Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          {!collapsed && (
            <p className="px-2 mb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Exchange Types
            </p>
          )}
          <nav className="flex flex-col gap-1">
            {productTypeItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    active
                      ? `bg-secondary/80 ${item.color}`
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? item.color : ""}`} />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Divider */}
        <div className="mx-3 my-2 h-px bg-border" />

        {/* Utility Section */}
        <div className="px-3 py-2">
          {!collapsed && (
            <p className="px-2 mb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Tools
            </p>
          )}
          <nav className="flex flex-col gap-1">
            {utilityItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              const showBadge = item.id === "chat" && unreadCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    active
                      ? `bg-secondary/80 text-foreground`
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate flex-1 text-left">
                      {item.label}
                    </span>
                  )}
                  {showBadge && (
                    <span
                      className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground ${
                        collapsed ? "absolute -top-1 -right-1" : ""
                      }`}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        </div>
    </aside>
  );
}
