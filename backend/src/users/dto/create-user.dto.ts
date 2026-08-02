import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  fullName: string;

  // 'visitor' (par defaut) ou 'artist' - une demande d'artiste declenche une verification admin
  @IsOptional()
  @IsIn(['visitor', 'artist'])
  role?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  discipline?: string;

  @IsOptional()
  @IsString()
  verificationReference?: string;
}
