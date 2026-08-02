import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Verifie qu'un token JWT valide est present - suffisant pour les visiteurs inscrits
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
