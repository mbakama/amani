import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum ActivityType {
  ARTIST_REGISTERED = 'artist_registered',
  ARTIST_VERIFIED = 'artist_verified',
  ARTIST_REJECTED = 'artist_rejected',
  ARTIST_BLOCKED = 'artist_blocked',
  ARTIST_UNBLOCKED = 'artist_unblocked',
  WORK_PUBLISHED = 'work_published',
  WORK_FEATURED = 'work_featured',
  WORK_UNFEATURED = 'work_unfeatured',
  WORK_REMOVED = 'work_removed',
  WORK_RESTORED = 'work_restored',
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  type: ActivityType;

  @Column({ type: 'text' })
  message: string;

  /** Admin (ou systeme) a l'origine de l'action */
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  /** Nom de l'auteur au moment de l'action (denormalise) */
  @Column({ type: 'varchar', length: 255, nullable: true })
  actorLabel: string | null;

  @Column({ type: 'uuid', nullable: true })
  subjectUserId: string | null;

  /** Libelle stable pour l'affichage (nom artiste, titre oeuvre…) */
  @Column({ type: 'varchar', length: 255, nullable: true })
  subjectLabel: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
