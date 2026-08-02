import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ActivityLog, ActivityType } from './entities/activity-log.entity';
import { User } from '../users/entities/user.entity';

export type CreateActivityInput = {
  type: ActivityType;
  message: string;
  actorId?: string | null;
  actorLabel?: string | null;
  subjectUserId?: string | null;
  subjectLabel?: string | null;
  meta?: Record<string, unknown> | null;
};

export type ActivityLogDto = ActivityLog & {
  actorLabel: string | null;
};

export type ActivityListParams = {
  page?: number;
  pageSize?: number;
  type?: ActivityType | 'artists' | 'works' | 'all';
  q?: string;
};

export type ActivityListResult = {
  items: ActivityLogDto[];
  total: number;
  page: number;
  pageSize: number;
};

const ARTIST_TYPES: ActivityType[] = [
  ActivityType.ARTIST_REGISTERED,
  ActivityType.ARTIST_VERIFIED,
  ActivityType.ARTIST_REJECTED,
  ActivityType.ARTIST_BLOCKED,
  ActivityType.ARTIST_UNBLOCKED,
];

const WORK_TYPES: ActivityType[] = [
  ActivityType.WORK_PUBLISHED,
  ActivityType.WORK_FEATURED,
  ActivityType.WORK_UNFEATURED,
  ActivityType.WORK_REMOVED,
  ActivityType.WORK_RESTORED,
];

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog) private activityRepo: Repository<ActivityLog>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async log(input: CreateActivityInput): Promise<ActivityLog> {
    let actorLabel = input.actorLabel ?? null;
    if (!actorLabel && input.actorId) {
      const actor = await this.usersRepo.findOne({
        where: { id: input.actorId },
        select: ['id', 'fullName'],
      });
      actorLabel = actor?.fullName ?? null;
    }

    const row = this.activityRepo.create({
      type: input.type,
      message: input.message,
      actorId: input.actorId ?? null,
      actorLabel,
      subjectUserId: input.subjectUserId ?? null,
      subjectLabel: input.subjectLabel ?? null,
      meta: input.meta ?? null,
    });
    return this.activityRepo.save(row);
  }

  async findRecent(limit = 20): Promise<ActivityLogDto[]> {
    const take = Math.min(Math.max(limit, 1), 100);
    const logs = await this.activityRepo.find({
      order: { createdAt: 'DESC' },
      take,
    });
    return this.withActorLabels(logs);
  }

  async findAll(params: ActivityListParams = {}): Promise<ActivityListResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? 25, 1), 100);
    const q = params.q?.trim();

    const qb = this.activityRepo.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');

    if (params.type === 'artists') {
      qb.andWhere('log.type IN (:...types)', { types: ARTIST_TYPES });
    } else if (params.type === 'works') {
      qb.andWhere('log.type IN (:...types)', { types: WORK_TYPES });
    } else if (params.type && params.type !== 'all') {
      qb.andWhere('log.type = :type', { type: params.type });
    }

    if (q) {
      qb.andWhere(
        '(log.message ILIKE :q OR log.actorLabel ILIKE :q OR log.subjectLabel ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    const [logs, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: await this.withActorLabels(logs),
      total,
      page,
      pageSize,
    };
  }

  private async withActorLabels(logs: ActivityLog[]): Promise<ActivityLogDto[]> {
    const missingActorIds = [
      ...new Set(
        logs
          .filter((l) => l.actorId && !l.actorLabel)
          .map((l) => l.actorId as string),
      ),
    ];

    const actors =
      missingActorIds.length > 0
        ? await this.usersRepo.find({
            where: { id: In(missingActorIds) },
            select: ['id', 'fullName'],
          })
        : [];
    const actorNames = new Map(actors.map((u) => [u.id, u.fullName]));

    return logs.map((log) => {
      let actorLabel = log.actorLabel;
      if (!actorLabel && log.actorId) {
        actorLabel = actorNames.get(log.actorId) ?? null;
      }
      // Inscription : l'auteur est l'artiste lui-meme
      if (!actorLabel && log.type === ActivityType.ARTIST_REGISTERED) {
        actorLabel = log.subjectLabel;
      }
      return { ...log, actorLabel };
    });
  }
}
