import type { MigrationInterface, QueryRunner } from "typeorm";

export class MoveStripeConnectToOrganization1713573000000 implements MigrationInterface {
  public name = "MoveStripeConnectToOrganization1713573000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE organization_payment_settings ADD stripe_account_id varchar(120) NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_organization_payment_settings_stripe_account_id ON organization_payment_settings (stripe_account_id)`);
    await queryRunner.query(`ALTER TABLE provider_payouts MODIFY providerId varchar(36) NULL`);
    await queryRunner.query(`ALTER TABLE financial_ledger MODIFY providerId varchar(36) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE financial_ledger MODIFY providerId varchar(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE provider_payouts MODIFY providerId varchar(36) NOT NULL`);
    await queryRunner.query(`DROP INDEX uq_organization_payment_settings_stripe_account_id ON organization_payment_settings`);
    await queryRunner.query(`ALTER TABLE organization_payment_settings DROP COLUMN stripe_account_id`);
  }
}
