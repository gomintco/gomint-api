import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVersionToApikey1717606210826 implements MigrationInterface {
  name = 'AddVersionToApikey1717606210826';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`gm_api_keys\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_api_keys\` ADD \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_api_keys\` ADD \`version\` int NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`gm_api_keys\` DROP COLUMN \`version\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_api_keys\` DROP COLUMN \`updatedDate\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_api_keys\` DROP COLUMN \`createdAt\``,
    );
  }
}
