import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity({ name: "provider_payouts" })
@Index("idx_provider_payouts_provider_created_at", ["providerId", "createdAt"])
@Unique("uq_provider_payouts_stripe_payout_id", ["stripePayoutId"])
@Unique("uq_provider_payouts_idempotency_key", ["idempotencyKey"])
export class ProviderPayoutEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @Column({ type: "varchar", length: 36, nullable: true })
  public providerId!: string | null;

  @Column({ type: "varchar", length: 120 })
  public stripeAccountId!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  public stripePayoutId!: string | null;

  @Column({ type: "varchar", length: 160 })
  public idempotencyKey!: string;

  @Column({ type: "int" })
  public amountCents!: number;

  @Column({ type: "varchar", length: 3 })
  public currency!: string;

  @Column({ type: "varchar", length: 40 })
  public status!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  public failureReason!: string | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
