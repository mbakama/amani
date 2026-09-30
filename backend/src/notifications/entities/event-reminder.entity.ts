import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('event_reminders')
@Index(['userId', 'eventId'], { unique: true })
export class EventReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  event: Event;

  @Column({ default: false })
  sent: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
