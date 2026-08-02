import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { EventKind } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsEnum(EventKind)
  kind: EventKind;

  @IsString()
  city: string;

  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsString()
  streamUrl?: string;

  @IsOptional()
  @IsString()
  venueAddress?: string;
}
