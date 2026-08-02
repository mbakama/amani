import { IsEmail, IsOptional, IsString, IsUrl, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== '' && v != null)
  @IsUrl({ require_tld: false })
  avatarUrl?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== '' && v != null)
  @IsString()
  @MinLength(8)
  password?: string;
}
