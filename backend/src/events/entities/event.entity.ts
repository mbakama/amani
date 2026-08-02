import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EventKind {
  ONLINE_LIVE = 'online_live',
  IN_PERSON = 'in_person',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  organizer: User;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: EventKind })
  kind: EventKind;

  @Column()
  city: string;

  @Column()
  startsAt: Date;

  // Rempli si kind = ONLINE_LIVE (lien de diffusion, visible seulement apres inscription visiteur)
  @Column({ nullable: true })
  streamUrl: string;

  @Column({ nullable: true })
  venueAddress: string;

  @Column({ default: false })
  isLiveNow: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
