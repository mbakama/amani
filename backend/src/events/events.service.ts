import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, LessThan, Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../users/entities/user.entity';

const LIVE_BEFORE_MS = 30 * 60 * 1000; // 30 min avant
const LIVE_AFTER_MS = 3 * 60 * 60 * 1000; // 3 h apres

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventsRepo: Repository<Event>,
    private config: ConfigService,
  ) {}

  async create(dto: CreateEventDto, organizer: User) {
    const event = this.eventsRepo.create({ ...dto, organizer });
    const saved = await this.eventsRepo.save(event);
    const full = await this.eventsRepo.findOne({
      where: { id: saved.id },
      relations: ['organizer'],
    });
    return this.toPublic(full!);
  }

  /** Fin de la fenêtre utile d'un événement (début + 3 h). */
  private relevanceCutoff() {
    return new Date(Date.now() - LIVE_AFTER_MS);
  }

  // Liste publique - visible sans compte, mais sans le lien de diffusion
  async findUpcoming() {
    const events = await this.eventsRepo.find({
      where: { startsAt: MoreThanOrEqual(this.relevanceCutoff()) },
      relations: ['organizer'],
      order: { startsAt: 'ASC' },
    });
    return events.map((e) => this.toPublic(e));
  }

  async findPast() {
    const events = await this.eventsRepo.find({
      where: { startsAt: LessThan(this.relevanceCutoff()) },
      relations: ['organizer'],
      order: { startsAt: 'DESC' },
    });
    return events.map((e) => this.toPublic(e));
  }

  // Rejoindre un live : necessite un compte (visiteur ou artiste)
  async getStreamLink(id: string, user: User) {
    if (!user) throw new ForbiddenException('Une inscription est requise pour rejoindre un live');

    const event = await this.eventsRepo.findOne({ where: { id }, relations: ['organizer'] });
    if (!event) throw new NotFoundException('Evenement introuvable');

    if (!event.streamUrl?.trim()) {
      throw new BadRequestException('Pas de lien de diffusion pour cet evenement');
    }

    return {
      streamUrl: this.rewriteLocalhost(event.streamUrl),
      title: event.title,
      kind: event.kind,
    };
  }

  private computeIsLiveNow(event: Event): boolean {
    const start = new Date(event.startsAt).getTime();
    if (Number.isNaN(start)) return false;
    const now = Date.now();
    // Un événement passé ne reste jamais "en direct", même si le flag DB est coincé.
    if (now > start + LIVE_AFTER_MS) return false;
    if (event.isLiveNow) return true;
    return now >= start - LIVE_BEFORE_MS;
  }

  private toPublic(event: Event) {
    return {
      id: event.id,
      title: event.title,
      kind: event.kind,
      city: event.city,
      startsAt: event.startsAt,
      venueAddress: event.venueAddress ?? null,
      isLiveNow: this.computeIsLiveNow(event),
      organizer: event.organizer
        ? { id: event.organizer.id, fullName: event.organizer.fullName }
        : { fullName: 'Organisateur' },
      createdAt: event.createdAt,
    };
  }

  private rewriteLocalhost(url: string): string {
    const publicBase =
      this.config.get<string>('API_PUBLIC_URL') ||
      `http://localhost:${this.config.get<string>('PORT') || 3001}`;
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
