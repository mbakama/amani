import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { ModerationStatus, WorkType } from './entities/work.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ArtistGuard } from '../auth/artist.guard';
import { AdminGuard } from '../auth/admin.guard';

const ALLOWED_EXT = new Set(['.mp3', '.wav', '.mp4', '.m4a', '.ogg', '.webm']);
const MAX_BYTES = 200 * 1024 * 1024; // 200 Mo — cahier des charges

@Controller('works')
export class WorksController {
  constructor(private worksService: WorksService) {}

  // Fil public - aucun compte requis
  @Get()
  findAll(@Query('type') type?: WorkType, @Query('city') city?: string) {
    return this.worksService.findAll({ type, city });
  }

  @Get('featured')
  findFeatured() {
    return this.worksService.findFeatured();
  }

  // Liste admin (toutes moderations) — AVANT :id
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/all')
  findAdminAll(
    @Query('status') status?: ModerationStatus,
    @Query('type') type?: WorkType,
  ) {
    return this.worksService.findAdminAll({ status, type });
  }

  // Upload local (provisoire avant R2) — AVANT :id
  @UseGuards(JwtAuthGuard, ArtistGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.bin';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXT.has(ext)) {
          return cb(
            new BadRequestException('Formats acceptes : MP3, WAV, MP4, M4A, OGG, WEBM') as any,
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fichier requis');
    const base =
      process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;
    return { fileUrl: `${base}/uploads/${file.filename}`, fileName: file.originalname };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worksService.findOne(id);
  }

  @Post(':id/play')
  registerPlay(@Param('id') id: string) {
    return this.worksService.incrementPlayCount(id);
  }

  // Publication reservee aux artistes valides
  @UseGuards(JwtAuthGuard, ArtistGuard)
  @Post()
  create(@Body() dto: CreateWorkDto, @Req() req: any) {
    return this.worksService.create(dto, req.user);
  }

  // Selection editoriale - reservee a l'admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/feature')
  setFeatured(
    @Param('id') id: string,
    @Body('isFeatured') isFeatured: boolean,
    @Req() req: { user: { id: string } },
  ) {
    return this.worksService.setFeatured(id, isFeatured, req.user.id);
  }

  // Moderation (retirer / restaurer) - reservee a l'admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/moderation')
  setModeration(
    @Param('id') id: string,
    @Body('status') status: ModerationStatus,
    @Req() req: { user: { id: string } },
  ) {
    return this.worksService.setModerationStatus(id, status, req.user.id);
  }
}
