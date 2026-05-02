import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, Unique, UpdateDateColumn } from "typeorm";

import { BookingEntity } from "./booking.entity";
import { OrganizationEntity } from "./organization.entity";
import { ProviderEntity } from "./provider.entity";

@Entity({ name: "payment_transactions" })
@Index("idx_payment_transactions_booking_id", ["bookingId"])
@Index("idx_payment_transactions_stripe_payment_intent_id", ["stripePaymentIntentId"])
@Unique("uq_payment_transactions_stripe_payment_intent_id", ["stripePaymentIntentId"])
@Unique("uq_payment_transactions_idempotency_key", ["idempotencyKey"])
export class PaymentTransactionEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "varchar", length: 36 })
  public bookingId!: string;

  @ManyToOne(() => BookingEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "bookingId" })
  public booking!: BookingEntity;

  @Column({ type: "varchar", length: 36 })
  public providerId!: string;

  @ManyToOne(() => ProviderEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "providerId" })
  public provider!: ProviderEntity;

  @Column({ type: "varchar", length: 32 })
  public status!: string;

  @Column({ name: "stripe_payment_intent_id", type: "varchar", length: 120, nullable: true })
  public stripePaymentIntentId!: string | null;

  @Column({ name: "stripe_charge_id", type: "varchar", length: 120, nullable: true })
  public stripeChargeId!: string | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  public idempotencyKey!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  public clientSecret!: string | null;

  @Column({ type: "int" })
  public originalAmountCents!: number;

  @Column({ type: "int" })
  public discountedAmountCents!: number;

  @Column({ type: "int" })
  public onlineDiscountCents!: number;

  @Column({ type: "int" })
  public platformCommissionRateBps!: number;

  @Column({ type: "int" })
  public platformCommissionCents!: number;

  @Column({ type: "int" })
  public providerNetAmountCents!: number;

  @Column({ type: "varchar", length: 500, nullable: true })
  public checkoutUrl!: string | null;

  @Column({ type: "json", nullable: true })
  public rawGatewayPayload!: unknown | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
