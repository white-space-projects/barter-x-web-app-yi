/**
 * ============================================================================
 * BACK OFFICE AUTH STORE
 * ============================================================================
 * Lightweight auth state for Back Office, separate from main app auth.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BackOfficeUser } from "./types";

interface BackOfficeAuthState {
  user: BackOfficeUser | null;
  isAuthenticated: boolean;
  login: (user: BackOfficeUser) => void;
  logout: () => void;
}

export const useBackOfficeAuth = create<BackOfficeAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "backoffice-auth",
    }
  )
);
