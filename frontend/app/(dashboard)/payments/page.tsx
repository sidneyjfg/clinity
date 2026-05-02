"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowDownToLine, CheckCircle2, Clock, CreditCard, ReceiptText, Wallet } from "lucide-react";

import { api } from "@/lib/api";
import type { FinancialHistoryItem } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PaymentMetadata = {
  originalAmountCents?: number;
  onlineDiscountCents?: number;
  discountedAmountCents?: number;
  platformCommissionCents?: number;
  providerNetAmountCents?: number;
};

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [payoutAmount, setPayoutAmount] = useState("5.00");

  const paymentSettingsQuery = useQuery({
    queryKey: ["organization-payment-settings"],
    queryFn: api.getOrganizationPaymentSettings
  });

  const hasPaymentAccount = Boolean(paymentSettingsQuery.data?.stripeAccountId);

  const paymentStatusQuery = useQuery({
    queryKey: ["organization-stripe-status", paymentSettingsQuery.data?.stripeAccountId],
    queryFn: api.getOrganizationStripeAccountStatus,
    enabled: hasPaymentAccount
  });

  const balanceQuery = useQuery({
    queryKey: ["organization-stripe-balance", paymentSettingsQuery.data?.stripeAccountId],
    queryFn: api.getOrganizationStripeBalance,
    enabled: hasPaymentAccount
  });

  const transactionsQuery = useQuery({
    queryKey: ["organization-stripe-transactions", paymentSettingsQuery.data?.stripeAccountId],
    queryFn: api.getOrganizationStripeTransactions,
    enabled: hasPaymentAccount
  });

  const payoutsQuery = useQuery({
    queryKey: ["organization-stripe-payouts", paymentSettingsQuery.data?.stripeAccountId],
    queryFn: api.getOrganizationStripePayouts,
    enabled: hasPaymentAccount
  });

  const payoutMutation = useMutation({
    mutationFn: () =>
      api.requestOrganizationStripePayout({
        amountCents: centsFromPrice(payoutAmount),
        currency: "brl",
        idempotencyKey: `organization-payout-${Date.now()}`
      }),
    meta: {
      errorMessage: "Saque não solicitado",
      successMessage: "Saque solicitado com sucesso"
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organization-stripe-balance"] });
      await queryClient.invalidateQueries({ queryKey: ["organization-stripe-payouts"] });
    }
  });

  const historyItems = useMemo(
    () => [...(transactionsQuery.data?.items ?? []), ...(payoutsQuery.data?.items ?? [])]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [payoutsQuery.data?.items, transactionsQuery.data?.items]
  );
  const latestPaymentMetadata = historyItems.map((item) => parsePaymentMetadata(item.metadata)).find(Boolean) ?? null;
  const status = paymentStatusQuery.data?.status ?? paymentSettingsQuery.data?.stripeAccountStatus ?? "pending";
  const canReceivePayments = Boolean(paymentStatusQuery.data?.canReceivePayments);
  const canRequestPayout = Boolean(paymentStatusQuery.data?.canRequestPayouts);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Pagamentos</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Conta e repasses</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Acompanhe valores recebidos, saldo disponível para saque e o cálculo transparente de cada pagamento online.
        </p>
      </div>

      {!hasPaymentAccount ? (
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <p className="font-semibold text-white">Verificação pendente</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Conclua a verificação de identidade para liberar pagamentos online, consultar saldo e solicitar saques.
                </p>
              </div>
            </div>
            <ButtonLink href="/settings" variant="secondary">
              Ir para configurações
            </ButtonLink>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryTile icon={Wallet} label="Disponível para saque" value={formatBalance(balanceQuery.data?.available ?? [])} />
        <SummaryTile icon={Clock} label="Aguardando liberação" value={formatBalance(balanceQuery.data?.pending ?? [])} />
        <SummaryTile icon={CheckCircle2} label="Status" value={canReceivePayments ? "Pagamentos ativos" : formatPaymentStatus(status)} />
      </div>

      {paymentStatusQuery.data?.blockedReasons.length ? (
        <Card className="border-amber-300/20 bg-amber-300/10">
          <div className="flex gap-3 text-sm text-amber-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Pendências para ativar pagamentos</p>
              <ul className="mt-3 space-y-2">
                {paymentStatusQuery.data.blockedReasons.map((reason) => (
                  <li key={reason}>{formatPendingReason(reason)}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-sky-300" />
              <p className="font-semibold text-white">Como o valor é calculado</p>
            </div>
            {latestPaymentMetadata ? (
              <div className="grid gap-3 md:grid-cols-2">
                <CalculationRow label="Valor do serviço" value={latestPaymentMetadata.originalAmountCents} />
                <CalculationRow label="Desconto online" value={latestPaymentMetadata.onlineDiscountCents} tone="discount" />
                <CalculationRow label="Cliente pagou" value={latestPaymentMetadata.discountedAmountCents} />
                <CalculationRow label="Taxa da plataforma" value={latestPaymentMetadata.platformCommissionCents} tone="fee" />
                <CalculationRow className="md:col-span-2" label="Valor da organização" value={latestPaymentMetadata.providerNetAmountCents} tone="net" />
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-300">
                Quando houver o primeiro pagamento online, este quadro mostrará o valor do serviço, desconto aplicado, taxa da plataforma e valor líquido da organização.
              </p>
            )}
            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
              O valor pode ficar pendente por alguns dias antes de aparecer como disponível para saque. Em produção, o primeiro repasse costuma levar mais tempo e os próximos seguem o cronograma da conta.
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-sky-300" />
              <p className="font-semibold text-white">Histórico financeiro</p>
            </div>
            <HistoryList items={historyItems} />
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-sky-300" />
              <p className="font-semibold text-white">Solicitar saque</p>
            </div>
            <BalanceList label="Disponível" items={balanceQuery.data?.available ?? []} />
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input onChange={(event) => setPayoutAmount(event.target.value)} placeholder="Valor do saque" value={payoutAmount} />
              <Button disabled={!canRequestPayout || payoutMutation.isPending} onClick={() => payoutMutation.mutate()}>
                Sacar
              </Button>
            </div>
            {!canRequestPayout ? (
              <p className="mt-3 text-xs leading-5 text-amber-200">
                Saques ficam disponíveis após a conta estar verificada e o saldo sair do período de liberação.
              </p>
            ) : null}
            {payoutMutation.error ? <p className="mt-3 text-sm text-rose-300">{payoutMutation.error.message}</p> : null}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function centsFromPrice(value: string): number {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return 0;
  return Math.max(0, Math.round(Number(normalized) * 100));
}

function formatCurrency(cents = 0, currency = "brl"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function formatBalance(items: Array<{ amount: number; currency: string }>): string {
  return items.length ? items.map((item) => formatCurrency(item.amount, item.currency)).join(" · ") : "R$ 0,00";
}

function formatPaymentStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendente",
    restricted: "Com pendências",
    verified: "Verificada"
  };

  return labels[status] ?? status;
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

function formatHistoryType(type: string): string {
  const labels: Record<string, string> = {
    payment_created: "Pagamento criado",
    payment_succeeded: "Pagamento aprovado",
    payment_failed: "Pagamento recusado",
    payout_requested: "Saque solicitado",
    payout_paid: "Saque pago",
    payout_failed: "Saque recusado",
    application_fee_created: "Taxa registrada",
    charge_updated: "Pagamento atualizado",
    transfer_created: "Repasse criado"
  };

  return labels[type] ?? type;
}

function formatHistoryStatus(status: string): string {
  const labels: Record<string, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    failed: "Falhou",
    paid: "Pago",
    in_transit: "Em trânsito",
    canceled: "Cancelado"
  };

  return labels[status] ?? status;
}

function parsePaymentMetadata(metadata: unknown): PaymentMetadata | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const data = metadata as PaymentMetadata;
  const hasPaymentValues = [
    data.originalAmountCents,
    data.onlineDiscountCents,
    data.discountedAmountCents,
    data.platformCommissionCents,
    data.providerNetAmountCents
  ].some((value) => typeof value === "number");

  return hasPaymentValues ? data : null;
}

function SummaryTile({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function CalculationRow({ className, label, tone, value }: { className?: string; label: string; tone?: "discount" | "fee" | "net"; value?: number }) {
  const textColor = tone === "net" ? "text-emerald-200" : tone === "fee" || tone === "discount" ? "text-amber-200" : "text-white";

  return (
    <div className={`rounded-lg border border-white/10 bg-white/[0.03] p-4 ${className ?? ""}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${textColor}`}>{formatCurrency(value ?? 0)}</p>
    </div>
  );
}

function BalanceList({ label, items }: { label: string; items: Array<{ amount: number; currency: string }> }) {
  return (
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{formatBalance(items)}</p>
    </div>
  );
}

function HistoryList({ items }: { items: FinancialHistoryItem[] }) {
  const sortedItems = items.slice(0, 12);

  if (!sortedItems.length) {
    return <p className="text-sm text-slate-400">Nenhum lançamento financeiro ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {sortedItems.map((item) => (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm" key={`${item.type}-${item.createdAt}`}>
          <span>
            <span className="block font-medium text-white">{formatHistoryType(item.type)}</span>
            <span className="text-slate-400">{formatHistoryStatus(item.status)}</span>
            <HistoryMetadata metadata={item.metadata} />
          </span>
          <span className="shrink-0 font-semibold text-white">{formatCurrency(item.amountCents, item.currency)}</span>
        </div>
      ))}
    </div>
  );
}

function HistoryMetadata({ metadata }: { metadata?: unknown | null }) {
  const data = parsePaymentMetadata(metadata);

  if (!data) {
    return null;
  }

  return (
    <span className="mt-1 block text-xs leading-5 text-slate-400">
      {typeof data.onlineDiscountCents === "number" ? `Desconto: ${formatCurrency(data.onlineDiscountCents)}` : ""}
      {typeof data.platformCommissionCents === "number" ? ` · Taxa da plataforma: ${formatCurrency(data.platformCommissionCents)}` : ""}
      {typeof data.providerNetAmountCents === "number" ? ` · Valor da organização: ${formatCurrency(data.providerNetAmountCents)}` : ""}
    </span>
  );
}
