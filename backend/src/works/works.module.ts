import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Work } from './entities/work.entity';
import { WorksService } from './works.service';
import { WorksController } from './works.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [TypeOrmModule.forFeature([Work]), ActivityModule],
  controllers: [WorksController],
  providers: [WorksService],
})
export class WorksModule {}
