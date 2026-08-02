import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityType } from './entities/activity-log.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/recent')
  listRecent(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 20;
    return this.activityService.findRecent(Number.isFinite(parsed) ? parsed : 20);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin')
  listAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('q') q?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedSize = pageSize ? parseInt(pageSize, 10) : 25;
    const allowedType =
      type === 'artists' ||
      type === 'works' ||
      type === 'all' ||
      (type && Object.values(ActivityType).includes(type as ActivityType))
        ? (type as ActivityType | 'artists' | 'works' | 'all')
        : 'all';

    return this.activityService.findAll({
      page: Number.isFinite(parsedPage) ? parsedPage : 1,
      pageSize: Number.isFinite(parsedSize) ? parsedSize : 25,
      type: allowedType,
      q,
    });
  }
}
