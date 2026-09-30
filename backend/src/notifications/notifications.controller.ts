import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';
import { ToggleReminderDto } from './dto/toggle-reminder.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    const publicKey = this.notificationsService.getVapidPublicKey();
    return { publicKey };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Request() req: any, @Body() dto: SubscribeDto) {
    const subscription = await this.notificationsService.subscribe(
      req.user.userId,
      dto,
    );
    return { success: true, id: subscription.id };
  }

  @Delete('subscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(@Request() req: any, @Body() dto: UnsubscribeDto) {
    const result = await this.notificationsService.unsubscribe(
      req.user.userId,
      dto,
    );
    return { success: true, ...result };
  }

  @Post('reminders/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleReminder(@Request() req: any, @Body() dto: ToggleReminderDto) {
    const result = await this.notificationsService.setReminder(
      req.user.userId,
      dto.eventId,
      dto.enabled,
    );
    return { success: true, result };
  }

  @Get('reminders')
  @UseGuards(JwtAuthGuard)
  async getUserReminders(@Request() req: any) {
    const eventIds = await this.notificationsService.getUserReminders(
      req.user.userId,
    );
    return { eventIds };
  }
}
