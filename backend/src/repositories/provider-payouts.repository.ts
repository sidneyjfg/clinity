import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { ProviderPayoutEntity } from "../database/entities";

export class ProviderPayoutsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(ProviderPayoutEntity);
  }

  public async createPending(input: {
    organizationId: string;
    providerId?: string | null;
    stripeAccountId: string;
    idempotencyKey: string;
    amountCents: number;
    currency: string;
  }, manager?: EntityManager): Promise<ProviderPayoutEntity> {
    const existing = await this.getRepository(manager).findOne({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      return existing;
    }

    return this.getRepository(manager).save({
      id: randomUUID(),
      organizationId: input.organizationId,
      providerId: input.providerId ?? null,
      stripeAccountId: input.stripeAccountId,
      idempotencyKey: input.idempotencyKey,
      amountCents: input.amountCents,
      currency: input.currency.toLowerCase(),
      status: "pending",
      failureReason: null,
    });
  }

  public async updateStripeResult(input: {
    id: string;
    stripePayoutId?: string | null;
    status: string;
    failureReason?: string | null;
  }, manager?: EntityManager): Promise<ProviderPayoutEntity> {
    const repository = this.getRepository(manager);
    const payout = await repository.findOneOrFail({ where: { id: input.id } });
    payout.stripePayoutId = input.stripePayoutId === undefined ? payout.stripePayoutId : input.stripePayoutId;
    payout.status = input.status;
    payout.failureReason = input.failureReason ?? null;
    return repository.save(payout);
  }

  public async findByStripePayoutId(stripePayoutId: string, manager?: EntityManager): Promise<ProviderPayoutEntity | null> {
    return this.getRepository(manager).findOne({ where: { stripePayoutId } });
  }

  public async findByProvider(
    organizationId: string,
    providerId: string,
    manager?: EntityManager,
  ): Promise<ProviderPayoutEntity[]> {
    return this.getRepository(manager).find({
      where: { organizationId, providerId },
      order: { createdAt: "DESC" },
      take: 100,
    });
  }
}
