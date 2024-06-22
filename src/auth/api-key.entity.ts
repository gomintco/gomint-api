import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Version } from 'src/app.entity';

@Entity('gm_api_keys')
export class ApiKey extends Version {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @ManyToOne(() => User)
  user: User;
}
