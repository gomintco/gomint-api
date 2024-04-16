import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Key } from '../key/key.entity';
import { Version } from 'src/app.entity';

@Entity('gm_accounts')
// @Unique(['alias', 'userId']) // can be used to prevent duplicate account alias per user... instead just checking on req
export class Account extends Version {
  @PrimaryColumn('varchar', { length: 20 })
  id: string;

  @Column()
  alias: string;

  @ManyToOne(() => User, (user) => user.accounts)
  user: User;

  // @Column()
  // userId: string;

  @OneToMany(() => Key, (key) => key.account)
  keys: Key[];
}
