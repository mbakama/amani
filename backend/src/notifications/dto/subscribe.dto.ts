import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class SubscribeDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
