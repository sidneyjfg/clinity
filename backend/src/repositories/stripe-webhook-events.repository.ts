import type { DataSource, EntityManager } from "typeorm";

import { StripeWebhookEventEntity } from "../database/entities";

export class StripeWebhookEventsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(StripeWebhookEventEntity);
  }

  public async tryStartProcessing(input: {
    stripeEventId: string;
    eventType: string;
    payload: unknown;
  }, manager?: EntityManager): Promise<boolean> {
    try {
      await this.getRepository(manager).insert({
        stripeEventId: input.stripeEventId,
        eventType: input.eventType,
        payload: input.payload as Record<string, unknown>,
        processedAt: null,
      });
      return true;
    } catch {
      return false;
    }
  }

  public async markProcessed(stripeEventId: string, manager?: EntityManager): Promise<void> {
    await this.getRepository(manager).update({ stripeEventId }, { processedAt: new Date() });
  }
}
