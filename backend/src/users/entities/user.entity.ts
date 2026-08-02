import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Work } from '../../works/entities/work.entity';

export enum UserRole {
  VISITOR = 'visitor',   // inscription legere, pour rejoindre les lives
  ARTIST = 'artist',     // musicien / slameur / poete, compte valide par un admin
  ADMIN = 'admin',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // Nullable : comptes crees via Google n'ont pas de mot de passe local
  @Column({ nullable: true })
  passwordHash: string | null;

  // Identifiant Google (sub) — present si connexion via Google
  @Column({ nullable: true, unique: true })
  googleId: string | null;

  @Column()
  fullName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VISITOR })
  role: UserRole;

  // Champs specifiques aux artistes
  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  discipline: string; // ex: "guitariste", "slameur", "poete"

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  // Reset mot de passe (hash du token + expiration)
  @Column({ type: 'varchar', length: 128, nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpires: Date | null;

  // Verification communautaire (preuve d'appartenance baha'ie)
  // varchar : evite les galeres de sync des enums Postgres
  @Column({ type: 'varchar', length: 32, default: VerificationStatus.PENDING })
  verificationStatus: VerificationStatus;

  @Column({ type: 'text', nullable: true })
  verificationReference: string; // ex: communaute/assemblee locale, contact de reference

  @OneToMany(() => Work, (work) => work.artist)
  works: Work[];

  @CreateDateColumn()
  createdAt: Date;
}
