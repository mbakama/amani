import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, VerificationStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActivityService } from '../activity/activity.service';
import { ActivityType } from '../activity/entities/activity-log.entity';

export type PublicUser = Omit<
  User,
  'passwordHash' | 'passwordResetToken' | 'passwordResetExpires'
>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private activityService: ActivityService,
  ) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Un compte existe deja avec cet email');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = dto.role === 'artist' ? UserRole.ARTIST : UserRole.VISITOR;

    const user = this.usersRepo.create({
      email: dto.email,
      fullName: dto.fullName,
      city: dto.city,
      discipline: dto.discipline,
      verificationReference: dto.verificationReference,
      passwordHash,
      role,
      verificationStatus:
        role === UserRole.ARTIST ? VerificationStatus.PENDING : VerificationStatus.VERIFIED,
    });
    const saved = await this.usersRepo.save(user);

    if (role === UserRole.ARTIST) {
      await this.activityService.log({
        type: ActivityType.ARTIST_REGISTERED,
        message: `Nouvelle demande soumise par ${saved.fullName}.`,
        actorId: saved.id,
        actorLabel: saved.fullName,
        subjectUserId: saved.id,
        subjectLabel: saved.fullName,
        meta: { email: saved.email, discipline: saved.discipline ?? null },
      });
    }

    return this.toPublic(saved);
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  findByGoogleId(googleId: string) {
    return this.usersRepo.findOne({ where: { googleId } });
  }

  async findOrCreateFromGoogle(profile: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }): Promise<User> {
    let user = await this.findByGoogleId(profile.googleId);
    if (user) return user;

    user = await this.findByEmail(profile.email);
    if (user) {
      user.googleId = profile.googleId;
      if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
      return this.usersRepo.save(user);
    }

    const created = this.usersRepo.create({
      email: profile.email,
      fullName: profile.fullName,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl ?? null,
      passwordHash: null,
      role: UserRole.VISITOR,
      verificationStatus: VerificationStatus.VERIFIED,
    });
    return this.usersRepo.save(created);
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id }, relations: ['works'] });
  }

  async getPublicProfile(id: string): Promise<PublicUser> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return this.toPublic(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (dto.email && dto.email !== user.email) {
      const taken = await this.findByEmail(dto.email);
      if (taken) throw new ConflictException('Un compte existe deja avec cet email');
      user.email = dto.email;
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();
    if (dto.city !== undefined) user.city = dto.city.trim() || null;
    if (dto.bio !== undefined) user.bio = dto.bio.trim() || null;
    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl.trim() || null;
    }
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const saved = await this.usersRepo.save(user);
    return this.toPublic(saved);
  }

  async findPendingArtists() {
    return this.findAdminArtists(VerificationStatus.PENDING);
  }

  async findAdminArtists(status?: VerificationStatus) {
    const users = await this.usersRepo.find({
      where: {
        role: UserRole.ARTIST,
        ...(status ? { verificationStatus: status } : {}),
      },
      order: { createdAt: 'DESC' },
    });
    return users.map((u) => this.toPublic(u));
  }

  async setVerificationStatus(id: string, status: VerificationStatus, actorId?: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role !== UserRole.ARTIST) {
      throw new BadRequestException('Seuls les comptes artistes peuvent etre verifies');
    }

    const previous = user.verificationStatus;
    if (previous === status) return this.toPublic(user);

    // Pas de retour en "pending" : une fois traite, on valide, refuse ou bloque.
    const allowed: Record<VerificationStatus, VerificationStatus[]> = {
      [VerificationStatus.PENDING]: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
      [VerificationStatus.VERIFIED]: [VerificationStatus.BLOCKED],
      [VerificationStatus.REJECTED]: [VerificationStatus.VERIFIED],
      [VerificationStatus.BLOCKED]: [VerificationStatus.VERIFIED],
    };

    if (!allowed[previous]?.includes(status)) {
      throw new BadRequestException(
        `Transition impossible de « ${previous} » vers « ${status} ».`,
      );
    }

    user.verificationStatus = status;
    const saved = await this.usersRepo.save(user);

    let type = ActivityType.ARTIST_VERIFIED;
    let message = `${saved.fullName} a ete valide.`;
    if (status === VerificationStatus.REJECTED) {
      type = ActivityType.ARTIST_REJECTED;
      message = `${saved.fullName} a ete refuse.`;
    } else if (status === VerificationStatus.BLOCKED) {
      type = ActivityType.ARTIST_BLOCKED;
      message = `${saved.fullName} a ete bloque.`;
    } else if (previous === VerificationStatus.BLOCKED && status === VerificationStatus.VERIFIED) {
      type = ActivityType.ARTIST_UNBLOCKED;
      message = `${saved.fullName} a ete debloque.`;
    }

    await this.activityService.log({
      type,
      message,
      actorId: actorId ?? null,
      subjectUserId: saved.id,
      subjectLabel: saved.fullName,
      meta: { from: previous, to: status },
    });

    return this.toPublic(saved);
  }

  async ensureBootstrapAdmin(email: string, password: string, fullName = 'Administrateur Amani') {
    const existing = await this.findByEmail(email);
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      existing.role = UserRole.ADMIN;
      existing.verificationStatus = VerificationStatus.VERIFIED;
      existing.passwordHash = passwordHash;
      existing.fullName = existing.fullName || fullName;
      return this.toPublic(await this.usersRepo.save(existing));
    }

    const admin = this.usersRepo.create({
      email,
      fullName,
      passwordHash,
      role: UserRole.ADMIN,
      verificationStatus: VerificationStatus.VERIFIED,
      googleId: null,
    });
    return this.toPublic(await this.usersRepo.save(admin));
  }

  findArtists(city?: string) {
    return this.usersRepo.find({
      where: {
        role: UserRole.ARTIST,
        verificationStatus: VerificationStatus.VERIFIED,
        ...(city ? { city } : {}),
      },
    }).then((users) => users.map((u) => this.toPublic(u)));
  }

  toPublic(user: User): PublicUser {
    const {
      passwordHash: _ph,
      passwordResetToken: _rt,
      passwordResetExpires: _re,
      ...safe
    } = user;
    return safe;
  }

  async setPasswordResetToken(userId: string, tokenHash: string, expires: Date) {
    await this.usersRepo.update(userId, {
      passwordResetToken: tokenHash,
      passwordResetExpires: expires,
    });
  }

  async clearPasswordReset(userId: string) {
    await this.usersRepo.update(userId, {
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async findByValidPasswordResetToken(tokenHash: string): Promise<User | null> {
    const user = await this.usersRepo.findOne({
      where: { passwordResetToken: tokenHash },
    });
    if (!user?.passwordResetExpires) return null;
    if (user.passwordResetExpires.getTime() < Date.now()) return null;
    return user;
  }

  async updatePassword(userId: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    await this.usersRepo.update(userId, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }
}
