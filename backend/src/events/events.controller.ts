import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ArtistGuard } from '../auth/artist.guard';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // Consultation du calendrier - aucun compte requis
  @Get()
  findUpcoming() {
    return this.eventsService.findUpcoming();
  }

  @Get('past')
  findPast() {
    return this.eventsService.findPast();
  }

  // Rejoindre un live - necessite un compte (visiteur ou artiste), voir JwtAuthGuard
  @UseGuards(JwtAuthGuard)
  @Get(':id/join')
  join(@Param('id') id: string, @Req() req: any) {
    return this.eventsService.getStreamLink(id, req.user);
  }

  // Annoncer un evenement - reserve aux artistes valides
  @UseGuards(JwtAuthGuard, ArtistGuard)
  @Post()
  create(@Body() dto: CreateEventDto, @Req() req: any) {
    return this.eventsService.create(dto, req.user);
  }
}
