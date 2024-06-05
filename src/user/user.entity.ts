import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Network } from 'src/hedera/network.enum';
import { Version } from 'src/app.entity';

import { Account } from 'src/account/account.entity';
import { Key } from 'src/key/key.entity';

@Entity('gm_users')
export class User extends Version {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  escrowKey: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  hashedPassword: string;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'bool', default: false })
  hasEncryptionKey: boolean;

  @Column({
    type: 'enum',
    enum: Network,
    default: Network.MAINNET,
  })
  network: Network;

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];
  // accounts: Promise<Account[]>;

  @OneToMany(() => Key, (key) => key.user)
  keys: Key[];
  // keys: Promise<Key[]>;
}
