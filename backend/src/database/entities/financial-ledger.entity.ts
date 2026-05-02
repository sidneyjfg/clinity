import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique } from "typeorm";

@Entity({ name: "financial_ledger" })
@Index("idx_financial_ledger_provider_created_at", ["providerId", "createdAt"])
@Index("idx_financial_ledger_booking_id", ["bookingId"])
@Unique("uq_financial_ledger_event_type_object", ["type", "stripeObjectId", "stripeEventId"])
export class FinancialLedgerEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @Column({ type: "varchar", length: 36, nullable: true })
  public providerId!: string | null;

  @Column({ type: "varchar", length: 36, nullable: true })
  public bookingId!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  public payoutId!: string | null;

  @Column({ type: "varchar", length: 120 })
  public stripeAccountId!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  public stripeObjectId!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  public stripeEventId!: string | null;

  @Column({ type: "varchar", length: 60 })
  public type!: string;

  @Column({ type: "int" })
  public amountCents!: number;

  @Column({ type: "varchar", length: 3 })
  public currency!: string;

  @Column({ type: "varchar", length: 40 })
  public status!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  public failureReason!: string | null;

  @Column({ type: "json", nullable: true })
  public metadata!: unknown | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  public createdAt!: Date;
}
