import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private usersService: UsersService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;

    const admin = await this.usersService.ensureBootstrapAdmin(
      email,
      password,
      this.config.get<string>('ADMIN_NAME') || 'Administrateur Amani',
    );
    this.logger.log(`Compte admin pret : ${admin.email}`);
  }
}
