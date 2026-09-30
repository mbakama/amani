import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('push_subscriptions')
@Index(['userId', 'endpoint'], { unique: true })
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text' })
  p256dh: string;

  @Column({ type: 'text' })
  auth: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;
}
