import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // Exécuter toutes les 10 minutes pour vérifier les rappels dus
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleRemindersCron() {
    this.logger.debug('Running reminders check...');
    try {
      const result = await this.notificationsService.sendDueReminders();
      if (result.sent > 0 || result.failed > 0) {
        this.logger.log(
          `Reminders: ${result.sent} sent, ${result.failed} failed`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send reminders: ${error.message}`, error.stack);
    }
  }

  // Nettoyer les subscriptions expirées toutes les heures
  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanupCron() {
    this.logger.debug('Running subscription cleanup...');
    try {
      await this.notificationsService.cleanupExpiredSubscriptions();
    } catch (error) {
      this.logger.error(`Failed to cleanup subscriptions: ${error.message}`, error.stack);
    }
  }
}
