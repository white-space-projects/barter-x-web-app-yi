"use client";

/**
 * ============================================================================
 * BACK OFFICE SHELL
 * ============================================================================
 * Main layout shell for Back Office with sidebar navigation.
 * Uses the same design language as the main app.
 */

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FlaskConical,
  Database,
  Settings,
  FileCode,
  BookOpen,
  MessageSquare,
  Ticket,
  Package,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Users,
} from "lucide-react";
import { useBackOfficeAuth } from "@/lib/backoffice/auth-store";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/backoffice",
  },
  {
    id: "simulate",
    label: "Simulate",
    icon: FlaskConical,
    href: "/backoffice/simulate",
  },
  {
    id: "engine-tables",
    label: "Engine Tables",
    icon: Database,
    href: "/backoffice/engine-tables",
    children: [
      { label: "Nodes", href: "/backoffice/engine-tables/nodes" },
      { label: "Edges", href: "/backoffice/engine-tables/edges" },
      { label: "Snapshots", href: "/backoffice/engine-tables/snapshots" },
      { label: "Reservations", href: "/backoffice/engine-tables/reservations" },
    ],
  },
  {
    id: "config",
    label: "Config",
    icon: Settings,
    href: "/backoffice/config",
  },
  {
    id: "api-docs",
    label: "API Docs",
    icon: FileCode,
    href: "/backoffice/api-docs",
  },
  {
    id: "schema",
    label: "Schema Reference",
    icon: BookOpen,
    href: "/backoffice/schema",
  },
  {
    id: "ai-query",
    label: "AI Query",
    icon: MessageSquare,
    href: "/backoffice/ai-query",
  },
  {
    id: "tickets",
    label: "Tickets",
    icon: Ticket,
    href: "/backoffice/tickets",
  },
  {
    id: "product-review",
    label: "Product Review",
    icon: Package,
    href: "/backoffice/product-review",
  },
  {
    id: "allowed-emails",
    label: "Allowed Emails",
    icon: Users,
    href: "/backoffice/allowed-emails",
  },
];

export function BackOfficeShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useBackOfficeAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["engine-tables"]);
  const [hydrated, setHydrated] = useState(false);

  // Wait for hydration before checking auth
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Redirect to login if not authenticated (only after hydration)
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/backoffice/login");
    }
  }, [hydrated, isAuthenticated, router]);

  // Show loading state during hydration
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  function handleLogout() {
    logout();
    router.push("/backoffice/login");
  }

  function toggleExpanded(id: string) {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function isActive(href: string): boolean {
    if (href === "/backoffice") {
      return pathname === "/backoffice";
    }
    return pathname.startsWith(href);
  }

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/backoffice" className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary tracking-tight">
            BARTER-X
          </span>
          <span className="text-xs text-muted-foreground">Back Office</span>
        </Link>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const expanded = expandedItems.includes(item.id);

            return (
              <li key={item.id}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {expanded && (
                      <ul className="mt-1 ml-4 space-y-1 border-l border-border pl-4">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                  childActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* User / Logout */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card lg:block">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Link href="/backoffice" className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary tracking-tight">
            BARTER-X
          </span>
          <span className="text-xs text-muted-foreground">BO</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-14 z-50 h-[calc(100vh-56px)] w-72 border-r border-border bg-card transition-transform lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="min-h-screen p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
