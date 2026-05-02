import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "stripe_webhook_events" })
export class StripeWebhookEventEntity {
  @PrimaryColumn({ name: "stripe_event_id", type: "varchar", length: 120 })
  public stripeEventId!: string;

  @Column({ type: "varchar", length: 120 })
  public eventType!: string;

  @Column({ type: "datetime", nullable: true })
  public processedAt!: Date | null;

  @Column({ type: "json", nullable: true })
  public payload!: unknown | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;
}
