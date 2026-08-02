import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Type generique : permet d'ajouter slam, poeme, etc. sans changer la structure de la table.
export enum WorkType {
  MUSIC = 'music',
  SLAM = 'slam',
  POEM = 'poem',
}

export enum WorkSourceType {
  FILE = 'file',   // upload direct (audio/video)
  LINK = 'link',   // lien externe (YouTube, Spotify...)
  TEXT = 'text',   // contenu textuel (ex. poeme)
}

export enum ModerationStatus {
  PUBLISHED = 'published',
  FLAGGED = 'flagged',
  REMOVED = 'removed',
}

@Entity('works')
export class Work {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.works, { onDelete: 'CASCADE' })
  artist: User;

  @Column({ type: 'enum', enum: WorkType, default: WorkType.MUSIC })
  type: WorkType;

  @Column()
  title: string;

  @Column({ nullable: true })
  style: string; // ex: "chant spirituel", "instrumental", "slam engage"

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'enum', enum: WorkSourceType })
  sourceType: WorkSourceType;

  // Rempli si sourceType = FILE (URL Cloudflare R2)
  @Column({ nullable: true })
  fileUrl: string;

  // Rempli si sourceType = LINK
  @Column({ nullable: true })
  externalUrl: string;

  // Rempli si sourceType = TEXT (ex. texte integral d'un poeme)
  @Column({ type: 'text', nullable: true })
  textContent: string;

  @Column({ nullable: true })
  durationSeconds: number;

  @Column({ default: 0 })
  playCount: number;

  // Mise en avant editoriale (selection de la semaine), geree par l'admin
  @Column({ default: false })
  isFeatured: boolean;

  @Column({ type: 'varchar', length: 32, default: ModerationStatus.PUBLISHED })
  moderationStatus: ModerationStatus;

  @CreateDateColumn()
  createdAt: Date;
}
