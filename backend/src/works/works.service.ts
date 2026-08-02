import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work, WorkType, ModerationStatus } from './entities/work.entity';
import { CreateWorkDto } from './dto/create-work.dto';
import { User } from '../users/entities/user.entity';
import { ActivityService } from '../activity/activity.service';
import { ActivityType } from '../activity/entities/activity-log.entity';

@Injectable()
export class WorksService {
  constructor(
    @InjectRepository(Work) private worksRepo: Repository<Work>,
    private config: ConfigService,
    private activityService: ActivityService,
  ) {}

  async create(dto: CreateWorkDto, artist: User) {
    const work = this.worksRepo.create({ ...dto, artist });
    const saved = await this.worksRepo.save(work);

    await this.activityService.log({
      type: ActivityType.WORK_PUBLISHED,
      message: `${artist.fullName} a publie « ${saved.title} ».`,
      actorId: artist.id,
      actorLabel: artist.fullName,
      subjectUserId: artist.id,
      subjectLabel: saved.title,
      meta: { workId: saved.id, type: saved.type },
    });

    return this.withPublicUrls(saved);
  }

  // Fil principal : plus recent d'abord, filtrable par type (musique/slam/poeme) et ville
  async findAll(params: { type?: WorkType; city?: string }) {
    const works = await this.worksRepo.find({
      where: {
        moderationStatus: ModerationStatus.PUBLISHED,
        ...(params.type ? { type: params.type } : {}),
        ...(params.city ? { city: params.city } : {}),
      },
      relations: ['artist'],
      order: { createdAt: 'DESC' },
    });
    return works.map((w) => this.withPublicUrls(w));
  }

  async findFeatured() {
    const works = await this.worksRepo.find({
      where: { isFeatured: true, moderationStatus: ModerationStatus.PUBLISHED },
      relations: ['artist'],
      order: { createdAt: 'DESC' },
    });
    return works.map((w) => this.withPublicUrls(w));
  }

  async findOne(id: string) {
    const work = await this.worksRepo.findOne({ where: { id }, relations: ['artist'] });
    if (!work || work.moderationStatus === ModerationStatus.REMOVED) {
      throw new NotFoundException('Oeuvre introuvable');
    }
    return this.withPublicUrls(work);
  }

  /** Liste admin : toutes les oeuvres (publiees, signalees, retirees) */
  async findAdminAll(params?: { status?: ModerationStatus; type?: WorkType }) {
    const works = await this.worksRepo.find({
      where: {
        ...(params?.status ? { moderationStatus: params.status } : {}),
        ...(params?.type ? { type: params.type } : {}),
      },
      relations: ['artist'],
      order: { createdAt: 'DESC' },
    });
    return works.map((w) => this.withPublicUrls(w));
  }

  async incrementPlayCount(id: string) {
    await this.worksRepo.increment({ id }, 'playCount', 1);
  }

  // Reserve a l'admin : selection editoriale hebdomadaire
  async setFeatured(id: string, isFeatured: boolean, actorId?: string) {
    const work = await this.worksRepo.findOne({ where: { id }, relations: ['artist'] });
    if (!work) throw new NotFoundException('Oeuvre introuvable');
    if (work.moderationStatus !== ModerationStatus.PUBLISHED && isFeatured) {
      throw new BadRequestException('Seule une oeuvre publiee peut etre mise en avant.');
    }
    const previous = work.isFeatured;
    work.isFeatured = isFeatured;
    const saved = await this.worksRepo.save(work);

    if (previous !== isFeatured) {
      await this.activityService.log({
        type: isFeatured ? ActivityType.WORK_FEATURED : ActivityType.WORK_UNFEATURED,
        message: isFeatured
          ? `« ${saved.title} » a ete mise en avant.`
          : `« ${saved.title} » retiree de la selection.`,
        actorId: actorId ?? null,
        subjectUserId: saved.artist?.id ?? null,
        subjectLabel: saved.title,
        meta: { workId: saved.id },
      });
    }

    return this.withPublicUrls(saved);
  }

  /** Reserve a l'admin : retirer / restaurer une publication */
  async setModerationStatus(
    id: string,
    status: ModerationStatus,
    actorId?: string,
  ) {
    if (
      status !== ModerationStatus.PUBLISHED &&
      status !== ModerationStatus.REMOVED &&
      status !== ModerationStatus.FLAGGED
    ) {
      throw new BadRequestException('Statut de moderation invalide.');
    }

    const work = await this.worksRepo.findOne({ where: { id }, relations: ['artist'] });
    if (!work) throw new NotFoundException('Oeuvre introuvable');

    const previous = work.moderationStatus;
    if (previous === status) return this.withPublicUrls(work);

    work.moderationStatus = status;
    if (status !== ModerationStatus.PUBLISHED) {
      work.isFeatured = false;
    }
    const saved = await this.worksRepo.save(work);

    const artistName = saved.artist?.fullName || 'un artiste';
    if (status === ModerationStatus.REMOVED) {
      await this.activityService.log({
        type: ActivityType.WORK_REMOVED,
        message: `« ${saved.title} » de ${artistName} a ete retiree.`,
        actorId: actorId ?? null,
        subjectUserId: saved.artist?.id ?? null,
        subjectLabel: saved.title,
        meta: { workId: saved.id, from: previous, to: status },
      });
    } else if (status === ModerationStatus.PUBLISHED && previous !== ModerationStatus.PUBLISHED) {
      await this.activityService.log({
        type: ActivityType.WORK_RESTORED,
        message: `« ${saved.title} » de ${artistName} a ete restauree.`,
        actorId: actorId ?? null,
        subjectUserId: saved.artist?.id ?? null,
        subjectLabel: saved.title,
        meta: { workId: saved.id, from: previous, to: status },
      });
    }

    return this.withPublicUrls(saved);
  }

  /** Reecrit localhost → API_PUBLIC_URL pour lecture depuis telephone / LAN */
  private withPublicUrls(work: Work): Work {
    const publicBase =
      this.config.get<string>('API_PUBLIC_URL') ||
      `http://localhost:${this.config.get<string>('PORT') || 3001}`;

    return {
      ...work,
      fileUrl: work.fileUrl ? this.rewriteLocalhost(work.fileUrl, publicBase) : work.fileUrl,
    } as Work;
  }

  private rewriteLocalhost(url: string, publicBase: string): string {
    try {
      const media = new URL(url);
      if (media.hostname !== 'localhost' && media.hostname !== '127.0.0.1') return url;
      const base = new URL(publicBase);
      media.protocol = base.protocol;
      media.hostname = base.hostname;
      media.port = base.port;
      return media.toString();
    } catch {
      return url;
    }
  }
}
