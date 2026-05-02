import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { FinancialLedgerEntity } from "../database/entities";

export type FinancialLedgerCreateInput = {
  organizationId: string;
  providerId?: string | null;
  bookingId?: string | null;
  payoutId?: string | null;
  stripeAccountId: string;
  stripeObjectId?: string | null;
  stripeEventId?: string | null;
  type: string;
  amountCents: number;
  currency: string;
  status: string;
  failureReason?: string | null;
  metadata?: unknown | null;
};

export class FinancialLedgerRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(FinancialLedgerEntity);
  }

  public async append(input: FinancialLedgerCreateInput, manager?: EntityManager): Promise<void> {
    try {
      await this.getRepository(manager).insert({
        id: randomUUID(),
        organizationId: input.organizationId,
        providerId: input.providerId ?? null,
        bookingId: input.bookingId ?? null,
        payoutId: input.payoutId ?? null,
        stripeAccountId: input.stripeAccountId,
        stripeObjectId: input.stripeObjectId ?? null,
        stripeEventId: input.stripeEventId ?? null,
        type: input.type,
        amountCents: input.amountCents,
        currency: input.currency.toLowerCase(),
        status: input.status,
        failureReason: input.failureReason ?? null,
        ...(input.metadata == null ? {} : { metadata: input.metadata }),
      });
    } catch {
      // Unique constraints make webhook replay/idempotency safe.
    }
  }

  public async findByProvider(
    organizationId: string,
    providerId: string,
    filters: { types?: string[] } = {},
    manager?: EntityManager,
  ): Promise<FinancialLedgerEntity[]> {
    const repository = this.getRepository(manager);
    const query = repository
      .createQueryBuilder("ledger")
      .where("ledger.organizationId = :organizationId", { organizationId })
      .andWhere("ledger.providerId = :providerId", { providerId })
      .orderBy("ledger.createdAt", "DESC")
      .take(100);

    if (filters.types?.length) {
      query.andWhere("ledger.type IN (:...types)", { types: filters.types });
    }

    return query.getMany();
  }

  public async findByOrganization(
    organizationId: string,
    filters: { types?: string[] } = {},
    manager?: EntityManager,
  ): Promise<FinancialLedgerEntity[]> {
    const repository = this.getRepository(manager);
    const query = repository
      .createQueryBuilder("ledger")
      .where("ledger.organizationId = :organizationId", { organizationId })
      .orderBy("ledger.createdAt", "DESC")
      .take(100);

    if (filters.types?.length) {
      query.andWhere("ledger.type IN (:...types)", { types: filters.types });
    }

    return query.getMany();
  }
}
