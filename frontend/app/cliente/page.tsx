"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, LogOut, MapPin, ReceiptText } from "lucide-react";

import { BrandLogo } from "@/components/app/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { clearCustomerSession, getCustomerSession } from "@/lib/customer-session";

export default function CustomerPortalPage() {
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    const session = getCustomerSession();
    if (!session) {
      window.location.href = "/cliente/login";
      return;
    }

    setAccessToken(session.accessToken);
  }, []);

  const portalQuery = useQuery({
    queryKey: ["public-customer-portal", accessToken],
    queryFn: () => api.getPublicCustomerPortal(accessToken),
    enabled: Boolean(accessToken)
  });

  const portal = portalQuery.data;
  const upcomingBookings = (portal?.bookings ?? []).filter((booking) => new Date(booking.startsAt).getTime() >= Date.now());
  const pastBookings = (portal?.bookings ?? []).filter((booking) => new Date(booking.startsAt).getTime() < Date.now());

  function logout() {
    clearCustomerSession();
    window.location.href = "/clientes";
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-10">
          <BrandLogo showSlogan size="sm" />
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/clientes" variant="secondary">Ver estabelecimentos</ButtonLink>
            <Button onClick={logout} variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Minha conta</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{portal?.customer.fullName ?? "Cliente"}</h1>
          <p className="mt-2 text-sm text-slate-400">{portal?.customer.email ?? portal?.customer.phone ?? "Carregando..."}</p>
        </div>

        {portalQuery.error ? (
          <Card>
            <p className="text-sm text-rose-300">{portalQuery.error.message}</p>
            <Button className="mt-4" onClick={logout} variant="secondary">Entrar novamente</Button>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-300" />
              <p className="font-semibold text-white">Últimos estabelecimentos</p>
            </div>
            <div className="space-y-3">
              {(portal?.places ?? []).map((place) => (
                <Link
                  className="block rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  href={`/clientes/${place.organizationSlug}`}
                  key={place.organizationId}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{place.organizationName}</p>
                      <p className="mt-1 text-sm text-slate-400">{place.visits} agendamentos</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-200">{formatCurrency(place.spentCents)}</p>
                  </div>
                </Link>
              ))}
              {portal && portal.places.length === 0 ? <p className="text-sm text-slate-400">Nenhum estabelecimento visitado ainda.</p> : null}
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="mb-5 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-sky-300" />
                <p className="font-semibold text-white">Próximos agendamentos</p>
              </div>
              <BookingList bookings={upcomingBookings} emptyText="Nenhum agendamento futuro." />
            </Card>

            <Card>
              <div className="mb-5 flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-sky-300" />
                <p className="font-semibold text-white">Histórico</p>
              </div>
              <BookingList bookings={pastBookings} emptyText="Nenhum histórico ainda." />
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

function BookingList({ bookings, emptyText }: {
  bookings: Array<{
    id: string;
    organizationName: string;
    organizationSlug: string;
    providerName?: string;
    serviceName?: string | null;
    startsAt: string;
    status: string;
    paymentStatus?: string;
    discountedAmountCents?: number;
  }>;
  emptyText: string;
}) {
  if (!bookings.length) {
    return <p className="text-sm text-slate-400">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4" key={booking.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-white">{booking.organizationName}</p>
              <p className="mt-1 text-sm text-slate-400">
                {booking.serviceName ?? "Serviço"} com {booking.providerName ?? "profissional"}
              </p>
              <p className="mt-2 text-sm text-slate-300">{formatDateTime(booking.startsAt)}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-white">{formatCurrency(booking.discountedAmountCents ?? 0)}</p>
              <p className="mt-1 text-slate-400">{formatPaymentStatus(booking.paymentStatus ?? "pending_local")}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

function formatPaymentStatus(status: string): string {
  const labels: Record<string, string> = {
    approved: "Pago",
    pending: "Pendente",
    pending_local: "Pagamento no local",
    rejected: "Recusado",
    cancelled: "Cancelado",
    not_required: "Não exigido"
  };

  return labels[status] ?? status;
}
