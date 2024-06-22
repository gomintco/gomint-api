import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Key } from '../key/key.entity';
import { Version } from 'src/app.entity';

@Entity('gm_accounts')
export class Account extends Version {
  @PrimaryColumn('varchar', { length: 20 })
  id: string;

  @Column()
  alias: string;

  @ManyToOne(() => User, (user) => user.accounts)
  user: User;

  @OneToMany(() => Key, (key) => key.account)
  keys: Key[];
}
