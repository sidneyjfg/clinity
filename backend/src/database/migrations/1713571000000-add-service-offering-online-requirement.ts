import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddServiceOfferingOnlineRequirement1713571000000 implements MigrationInterface {
  public name = "AddServiceOfferingOnlineRequirement1713571000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE service_offerings ADD requireOnlinePayment boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE service_offerings DROP COLUMN requireOnlinePayment`);
  }
}
