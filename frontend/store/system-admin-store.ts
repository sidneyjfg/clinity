"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SystemAdminSession = {
  accessToken: string;
  actorId: string;
  email: string;
  sessionId: string;
  tokenType: "system_admin_access";
};

type SystemAdminState = {
  hasHydrated: boolean;
  isAuthenticated: boolean;
  session: SystemAdminSession | null;
  login: (session: SystemAdminSession) => void;
  logout: () => void;
  setHydrated: (value: boolean) => void;
};

export const useSystemAdminStore = create<SystemAdminState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      isAuthenticated: false,
      session: null,
      login: (session) =>
        set({
          isAuthenticated: true,
          session
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          session: null
        }),
      setHydrated: (value) =>
        set({
          hasHydrated: value
        })
    }),
    {
      name: "hubly-system-admin-store",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined
          };
        }

        return window.localStorage;
      }),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        session: state.session
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
