"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Building2, ClipboardList, LogOut, Search, ShieldCheck, UsersRound } from "lucide-react";

import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableRoot, TableRow } from "@/components/ui/table";
import { systemAdminApi } from "@/lib/system-admin-api";
import { formatDateTimeLabel } from "@/lib/utils";
import { useSystemAdminStore } from "@/store/system-admin-store";

type MetricCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
};

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
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
  const panelError = summaryQuery.error ?? tenantsQuery.error ?? auditQuery.error;

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
        <div className="rounded-xl border border-white/10 bg-panel/90 p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300">Painel do dono</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Auditoria e manutenção do sistema</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Área interna com token próprio para rastrear tenants, eventos sensíveis e indicadores operacionais sem usar sessão de clínica.
              </p>
              <Link className="mt-4 inline-flex text-sm font-medium text-sky-300 hover:text-sky-200" href="/admin">
                Ir para admin de clínica
              </Link>
            </div>
          </div>
        </div>

        {panelError ? (
          <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {panelError.message}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard icon={Building2} label="Tenants" value={summary?.tenants ?? 0} />
          <MetricCard icon={UsersRound} label="Usuários" value={summary?.users ?? 0} />
          <MetricCard icon={UsersRound} label="Clientes" value={summary?.customers ?? 0} />
          <MetricCard icon={Activity} label="Agendamentos" value={summary?.bookings ?? 0} />
          <MetricCard icon={ClipboardList} label="Auditoria" value={summary?.auditEvents ?? 0} />
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
                      <TableCell>Nome</TableCell>
                      <TableCell>Slug</TableCell>
                      <TableCell>Cidade</TableCell>
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
                      <TableCell>Quando</TableCell>
                      <TableCell>Tenant</TableCell>
                      <TableCell>Ação</TableCell>
                      <TableCell>Alvo</TableCell>
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
      </section>
    </main>
  );
}
