import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import * as webPush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';
import { EventReminder } from './entities/event-reminder.entity';
import { Event } from '../events/entities/event.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidConfigured = false;

  constructor(
    @InjectRepository(PushSubscription)
    private pushSubRepo: Repository<PushSubscription>,
    @InjectRepository(EventReminder)
    private reminderRepo: Repository<EventReminder>,
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
  ) {
    this.configureVapid();
  }

  private configureVapid() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL || 'mailto:admin@amani.local';

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID keys not configured. Web push notifications will not work. ' +
          'Generate keys with: npx web-push generate-vapid-keys',
      );
      return;
    }

    webPush.setVapidDetails(email, publicKey, privateKey);
    this.vapidConfigured = true;
    this.logger.log('VAPID configured successfully');
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const existing = await this.pushSubRepo.findOne({
      where: { userId, endpoint: dto.endpoint },
    });

    if (existing) {
      existing.p256dh = dto.p256dh;
      existing.auth = dto.auth;
      existing.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
      return this.pushSubRepo.save(existing);
    }

    const subscription = this.pushSubRepo.create({
      userId,
      endpoint: dto.endpoint,
      p256dh: dto.p256dh,
      auth: dto.auth,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    return this.pushSubRepo.save(subscription);
  }

  async unsubscribe(userId: string, dto: UnsubscribeDto) {
    const result = await this.pushSubRepo.delete({
      userId,
      endpoint: dto.endpoint,
    });
    return { deleted: result.affected ?? 0 };
  }

  async setReminder(userId: string, eventId: string, enabled: boolean) {
    if (enabled) {
      const existing = await this.reminderRepo.findOne({
        where: { userId, eventId },
      });

      if (existing) {
        return existing;
      }

      const reminder = this.reminderRepo.create({ userId, eventId });
      return this.reminderRepo.save(reminder);
    } else {
      await this.reminderRepo.delete({ userId, eventId });
      return { deleted: true };
    }
  }

  async getUserReminders(userId: string): Promise<string[]> {
    const reminders = await this.reminderRepo.find({
      where: { userId },
      select: ['eventId'],
    });
    return reminders.map((r) => r.eventId);
  }

  async sendDueReminders() {
    if (!this.vapidConfigured) {
      this.logger.warn('Cannot send push notifications: VAPID not configured');
      return { sent: 0, failed: 0 };
    }

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Trouver les événements qui commencent dans ~1h (entre 50 et 70 minutes)
    const lowerBound = new Date(now.getTime() + 50 * 60 * 1000);
    const upperBound = new Date(now.getTime() + 70 * 60 * 1000);

    const upcomingEvents = await this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('event.startsAt >= :lower', { lower: lowerBound })
      .andWhere('event.startsAt <= :upper', { upper: upperBound })
      .getMany();

    if (upcomingEvents.length === 0) {
      this.logger.debug('No events starting in the next hour');
      return { sent: 0, failed: 0 };
    }

    this.logger.log(`Found ${upcomingEvents.length} events starting soon`);

    let sent = 0;
    let failed = 0;

    for (const event of upcomingEvents) {
      const reminders = await this.reminderRepo.find({
        where: { eventId: event.id, sent: false },
        relations: ['user'],
      });

      this.logger.debug(
        `Event "${event.title}": ${reminders.length} pending reminders`,
      );

      for (const reminder of reminders) {
        const subscriptions = await this.pushSubRepo.find({
          where: { userId: reminder.userId },
        });

        if (subscriptions.length === 0) {
          this.logger.debug(
            `User ${reminder.userId} has no push subscriptions`,
          );
          continue;
        }

        const payload = JSON.stringify({
          title: 'Rappel événement — Amani',
          body: `"${event.title}" commence dans 1 heure`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: {
            eventId: event.id,
            url: `/evenements`,
          },
        });

        for (const sub of subscriptions) {
          try {
            await webPush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload,
            );
            sent++;
          } catch (error: any) {
            failed++;
            this.logger.warn(
              `Failed to send notification to ${sub.endpoint.substring(0, 50)}...: ${error.message}`,
            );

            // Nettoyer les subscriptions expirées (410) ou invalides (404)
            if (error.statusCode === 410 || error.statusCode === 404) {
              await this.pushSubRepo.delete(sub.id);
              this.logger.log(`Deleted expired subscription ${sub.id}`);
            }
          }
        }

        // Marquer le rappel comme envoyé
        reminder.sent = true;
        reminder.sentAt = new Date();
        await this.reminderRepo.save(reminder);
      }
    }

    this.logger.log(
      `Reminder job completed: ${sent} sent, ${failed} failed`,
    );
    return { sent, failed };
  }

  async cleanupExpiredSubscriptions() {
    const result = await this.pushSubRepo.delete({
      expiresAt: LessThan(new Date()),
    });
    const deleted = result.affected ?? 0;
    if (deleted > 0) {
      this.logger.log(`Cleaned up ${deleted} expired subscriptions`);
    }
    return { deleted };
  }

  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }
}
