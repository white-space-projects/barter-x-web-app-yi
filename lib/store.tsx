/**
 * ============================================================================
 * BARTER-X STORE (React Context)
 * ============================================================================
 * 
 * PERFORMANCE OPTIMIZATIONS APPLIED:
 * 1. useMemo for the context value to prevent unnecessary re-renders
 * 2. useCallback for all functions to maintain referential equality
 * 3. Lazy initialization of state where possible
 * 
 * BACKEND DEVELOPER NOTES:
 * ========================
 * Replace mock data with real API calls:
 * - products: GET /api/products (with pagination)
 * - offers: GET /api/offers/mine, GET /api/products/:id/offers
 * - hooks: GET /api/hooks
 * - notifications: GET /api/notifications
 * 
 * Consider using SWR or React Query for data fetching with caching.
 * ============================================================================
 */

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import type {
  User,
  AuthState,
  Product,
  Offer,
  Hook,
  DashboardStats,
  ProductFilters,
  GlobalFilters,
  ExchangeTypeFilters,
  AllExchangeTypeFilters,
  ProductType,
  ChatMessage,
  Conversation,
  Notification,
} from "./types";
import {
  MOCK_PRODUCTS,
  MOCK_OFFERS,
  MOCK_HOOKS,
  MOCK_DASHBOARD_STATS,
} from "./mock-data";
import { generateGuid } from "./guid";

// ==========================================
// Auth persistence helpers
// ==========================================
const AUTH_STORAGE_KEY = "barter-x-auth";

function saveAuthToStorage(auth: AuthState) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } catch {
      // ignore storage errors
    }
  }
}

function loadAuthFromStorage(): AuthState | null {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthState;
      }
    } catch {
      // ignore storage errors
    }
  }
  return null;
}

function clearAuthFromStorage() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }
}

// ==========================================
// Store shape
// ==========================================
type BarterStore = {
  // Auth
  auth: AuthState;
  authReady: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;

  // Products
  products: Product[];
  addProduct: (product: Product) => void;
  getProductById: (productId: string) => Product | undefined;
  updateProductImage: (productId: string, imageUrl: string) => void;
  deleteProductImage: (productId: string) => void;

  // Offers
  offers: Offer[];
  addOffer: (offer: Offer) => void;
  updateOffer: (offerId: string, updates: Partial<Offer>) => void;
  deleteOffer: (offerId: string) => void;
  canDeleteOffer: (offerId: string) => boolean;
  getOffersByProduct: (productId: string) => Offer[];
  getMyOffers: () => Offer[];
  getOfferById: (offerId: string) => Offer | undefined;

  // Hooks
  hooks: Hook[];
  addHook: (hook: Hook) => void;
  removeHook: (hookId: string) => void;
  updateHook: (hookId: string, updates: Partial<Hook>) => void;
  getMyHooks: () => Hook[];
  getHooksByFromOffer: (offerId: string) => Hook[];
  getHooksToMyOffers: () => Hook[];

  // Chat & Conversations
  conversations: Conversation[];
  getOrCreateConversation: (
    hookId: string,
    myOfferId: string,
    targetOfferId: string,
    otherUserId: string,
    otherUserName: string
  ) => Conversation;
  addMessage: (conversationId: string, content: string, isMe?: boolean) => void;
  markConversationRead: (conversationId: string) => void;
  requestDeliverySupport: (conversationId: string) => void;
  getTotalUnreadMessages: () => number;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "notificationId" | "timestamp" | "read">) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadCount: () => number;

  // Dashboard
  dashboardStats: DashboardStats;

  // Filters
  productFilters: ProductFilters;
  setProductFilters: (filters: Partial<ProductFilters>) => void;
  setActiveProductTypeForFilters: (productType: ProductType) => void;
  getFiltersForProductType: (productType: ProductType) => ProductFilters;

  // Derived
  getCategories: () => string[];
  getSubcategories: (category?: string) => string[];
  getBrands: () => string[];
};

const BarterContext = createContext<BarterStore | null>(null);

export function BarterProvider({ children }: { children: ReactNode }) {
  // ---------------------------------------------------------------------------
  // STATE - Use lazy initialization for large datasets
  // ---------------------------------------------------------------------------
  const [authReady, setAuthReady] = useState(false);
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
  });
  
  // Lazy initialize from mock data
  const [products, setProducts] = useState<Product[]>(() => MOCK_PRODUCTS);
  const [offers, setOffers] = useState<Offer[]>(() => MOCK_OFFERS);
  const [hooks, setHooks] = useState<Hook[]>(() => MOCK_HOOKS);
  const [dashboardStats] = useState<DashboardStats>(() => MOCK_DASHBOARD_STATS);
  
  // Global filters shared across all exchange types
  const [globalFilters, setGlobalFiltersState] = useState<GlobalFilters>({
    searchQuery: "",
    onlyWithOffers: false,
    directExchangeOpportunities: false,
    onlyMyLocation: false,
    selectedCities: [],
  });

  // Default empty filters for each exchange type
  const defaultExchangeTypeFilters: ExchangeTypeFilters = {
    categories: [],
    subcategories: [],
    brand: "",
  };

  // Filters stored per exchange type
  const [exchangeTypeFilters, setExchangeTypeFiltersState] = useState<AllExchangeTypeFilters>({
    "cross-product": { ...defaultExchangeTypeFilters },
    "automobile": { ...defaultExchangeTypeFilters },
    "home-spaces": { ...defaultExchangeTypeFilters },
  });

  // Current active product type (for getting the right filters)
  const [activeProductType, setActiveProductTypeState] = useState<ProductType>("cross-product");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ---------------------------------------------------------------------------
  // AUTH HYDRATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const storedAuth = loadAuthFromStorage();
    if (storedAuth && storedAuth.isAuthenticated) {
      setAuth(storedAuth);
    }
    setAuthReady(true);
  }, []);

  // ---------------------------------------------------------------------------
  // AUTH ACTIONS
  // ---------------------------------------------------------------------------
  const login = useCallback((user: User, token: string) => {
    const newAuth: AuthState = { user, accessToken: token, isAuthenticated: true };
    setAuth(newAuth);
    saveAuthToStorage(newAuth);
  }, []);

  const logout = useCallback(() => {
    const newAuth: AuthState = { user: null, accessToken: null, isAuthenticated: false };
    setAuth(newAuth);
    clearAuthFromStorage();
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setAuth((prev) => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...updates };
      const newAuth: AuthState = { ...prev, user: updatedUser };
      saveAuthToStorage(newAuth);
      return newAuth;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // PRODUCT ACTIONS
  // ---------------------------------------------------------------------------
  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => [...prev, product]);
  }, []);
  
  const getProductById = useCallback((productId: string) => {
    return products.find((p) => p.productId === productId);
  }, [products]);

  const updateProductImage = useCallback((productId: string, imageUrl: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, imageUrl } : p))
    );
  }, []);

  const deleteProductImage = useCallback((productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, imageUrl: "" } : p))
    );
  }, []);

  // ---------------------------------------------------------------------------
  // OFFER ACTIONS
  // ---------------------------------------------------------------------------
  const addOffer = useCallback((offer: Offer) => {
    setOffers((prev) => [...prev, offer]);
    setProducts((prev) =>
      prev.map((p) =>
        p.productId === offer.productId
          ? { ...p, offerCount: p.offerCount + 1 }
          : p
      )
    );
  }, []);

  const updateOffer = useCallback((offerId: string, updates: Partial<Offer>) => {
    setOffers((prev) =>
      prev.map((o) => (o.offerId === offerId ? { ...o, ...updates } : o))
    );
  }, []);

  const deleteOffer = useCallback((offerId: string) => {
    setOffers((prev) => prev.filter((o) => o.offerId !== offerId));
    setHooks((prev) => prev.filter((h) => h.fromOfferId !== offerId));
  }, []);

  const canDeleteOffer = useCallback((offerId: string) => {
    const offerHooks = hooks.filter((h) => h.fromOfferId === offerId);
    const hasReservedOrBeyond = offerHooks.some((h) => 
      h.status === "reserved" || h.status === "processing" || h.status === "exchanged"
    );
    const incomingHooks = hooks.filter((h) => h.toOfferId === offerId);
    const hasIncomingReservedOrBeyond = incomingHooks.some((h) =>
      h.status === "reserved" || h.status === "processing" || h.status === "exchanged"
    );
    return !hasReservedOrBeyond && !hasIncomingReservedOrBeyond;
  }, [hooks]);
  
  const getOffersByProduct = useCallback(
    (productId: string) => offers.filter((o) => o.productId === productId),
    [offers]
  );

  const getMyOffers = useCallback(
    () => (auth.user ? offers.filter((o) => o.ownerUserId === auth.user!.userId) : []),
    [offers, auth.user]
  );

  const getOfferById = useCallback(
    (offerId: string) => offers.find((o) => o.offerId === offerId),
    [offers]
  );

  // ---------------------------------------------------------------------------
  // HOOK ACTIONS
  // ---------------------------------------------------------------------------
  const addHook = useCallback((hook: Hook) => {
    setHooks((prev) => [...prev, hook]);
    setOffers((prev) =>
      prev.map((o) =>
        o.offerId === hook.toOfferId
          ? { ...o, hookedCount: o.hookedCount + 1 }
          : o.offerId === hook.fromOfferId
            ? { ...o, outgoingHookCount: o.outgoingHookCount + 1 }
            : o
      )
    );
  }, []);

  const removeHook = useCallback((hookId: string) => {
    setHooks((prev) => {
      const hook = prev.find((h) => h.hookId === hookId);
      if (hook) {
        setOffers((prevOffers) =>
          prevOffers.map((o) =>
            o.offerId === hook.toOfferId
              ? { ...o, hookedCount: Math.max(0, o.hookedCount - 1) }
              : o.offerId === hook.fromOfferId
                ? { ...o, outgoingHookCount: Math.max(0, o.outgoingHookCount - 1) }
                : o
          )
        );
      }
      return prev.filter((h) => h.hookId !== hookId);
    });
  }, []);

  const updateHook = useCallback((hookId: string, updates: Partial<Hook>) => {
    setHooks((prev) =>
      prev.map((h) => (h.hookId === hookId ? { ...h, ...updates } : h))
    );
  }, []);

  const getMyHooks = useCallback(() => {
    if (!auth.user) return [];
    const myOfferIds = offers
      .filter((o) => o.ownerUserId === auth.user!.userId)
      .map((o) => o.offerId);
    return hooks.filter((h) => myOfferIds.includes(h.fromOfferId));
  }, [hooks, offers, auth.user]);

  const getHooksByFromOffer = useCallback(
    (offerId: string) => hooks.filter((h) => h.fromOfferId === offerId),
    [hooks]
  );

  const getHooksToMyOffers = useCallback(() => {
    if (!auth.user) return [];
    const myOfferIds = offers
      .filter((o) => o.ownerUserId === auth.user!.userId)
      .map((o) => o.offerId);
    return hooks.filter((h) => myOfferIds.includes(h.toOfferId));
  }, [hooks, offers, auth.user]);

  // ---------------------------------------------------------------------------
  // CHAT & CONVERSATION ACTIONS
  // ---------------------------------------------------------------------------
  const getOrCreateConversation = useCallback(
    (
      hookId: string,
      myOfferId: string,
      targetOfferId: string,
      otherUserId: string,
      otherUserName: string
    ): Conversation => {
      const existing = conversations.find((c) => c.hookId === hookId);
      if (existing) return existing;

      const newConversation: Conversation = {
        conversationId: generateGuid(),
        hookId,
        myOfferId,
        targetOfferId,
        otherUserId,
        otherUserName,
        messages: [],
        unreadCount: 0,
        deliverySupportRequested: false,
      };
      setConversations((prev) => [...prev, newConversation]);
      return newConversation;
    },
    [conversations]
  );

  const addMessage = useCallback(
    (conversationId: string, content: string, isMe: boolean = true) => {
      const message: ChatMessage = {
        messageId: generateGuid(),
        senderId: isMe ? auth.user?.userId || "" : "other-user",
        content,
        timestamp: new Date(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === conversationId
            ? {
                ...c,
                messages: [...c.messages, message],
                unreadCount: isMe ? c.unreadCount : c.unreadCount + 1,
              }
            : c
        )
      );
    },
    [auth.user?.userId]
  );

  const markConversationRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, []);

  const requestDeliverySupport = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId
          ? { ...c, deliverySupportRequested: true }
          : c
      )
    );

    const systemMessage: ChatMessage = {
      messageId: generateGuid(),
      senderId: "system",
      content: "Pickup & Delivery support requested. Escrow of 10 EUR blocked. Our team will contact you soon.",
      timestamp: new Date(),
      isSystemMessage: true,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId
          ? { ...c, messages: [...c.messages, systemMessage] }
          : c
      )
    );
  }, []);

  const getTotalUnreadMessages = useCallback(() => {
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  }, [conversations]);

  // ---------------------------------------------------------------------------
  // NOTIFICATION ACTIONS
  // ---------------------------------------------------------------------------
  const addNotification = useCallback(
    (notification: Omit<Notification, "notificationId" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        notificationId: generateGuid(),
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const getUnreadCount = useCallback(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // ---------------------------------------------------------------------------
  // FILTER ACTIONS
  // ---------------------------------------------------------------------------
  const setActiveProductTypeForFilters = useCallback((productType: ProductType) => {
    setActiveProductTypeState(productType);
  }, []);

  const getFiltersForProductType = useCallback((productType: ProductType): ProductFilters => {
    return {
      ...globalFilters,
      ...exchangeTypeFilters[productType],
    };
  }, [globalFilters, exchangeTypeFilters]);

  // Combined productFilters for current active product type
  const productFilters = useMemo<ProductFilters>(() => ({
    ...globalFilters,
    ...exchangeTypeFilters[activeProductType],
  }), [globalFilters, exchangeTypeFilters, activeProductType]);

  const setProductFilters = useCallback((filters: Partial<ProductFilters>) => {
    // Separate global and exchange-type-specific filters
    const globalKeys: (keyof GlobalFilters)[] = ["searchQuery", "onlyWithOffers", "directExchangeOpportunities", "onlyMyLocation", "selectedCities"];
    const exchangeTypeKeys: (keyof ExchangeTypeFilters)[] = ["categories", "subcategories", "brand"];

    const globalUpdates: Partial<GlobalFilters> = {};
    const exchangeTypeUpdates: Partial<ExchangeTypeFilters> = {};

    for (const key of Object.keys(filters) as (keyof ProductFilters)[]) {
      if (globalKeys.includes(key as keyof GlobalFilters)) {
        (globalUpdates as any)[key] = (filters as any)[key];
      } else if (exchangeTypeKeys.includes(key as keyof ExchangeTypeFilters)) {
        (exchangeTypeUpdates as any)[key] = (filters as any)[key];
      }
    }

    // Update global filters
    if (Object.keys(globalUpdates).length > 0) {
      setGlobalFiltersState((prev) => ({ ...prev, ...globalUpdates }));
    }

    // Update exchange-type-specific filters for the current active type
    if (Object.keys(exchangeTypeUpdates).length > 0) {
      setExchangeTypeFiltersState((prev) => ({
        ...prev,
        [activeProductType]: { ...prev[activeProductType], ...exchangeTypeUpdates },
      }));
    }
  }, [activeProductType]);

  // ---------------------------------------------------------------------------
  // DERIVED DATA
  // ---------------------------------------------------------------------------
  const getCategories = useCallback(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );
  
  const getSubcategories = useCallback(
    (category?: string) => {
      const filtered = category
        ? products.filter((p) => p.category === category)
        : products;
      return [...new Set(filtered.map((p) => p.subcategory))].sort();
    },
    [products]
  );
  
  const getBrands = useCallback(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products]
  );

  // ---------------------------------------------------------------------------
  // MEMOIZED CONTEXT VALUE - Critical for performance!
  // Without useMemo, a new object is created on every render,
  // causing all consumers to re-render even if values didn't change.
  // ---------------------------------------------------------------------------
  const value: BarterStore = useMemo(() => ({
    auth,
    authReady,
    login,
    logout,
    updateUser,
    products,
    addProduct,
    getProductById,
    updateProductImage,
    deleteProductImage,
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    canDeleteOffer,
    getOffersByProduct,
    getMyOffers,
    getOfferById,
    hooks,
    addHook,
    removeHook,
    updateHook,
    getMyHooks,
    getHooksByFromOffer,
    getHooksToMyOffers,
    conversations,
    getOrCreateConversation,
    addMessage,
    markConversationRead,
    requestDeliverySupport,
    getTotalUnreadMessages,
    notifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
    dashboardStats,
    productFilters,
    setProductFilters,
    setActiveProductTypeForFilters,
    getFiltersForProductType,
    getCategories,
    getSubcategories,
    getBrands,
  }), [
    auth,
    authReady,
    login,
    logout,
    updateUser,
    products,
    addProduct,
    getProductById,
    updateProductImage,
    deleteProductImage,
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    canDeleteOffer,
    getOffersByProduct,
    getMyOffers,
    getOfferById,
    hooks,
    addHook,
    removeHook,
    updateHook,
    getMyHooks,
    getHooksByFromOffer,
    getHooksToMyOffers,
    conversations,
    getOrCreateConversation,
    addMessage,
    markConversationRead,
    requestDeliverySupport,
    getTotalUnreadMessages,
    notifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
    dashboardStats,
    productFilters,
    setProductFilters,
    setActiveProductTypeForFilters,
    getFiltersForProductType,
    getCategories,
    getSubcategories,
    getBrands,
  ]);

  return (
    <BarterContext.Provider value={value}>{children}</BarterContext.Provider>
  );
}

export function useBarterStore(): BarterStore {
  const ctx = useContext(BarterContext);
  if (!ctx) throw new Error("useBarterStore must be used within BarterProvider");
  return ctx;
}
