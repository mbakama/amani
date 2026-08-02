import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

// A utiliser APRES JwtAuthGuard
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Reserve a l administrateur');
    }
    return true;
  }
}
