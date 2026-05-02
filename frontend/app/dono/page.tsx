"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Building2, ClipboardList, LogOut, Search, ShieldCheck, UsersRound, Wallet, AlertTriangle, ArrowUpRight } from "lucide-react";

import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableRoot, TableRow } from "@/components/ui/table";
import { systemAdminApi } from "@/lib/system-admin-api";
import { formatDateTimeLabel, formatPrice } from "@/lib/utils";
import { useSystemAdminStore } from "@/store/system-admin-store";

type MetricCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
};

function MetricCard({ icon: Icon, label, value, subValue, trend }: MetricCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          {subValue && <p className="mt-1 text-xs text-slate-500">{subValue}</p>}
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/8 text-sky-200">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}

export default function SystemAdminDashboardPage() {
  const router = useRouter();
  const hasHydrated = useSystemAdminStore((state) => state.hasHydrated);
  const isAuthenticated = useSystemAdminStore((state) => state.isAuthenticated);
  const session = useSystemAdminStore((state) => state.session);
  const logout = useSystemAdminStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState<"overview" | "audit">("overview");
  const [organizationIdFilter, setOrganizationIdFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/dono/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  const enabled = Boolean(session);

  const summaryQuery = useQuery({
    queryKey: ["system-admin-summary"],
    queryFn: () => systemAdminApi.getSummary(session!),
    enabled
  });

  const tenantsQuery = useQuery({
    queryKey: ["system-admin-tenants"],
    queryFn: () => systemAdminApi.getTenants(session!, { limit: 20 }),
    enabled
  });

  const auditQuery = useQuery({
    queryKey: ["system-admin-audit", organizationIdFilter, actionFilter],
    queryFn: () =>
      systemAdminApi.getAuditEvents(session!, {
        action: actionFilter || undefined,
        limit: 25,
        organizationId: organizationIdFilter || undefined
      }),
    enabled
  });

  const marketplaceAuditQuery = useQuery({
    queryKey: ["system-admin-marketplace-audit"],
    queryFn: () => systemAdminApi.getMarketplaceAudit(session!),
    enabled: enabled && activeTab === "audit"
  });

  if (!hasHydrated || !isAuthenticated || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-slate-300">
        Validando acesso do dono...
      </main>
    );
  }

  const summary = summaryQuery.data;
  const tenants = tenantsQuery.data?.items ?? [];
  const auditEvents = auditQuery.data?.items ?? [];
  const marketplaceAudit = marketplaceAuditQuery.data ?? [];
  const panelError = summaryQuery.error ?? tenantsQuery.error ?? auditQuery.error ?? marketplaceAuditQuery.error;

  const totalCommissionCents = marketplaceAudit.reduce((acc, curr) => acc + curr.onlineCommissionCents + curr.presentialCommissionCents, 0);
  const totalPresentialDebtCents = marketplaceAudit.reduce((acc, curr) => acc + curr.presentialCommissionCents, 0);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-10">
          <BrandLogo showSlogan size="sm" />
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              {session.email}
            </div>
            <Button
              onClick={() => {
                logout();
                router.push("/dono/login");
              }}
              size="sm"
              variant="secondary"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 md:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "overview" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "audit" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Auditoria & Receita
            </button>
          </div>
          
          <div className="hidden sm:block">
            <p className="text-xs text-slate-500">Última atualização: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {panelError ? (
          <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {(panelError as Error).message}
          </div>
        ) : null}

        {activeTab === "overview" && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard icon={Building2} label="Tenants" value={summary?.tenants ?? 0} />
              <MetricCard icon={UsersRound} label="Usuários" value={summary?.users ?? 0} />
              <MetricCard icon={UsersRound} label="Clientes" value={summary?.customers ?? 0} />
              <MetricCard icon={Activity} label="Agendamentos" value={summary?.bookings ?? 0} />
              <MetricCard icon={ClipboardList} label="Audit Events" value={summary?.auditEvents ?? 0} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
              <Card>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-300">Tenants</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Clínicas e parceiros</h2>
                  </div>
                  <Building2 className="h-5 w-5 text-sky-300" />
                </div>
                <div className="mt-5">
                  <Table>
                    <TableRoot>
                      <TableHead>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Cidade</TableHead>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tenants.map((tenant) => (
                          <TableRow key={tenant.id}>
                            <TableCell className="font-medium text-white">{tenant.tradeName}</TableCell>
                            <TableCell>{tenant.bookingPageSlug}</TableCell>
                            <TableCell>{[tenant.city, tenant.state].filter(Boolean).join(" - ") || "Sem local"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </TableRoot>
                  </Table>
                </div>
              </Card>

              <Card>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-300">Rastreabilidade</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Auditoria global</h2>
                  </div>
                  <Search className="h-5 w-5 text-sky-300" />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <Input
                    onChange={(event) => setOrganizationIdFilter(event.target.value)}
                    placeholder="Filtrar por organizationId"
                    value={organizationIdFilter}
                  />
                  <Input onChange={(event) => setActionFilter(event.target.value)} placeholder="Filtrar por ação" value={actionFilter} />
                </div>
                <div className="mt-5">
                  <Table>
                    <TableRoot>
                      <TableHead>
                        <TableRow>
                          <TableHead>Quando</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>Alvo</TableHead>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {auditEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>{formatDateTimeLabel(event.occurredAt)}</TableCell>
                            <TableCell>{event.organizationId}</TableCell>
                            <TableCell className="font-medium text-white">{event.action}</TableCell>
                            <TableCell>{event.targetType}:{event.targetId}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </TableRoot>
                  </Table>
                  {auditEvents.length === 0 ? (
                    <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      Nenhum evento encontrado para os filtros atuais.
                    </p>
                  ) : null}
                </div>
              </Card>
            </section>
          </>
        )}

        {activeTab === "audit" && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard 
                icon={Wallet} 
                label="Comissão Total (Acumulada)" 
                value={formatPrice(totalCommissionCents)} 
                subValue="Online + Presencial Atendido"
              />
              <MetricCard 
                icon={AlertTriangle} 
                label="Dívida Presencial" 
                value={formatPrice(totalPresentialDebtCents)} 
                subValue="A cobrar manualmente"
              />
              <MetricCard 
                icon={Activity} 
                label="Taxa de Pagto. Local" 
                value={`${(marketplaceAudit.reduce((acc, curr) => acc + curr.presentialRatio, 0) / (marketplaceAudit.length || 1) * 100).toFixed(1)}%`} 
                subValue="Média entre organizações"
              />
            </section>

            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-300">Marketplace</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Auditoria de Receita por Organização</h2>
                </div>
                <ArrowUpRight className="h-5 w-5 text-sky-300" />
              </div>
              <div className="mt-6">
                <Table>
                  <TableRoot>
                    <TableHead>
                      <TableRow>
                        <TableHead>Organização</TableHead>
                        <TableHead>Comissão Online</TableHead>
                        <TableHead>Dívida Presencial</TableHead>
                        <TableHead>Vol. Presencial</TableHead>
                        <TableHead>Pendências Status</TableHead>
                        <TableHead>Risco</TableHead>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {marketplaceAudit.map((row) => (
                        <TableRow key={row.organizationId}>
                          <TableCell className="font-medium text-white">{row.organizationName}</TableCell>
                          <TableCell className="text-emerald-400">{formatPrice(row.onlineCommissionCents)}</TableCell>
                          <TableCell className="text-amber-400">{formatPrice(row.presentialCommissionCents)}</TableCell>
                          <TableCell>{(row.presentialRatio * 100).toFixed(1)}%</TableCell>
                          <TableCell>
                            <span className={row.pendingStatusCount > 5 ? "text-rose-400 font-bold" : ""}>
                              {row.pendingStatusCount}
                            </span>
                          </TableCell>
                          <TableCell>
                            {row.presentialRatio > 0.7 || row.pendingStatusCount > 10 ? (
                              <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">
                                Alto
                              </span>
                            ) : row.presentialRatio > 0.4 ? (
                              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                                Médio
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                                Baixo
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableRoot>
                </Table>
                {marketplaceAudit.length === 0 && !marketplaceAuditQuery.isLoading && (
                  <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    Nenhum dado de marketplace disponível ainda.
                  </p>
                )}
              </div>
            </Card>
          </>
        )}
      </section>
    </main>
  );
}
