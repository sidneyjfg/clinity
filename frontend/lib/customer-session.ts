"use client";

import type { PublicCustomerSessionDTO } from "@/lib/backend-contract";

const CUSTOMER_SESSION_KEY = "hubly-customer-session";

export function getCustomerSession(): PublicCustomerSessionDTO | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as PublicCustomerSessionDTO;
  } catch {
    window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
    return null;
  }
}

export function saveCustomerSession(session: PublicCustomerSessionDTO): void {
  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
}

export function clearCustomerSession(): void {
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
}
