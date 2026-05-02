import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { PaymentTransactionEntity } from "../database/entities";
import type { PaymentBreakdown, PaymentStatus } from "../types/payment";

export class PaymentTransactionsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(PaymentTransactionEntity);
  }

  public async create(
    input: {
      organizationId: string;
      bookingId: string;
      providerId: string;
      breakdown: PaymentBreakdown;
      checkoutUrl?: string | null;
      idempotencyKey?: string | null;
    },
    manager?: EntityManager,
  ): Promise<PaymentTransactionEntity> {
    return this.getRepository(manager).save({
      id: randomUUID(),
      organizationId: input.organizationId,
      bookingId: input.bookingId,
      providerId: input.providerId,
      status: input.breakdown.paymentStatus,
      stripePaymentIntentId: null,
      stripeChargeId: null,
      idempotencyKey: input.idempotencyKey ?? null,
      clientSecret: null,
      originalAmountCents: input.breakdown.originalAmountCents,
      discountedAmountCents: input.breakdown.discountedAmountCents,
      onlineDiscountCents: input.breakdown.onlineDiscountCents,
      platformCommissionRateBps: input.breakdown.platformCommissionRateBps,
      platformCommissionCents: input.breakdown.platformCommissionCents,
      providerNetAmountCents: input.breakdown.providerNetAmountCents,
      checkoutUrl: input.checkoutUrl ?? null,
      rawGatewayPayload: null,
    });
  }

  public async findLatestByBookingId(bookingId: string, manager?: EntityManager): Promise<PaymentTransactionEntity | null> {
    return this.getRepository(manager).findOne({
      where: { bookingId },
      order: { createdAt: "DESC" },
    });
  }

  public async findByStripePaymentIntentId(
    stripePaymentIntentId: string,
    manager?: EntityManager,
  ): Promise<PaymentTransactionEntity | null> {
    return this.getRepository(manager).findOne({
      where: { stripePaymentIntentId },
    });
  }

  public async updateGatewayResult(
    id: string,
    input: {
      status: PaymentStatus;
      stripePaymentIntentId?: string | null;
      stripeChargeId?: string | null;
      clientSecret?: string | null;
      checkoutUrl?: string | null;
      rawGatewayPayload?: unknown | null;
    },
    manager?: EntityManager,
  ): Promise<PaymentTransactionEntity> {
    const repository = this.getRepository(manager);
    const transaction = await repository.findOneOrFail({ where: { id } });
    transaction.status = input.status;
    transaction.stripePaymentIntentId = input.stripePaymentIntentId === undefined
      ? transaction.stripePaymentIntentId
      : input.stripePaymentIntentId;
    transaction.stripeChargeId = input.stripeChargeId === undefined
      ? transaction.stripeChargeId
      : input.stripeChargeId;
    transaction.clientSecret = input.clientSecret === undefined ? transaction.clientSecret : input.clientSecret;
    transaction.checkoutUrl = input.checkoutUrl === undefined ? transaction.checkoutUrl : input.checkoutUrl;
    transaction.rawGatewayPayload = input.rawGatewayPayload === undefined ? transaction.rawGatewayPayload : input.rawGatewayPayload;

    return repository.save(transaction);
  }
}
