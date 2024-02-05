import { Version } from '../app.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gm_deals')
export class Deal extends Version {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('char', { length: 64, unique: true })
  dealId: string;

  @Column('varchar', { length: 1000 })
  dealJson: string;
}
