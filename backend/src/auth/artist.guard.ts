import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole, VerificationStatus } from '../users/entities/user.entity';

// A utiliser APRES JwtAuthGuard - verifie que l'utilisateur est un artiste valide
@Injectable()
export class ArtistGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const isVerifiedArtist =
      user?.role === UserRole.ARTIST && user.verificationStatus === VerificationStatus.VERIFIED;
    const isAdmin = user?.role === UserRole.ADMIN;
    if (!isVerifiedArtist && !isAdmin) {
      throw new ForbiddenException('Reserve aux artistes valides par un administrateur');
    }
    return true;
  }
}
