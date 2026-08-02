import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, Req } from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerificationStatus } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

class VerifyArtistDto {
  @IsString()
  @IsIn(['verified', 'rejected', 'blocked'])
  status: VerificationStatus;
}

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get('artists')
  listArtists(@Query('city') city?: string) {
    return this.usersService.findArtists(city);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: { user: { id: string } }) {
    return this.usersService.getPublicProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: { user: { id: string } }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  // --- Admin (AVANT :id pour ne pas capturer "admin" comme uuid) ---

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/pending-artists')
  listPending() {
    return this.usersService.findPendingArtists();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/artists')
  listAdminArtists(@Query('status') status?: VerificationStatus) {
    const allowed = Object.values(VerificationStatus) as string[];
    const filter = status && allowed.includes(status) ? status : undefined;
    return this.usersService.findAdminArtists(filter);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/:id/verify')
  verify(
    @Param('id') id: string,
    @Body() body: VerifyArtistDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.usersService.setVerificationStatus(id, body.status, req.user.id);
  }

  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
