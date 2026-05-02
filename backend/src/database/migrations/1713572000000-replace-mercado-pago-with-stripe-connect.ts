import type { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceMercadoPagoWithStripeConnect1713572000000 implements MigrationInterface {
  public name = "ReplaceMercadoPagoWithStripeConnect1713572000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ADD providerId varchar(36) NULL`);
    await queryRunner.query(`CREATE INDEX idx_users_provider_id ON users (providerId)`);
    await queryRunner.query(`ALTER TABLE users ADD CONSTRAINT fk_users_provider FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE SET NULL`);

    await queryRunner.query(`ALTER TABLE providers ADD stripe_account_id varchar(120) NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_providers_stripe_account_id ON providers (stripe_account_id)`);

    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD stripe_charges_enabled boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD stripe_payouts_enabled boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD stripe_details_submitted boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD stripe_currently_due json NULL`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD stripe_eventually_due json NULL`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD stripe_past_due json NULL`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD stripe_disabled_reason varchar(255) NULL`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD stripe_account_status varchar(32) NOT NULL DEFAULT 'pending'`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN mercadoPagoConnected`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN mercadoPagoUserId`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN mercadoPagoAccessToken`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN mercadoPagoRefreshToken`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN mercadoPagoTokenExpiresAt`);

    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD stripe_charges_enabled boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD stripe_payouts_enabled boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD stripe_details_submitted boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD stripe_currently_due json NULL`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD stripe_eventually_due json NULL`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD stripe_past_due json NULL`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD stripe_disabled_reason varchar(255) NULL`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD stripe_account_status varchar(32) NOT NULL DEFAULT 'pending'`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN mercadoPagoConnected`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN mercadoPagoUserId`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN mercadoPagoAccessToken`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN mercadoPagoRefreshToken`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN mercadoPagoTokenExpiresAt`);

    await queryRunner.query(`DROP INDEX idx_payment_transactions_mp_payment_id ON payment_transactions`);
    await queryRunner.query(`ALTER TABLE payment_transactions ADD stripe_payment_intent_id varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE payment_transactions ADD stripe_charge_id varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE payment_transactions ADD idempotencyKey varchar(160) NULL`);
    await queryRunner.query(`ALTER TABLE payment_transactions ADD clientSecret varchar(500) NULL`);
    await queryRunner.query(`ALTER TABLE payment_transactions DROP COLUMN mercadoPagoPreferenceId`);
    await queryRunner.query(`ALTER TABLE payment_transactions DROP COLUMN mercadoPagoPaymentId`);
    await queryRunner.query(
      `CREATE INDEX idx_payment_transactions_stripe_payment_intent_id ON payment_transactions (stripe_payment_intent_id)`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX uq_payment_transactions_stripe_payment_intent_id ON payment_transactions (stripe_payment_intent_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_payment_transactions_idempotency_key ON payment_transactions (idempotencyKey)`);

    await queryRunner.query(`
      CREATE TABLE stripe_webhook_events (
        stripe_event_id varchar(120) NOT NULL,
        eventType varchar(120) NOT NULL,
        processedAt datetime NULL,
        payload json NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (stripe_event_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE provider_payouts (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        providerId varchar(36) NOT NULL,
        stripeAccountId varchar(120) NOT NULL,
        stripePayoutId varchar(120) NULL,
        idempotencyKey varchar(160) NOT NULL,
        amountCents int NOT NULL,
        currency varchar(3) NOT NULL,
        status varchar(40) NOT NULL,
        failureReason varchar(255) NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_provider_payouts_provider FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_provider_payouts_provider_created_at ON provider_payouts (providerId, createdAt)`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_provider_payouts_stripe_payout_id ON provider_payouts (stripePayoutId)`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_provider_payouts_idempotency_key ON provider_payouts (idempotencyKey)`);

    await queryRunner.query(`
      CREATE TABLE financial_ledger (
        id varchar(36) NOT NULL,
        organizationId varchar(36) NOT NULL,
        providerId varchar(36) NOT NULL,
        bookingId varchar(36) NULL,
        payoutId varchar(120) NULL,
        stripeAccountId varchar(120) NOT NULL,
        stripeObjectId varchar(120) NULL,
        stripeEventId varchar(120) NULL,
        type varchar(60) NOT NULL,
        amountCents int NOT NULL,
        currency varchar(3) NOT NULL,
        status varchar(40) NOT NULL,
        failureReason varchar(255) NULL,
        metadata json NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_financial_ledger_provider FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_financial_ledger_provider_created_at ON financial_ledger (providerId, created_at)`);
    await queryRunner.query(`CREATE INDEX idx_financial_ledger_booking_id ON financial_ledger (bookingId)`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_financial_ledger_event_type_object ON financial_ledger (type, stripeObjectId, stripeEventId)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX uq_financial_ledger_event_type_object ON financial_ledger`);
    await queryRunner.query(`DROP INDEX idx_financial_ledger_booking_id ON financial_ledger`);
    await queryRunner.query(`DROP INDEX idx_financial_ledger_provider_created_at ON financial_ledger`);
    await queryRunner.query(`DROP TABLE financial_ledger`);
    await queryRunner.query(`DROP INDEX uq_provider_payouts_idempotency_key ON provider_payouts`);
    await queryRunner.query(`DROP INDEX uq_provider_payouts_stripe_payout_id ON provider_payouts`);
    await queryRunner.query(`DROP INDEX idx_provider_payouts_provider_created_at ON provider_payouts`);
    await queryRunner.query(`DROP TABLE provider_payouts`);
    await queryRunner.query(`DROP TABLE stripe_webhook_events`);
    await queryRunner.query(`DROP INDEX uq_payment_transactions_idempotency_key ON payment_transactions`);
    await queryRunner.query(`DROP INDEX uq_payment_transactions_stripe_payment_intent_id ON payment_transactions`);
    await queryRunner.query(`DROP INDEX idx_payment_transactions_stripe_payment_intent_id ON payment_transactions`);
    await queryRunner.query(`ALTER TABLE payment_transactions ADD mercadoPagoPreferenceId varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE payment_transactions ADD mercadoPagoPaymentId varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE payment_transactions DROP COLUMN clientSecret`);
    await queryRunner.query(`ALTER TABLE payment_transactions DROP COLUMN idempotencyKey`);
    await queryRunner.query(`ALTER TABLE payment_transactions DROP COLUMN stripe_charge_id`);
    await queryRunner.query(`ALTER TABLE payment_transactions DROP COLUMN stripe_payment_intent_id`);
    await queryRunner.query(`CREATE INDEX idx_payment_transactions_mp_payment_id ON payment_transactions (mercadoPagoPaymentId)`);

    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD mercadoPagoConnected boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD mercadoPagoUserId varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD mercadoPagoAccessToken varchar(1000) NULL`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD mercadoPagoRefreshToken varchar(1000) NULL`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD mercadoPagoTokenExpiresAt datetime NULL`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN stripe_account_status`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN stripe_disabled_reason`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN stripe_past_due`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN stripe_eventually_due`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN stripe_currently_due`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN stripe_details_submitted`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN stripe_payouts_enabled`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN stripe_charges_enabled`);

    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD mercadoPagoConnected boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD mercadoPagoUserId varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD mercadoPagoAccessToken varchar(1000) NULL`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD mercadoPagoRefreshToken varchar(1000) NULL`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings ADD mercadoPagoTokenExpiresAt datetime NULL`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN stripe_account_status`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN stripe_disabled_reason`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN stripe_past_due`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN stripe_eventually_due`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN stripe_currently_due`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN stripe_details_submitted`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN stripe_payouts_enabled`);
    await queryRunner.query(`ALTER TABLE provider_payment_settings DROP COLUMN stripe_charges_enabled`);

    await queryRunner.query(`DROP INDEX uq_providers_stripe_account_id ON providers`);
    await queryRunner.query(`ALTER TABLE providers DROP COLUMN stripe_account_id`);
    await queryRunner.query(`ALTER TABLE users DROP FOREIGN KEY fk_users_provider`);
    await queryRunner.query(`DROP INDEX idx_users_provider_id ON users`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN providerId`);
  }
}
