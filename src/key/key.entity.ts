import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { KeyType } from '../app.interface';
import { Version } from '../app.entity';
import { Account } from '../account/account.entity';

@Entity('gm_keys')
export class Key extends Version {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: KeyType,
    default: KeyType.ED25519,
  })
  type: KeyType;

  @Column('varchar', { length: 100 })
  publicKey: string;

  @Column('varchar', { length: 300 })
  encryptedPrivateKey: string;

  @ManyToOne(() => User, (user) => user.keys)
  user: User;

  @ManyToOne(() => Account, (account) => account.keys)
  account: Account;
}
