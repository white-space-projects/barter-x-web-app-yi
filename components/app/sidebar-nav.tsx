"use client";

import { useState } from "react";
import {
  ShoppingBag,
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
  Check,
  X,
  Building2,
  Briefcase,
  Key,
} from "lucide-react";
import type { ProductType } from "@/lib/types";

// Add Offer progress step type
type AddOfferStep = 1 | 2 | 3 | 4;

// Add Offer mode props
type AddOfferModeProps = {
  currentStep: AddOfferStep;
  onStepClick: (step: AddOfferStep) => void;
  onClose: () => void;
  onCancelAttempt: () => void; // Triggers discard confirmation dialog
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "product-type" | "utility";
  productType?: ProductType;
  color?: string;
  adminOnly?: boolean;
  isInactive?: boolean; // Hide from nav
  isOfferCreationEnabled?: boolean; // Can create offers
  availabilityNote?: string; // "Launching soon" etc
};

const NAV_ITEMS: NavItem[] = [
  // Active Barter Types
  {
    id: "goods",
    label: "Goods",
    icon: ShoppingBag,
    type: "product-type",
    productType: "goods",
    color: "text-blue-500",
  },
  // Deactivated Barter Types (hidden from nav)
  {
    id: "automobile",
    label: "Automobile",
    icon: Car,
    type: "product-type",
    productType: "automobile",
    color: "text-orange-500",
    isInactive: true,
  },
  {
    id: "home-spaces",
    label: "Homes & Spaces",
    icon: Home,
    type: "product-type",
    productType: "home-spaces",
    color: "text-green-500",
    isInactive: true,
  },
  // New Barter Types (Coming Soon)
  {
    id: "rentals",
    label: "Rentals",
    icon: Building2,
    type: "product-type",
    productType: "rentals",
    color: "text-emerald-500",
    isOfferCreationEnabled: false,
    availabilityNote: "Launching soon",
  },
  {
    id: "mini-jobs",
    label: "Mini Jobs",
    icon: Briefcase,
    type: "product-type",
    productType: "mini-jobs",
    color: "text-purple-500",
    isOfferCreationEnabled: false,
    availabilityNote: "Launching soon",
  },
  {
    id: "ownership",
    label: "Ownership",
    icon: Key,
    type: "product-type",
    productType: "ownership",
    color: "text-amber-500",
    isInactive: true, // Hidden from nav
    isOfferCreationEnabled: false,
    availabilityNote: "Launching soon",
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
  // Add Offer mode - when set, shows progress steps instead of nav items
  addOfferMode?: AddOfferModeProps | null;
};

export function SidebarNav({
  activeProductType,
  activeUtilityTab,
  onSelectProductType,
  onSelectUtilityTab,
  onAddOffer,
  isAdmin,
  unreadCount = 0,
  addOfferMode,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // Add Offer mode - show progress steps instead of normal nav
  if (addOfferMode) {
    const steps = [
      { number: 1 as AddOfferStep, title: "Product" },
      { number: 2 as AddOfferStep, title: "Images" },
      { number: 3 as AddOfferStep, title: "Details" },
      { number: 4 as AddOfferStep, title: "Address" },
    ];

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

        {/* Close/Cancel Button */}
        <div className="p-3">
          <button
            onClick={addOfferMode.onCancelAttempt}
            className={`flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary text-foreground font-medium transition-colors hover:bg-secondary/80 ${
              collapsed ? "w-10 h-10 p-0" : "w-full py-2.5 px-3"
            }`}
          >
            <X className="h-4 w-4" />
            {!collapsed && <span className="text-sm">Cancel</span>}
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {!collapsed && (
            <p className="px-2 mb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Progress
            </p>
          )}
          <nav className="flex flex-col gap-1">
            {steps.map((step) => {
              const isActive = step.number === addOfferMode.currentStep;
              const isCompleted = step.number < addOfferMode.currentStep;
              const isClickable = step.number <= addOfferMode.currentStep;

              return (
                <button
                  key={step.number}
                  onClick={() => isClickable && addOfferMode.onStepClick(step.number)}
                  disabled={!isClickable}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : isCompleted
                        ? "bg-secondary/50 text-foreground hover:bg-secondary cursor-pointer"
                        : "text-muted-foreground/50 cursor-not-allowed"
                  }`}
                  title={collapsed ? step.title : undefined}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium flex-shrink-0 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : step.number}
                  </div>
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{step.title}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    );
  }

  const productTypeItems = NAV_ITEMS.filter((item) => item.type === "product-type" && !item.isInactive);
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
              Barter Types
            </p>
          )}
          <nav className="flex flex-col gap-1">
            {productTypeItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              const isComingSoon = item.isOfferCreationEnabled === false;
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
                  title={collapsed ? `${item.label}${isComingSoon ? " - Coming Soon" : ""}` : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? item.color : ""}`} />
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{item.label}</span>
                      {isComingSoon && (
                        <span className="ml-1.5 text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap">
                          Soon
                        </span>
                      )}
                    </div>
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
