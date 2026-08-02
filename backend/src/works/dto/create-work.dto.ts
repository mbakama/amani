import { IsEnum, IsString, IsOptional, IsUrl } from 'class-validator';
import { WorkType, WorkSourceType } from '../entities/work.entity';

export class CreateWorkDto {
  @IsEnum(WorkType)
  type: WorkType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsEnum(WorkSourceType)
  sourceType: WorkSourceType;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  durationSeconds?: number;
}
