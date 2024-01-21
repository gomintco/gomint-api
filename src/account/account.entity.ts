import { Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Key } from '../key/key.entity';

@Entity('gm_accounts')
export class Account {
  @PrimaryColumn('varchar', { length: 20 })
  id: string;

  @ManyToOne(() => User, (user) => user.accounts)
  user: User;

  @OneToMany(() => Key, (key) => key.account)
  keys: Key[];
}
