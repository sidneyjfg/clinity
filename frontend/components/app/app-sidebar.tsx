"use client";

import Link from "next/link";
import type { Route } from "next";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Crown,
  Images,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRoundCog,
  UsersRound,
  Wallet
} from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/app/brand-logo";
import { api } from "@/lib/api";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const navigation: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}> = [
  { href: "/admin", label: "Admin", icon: Crown, roles: ["administrator"] },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["administrator", "reception"] },
  { href: "/customers", label: "Clientes", icon: UsersRound, roles: ["administrator", "reception", "provider"] },
  { href: "/providers", label: "Profissionais", icon: UserRoundCog, roles: ["administrator", "reception"] },
  { href: "/storefront", label: "Vitrine", icon: Images, roles: ["administrator", "reception", "provider"] },
  { href: "/bookings", label: "Agenda", icon: CalendarDays, roles: ["administrator", "reception", "provider"] },
  { href: "/automations", label: "Automações", icon: Bot, roles: ["administrator"] },
  { href: "/reports", label: "Relatórios", icon: BarChart3, roles: ["administrator", "reception"] },
  { href: "/payments", label: "Pagamentos", icon: Wallet, roles: ["administrator"] }
];

export function AppSidebar() {
  const pathname = usePathname();
  const role = useAppStore((state) => state.currentUser?.role);
  const [isExpanded, setIsExpanded] = useState(true);
  const ToggleIcon = isExpanded ? PanelLeftClose : PanelLeftOpen;
  const visibleNavigation = role ? navigation.filter((item) => item.roles.includes(role)) : navigation;
  const isAdministrator = role === "administrator";

  const paymentSettingsQuery = useQuery({
    queryKey: ["organization-payment-settings"],
    queryFn: api.getOrganizationPaymentSettings,
    enabled: isAdministrator && isExpanded
  });

  const paymentStatusQuery = useQuery({
    queryKey: ["organization-stripe-status", paymentSettingsQuery.data?.stripeAccountId],
    queryFn: api.getOrganizationStripeAccountStatus,
    enabled: Boolean(isAdministrator && isExpanded && paymentSettingsQuery.data?.stripeAccountId)
  });

  const accountPendingItems = getAccountPendingItems({
    blockedReasons: paymentStatusQuery.data?.blockedReasons ?? [],
    hasPaymentAccount: Boolean(paymentSettingsQuery.data?.stripeAccountId),
    hasPaymentSettingsLoaded: paymentSettingsQuery.isSuccess,
    hasPaymentStatusLoaded: paymentStatusQuery.isSuccess
  });

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-white/10 bg-slate-950/90 px-3 py-5 backdrop-blur transition-[width] duration-300 xl:flex",
        isExpanded ? "w-64" : "w-20"
      )}
    >
      <div className={cn("mb-5 flex shrink-0 gap-2", isExpanded ? "items-center justify-between" : "flex-col items-center")}>
        <Link className={cn("flex min-w-0 items-center gap-3", !isExpanded && "justify-center")} href="/">
          <BrandLogo compact={!isExpanded} size="sm" />
        </Link>
        <button
          aria-label={isExpanded ? "Recolher barra lateral" : "Expandir barra lateral"}
          className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          <ToggleIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <nav className="space-y-1.5">
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition",
                  !isExpanded && "justify-center px-0",
                  isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                href={item.href as Route}
                key={item.href}
                title={isExpanded ? undefined : item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {isExpanded ? <span className="truncate">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        {isExpanded && accountPendingItems.length > 0 ? (
          <Link
            className="mt-5 block rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 transition hover:bg-amber-300/15"
            href="/settings"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-amber-100">
              <Settings className="h-4 w-4" />
              Pendências da conta
            </div>
            <ul className="mt-3 space-y-2 text-sm text-amber-100/85">
              {accountPendingItems.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function getAccountPendingItems({
  blockedReasons,
  hasPaymentAccount,
  hasPaymentSettingsLoaded,
  hasPaymentStatusLoaded
}: {
  blockedReasons: string[];
  hasPaymentAccount: boolean;
  hasPaymentSettingsLoaded: boolean;
  hasPaymentStatusLoaded: boolean;
}): string[] {
  if (!hasPaymentSettingsLoaded) {
    return [];
  }

  if (!hasPaymentAccount) {
    return ["Concluir verificação de identidade."];
  }

  if (!hasPaymentStatusLoaded) {
    return [];
  }

  return blockedReasons.map(formatPendingReason);
}

function formatPendingReason(reason: string): string {
  const labels: Record<string, string> = {
    charges_not_enabled: "Recebimento por cartão ainda não liberado.",
    kyc_details_missing: "Dados de identidade ou negócio incompletos.",
    payouts_not_enabled: "Saques ainda não liberados.",
    requirements_past_due: "Há informações obrigatórias vencidas."
  };

  return labels[reason] ?? reason;
}
