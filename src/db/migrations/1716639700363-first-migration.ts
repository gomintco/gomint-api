import { MigrationInterface, QueryRunner } from 'typeorm';

export class FirstMigration1716639700363 implements MigrationInterface {
  name = 'FirstMigration1716639700363';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`gm_keys\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('ed25519', 'ecdsa') NOT NULL DEFAULT 'ed25519', \`publicKey\` varchar(100) NOT NULL, \`encryptedPrivateKey\` varchar(300) NOT NULL, \`userId\` varchar(36) NULL, \`accountId\` varchar(20) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`gm_users\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`id\` varchar(36) NOT NULL, \`escrowKey\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`hashedPassword\` varchar(255) NOT NULL, \`username\` varchar(255) NOT NULL, \`hasEncryptionKey\` tinyint NOT NULL DEFAULT 0, \`network\` enum ('mainnet', 'testnet') NOT NULL DEFAULT 'mainnet', UNIQUE INDEX \`IDX_0d64ebe4f5551f11b09089cd9d\` (\`email\`), UNIQUE INDEX \`IDX_2f332f2fe75f4ebfe304320a38\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`gm_accounts\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`id\` varchar(20) NOT NULL, \`alias\` varchar(255) NOT NULL, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`gm_api_keys\` (\`id\` int NOT NULL AUTO_INCREMENT, \`key\` varchar(255) NOT NULL, \`userId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`gm_deals\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`id\` int NOT NULL AUTO_INCREMENT, \`dealId\` char(64) NOT NULL, \`dealJson\` varchar(1000) NOT NULL, UNIQUE INDEX \`IDX_b26530aed655b079bdfb637879\` (\`dealId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_keys\` ADD CONSTRAINT \`FK_53ec253be0179cf8d24c7796862\` FOREIGN KEY (\`userId\`) REFERENCES \`gm_users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_keys\` ADD CONSTRAINT \`FK_b4d6568653dd9d4d422cdf0f13f\` FOREIGN KEY (\`accountId\`) REFERENCES \`gm_accounts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_accounts\` ADD CONSTRAINT \`FK_eaaaa380a35e485d36870cef90e\` FOREIGN KEY (\`userId\`) REFERENCES \`gm_users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_api_keys\` ADD CONSTRAINT \`FK_38d05732b8a0cd104012d60659a\` FOREIGN KEY (\`userId\`) REFERENCES \`gm_users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`gm_api_keys\` DROP FOREIGN KEY \`FK_38d05732b8a0cd104012d60659a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_accounts\` DROP FOREIGN KEY \`FK_eaaaa380a35e485d36870cef90e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_keys\` DROP FOREIGN KEY \`FK_b4d6568653dd9d4d422cdf0f13f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`gm_keys\` DROP FOREIGN KEY \`FK_53ec253be0179cf8d24c7796862\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b26530aed655b079bdfb637879\` ON \`gm_deals\``,
    );
    await queryRunner.query(`DROP TABLE \`gm_deals\``);
    await queryRunner.query(`DROP TABLE \`gm_api_keys\``);
    await queryRunner.query(`DROP TABLE \`gm_accounts\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_2f332f2fe75f4ebfe304320a38\` ON \`gm_users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0d64ebe4f5551f11b09089cd9d\` ON \`gm_users\``,
    );
    await queryRunner.query(`DROP TABLE \`gm_users\``);
    await queryRunner.query(`DROP TABLE \`gm_keys\``);
  }
}
