import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(this.config.get<string>('GOOGLE_CLIENT_ID'));
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    return this.issueToken(user);
  }

  async loginWithGoogle(idToken: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Connexion Google non configuree sur le serveur');
    }

    let payload: {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload() ?? {};
    } catch {
      throw new UnauthorizedException('Jeton Google invalide');
    }

    if (!payload.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Compte Google incomplet ou email non verifie');
    }

    const user = await this.usersService.findOrCreateFromGoogle({
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture,
    });

    return this.issueToken(user);
  }

  /**
   * Demande de reset. Reponse toujours generique (anti-enumeration).
   * Sans SMTP : on renvoie resetToken pour que le front ouvre le formulaire.
   */
  async forgotPassword(email: string) {
    const generic = {
      message:
        'Si un compte existe pour cet email, tu peux reinitialiser ton mot de passe.',
    };

    const user = await this.usersService.findByEmail(email.trim());
    if (!user) return generic;

    if (!user.passwordHash) {
      return {
        message:
          'Ce compte utilise Google. Connecte-toi avec Google, ou contacte un administrateur.',
        googleOnly: true as const,
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 h
    await this.usersService.setPasswordResetToken(user.id, tokenHash, expires);

    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reinitialiser-mot-de-passe?token=${rawToken}`;
    this.logger.log(`Reset password pour ${user.email} : ${resetUrl}`);

    // Pas d'email pour le moment : on renvoie le lien a cliquer
    return {
      message: 'Utilise le lien ci-dessous pour choisir un nouveau mot de passe (valide 1 h).',
      resetToken: rawToken,
      resetUrl,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Lien de reinitialisation invalide');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caracteres');
    }

    const user = await this.requireValidResetToken(token);
    await this.usersService.updatePassword(user.id, newPassword);
    return { message: 'Mot de passe mis a jour. Tu peux te connecter.' };
  }

  /** Verifie le token avant d'afficher le formulaire de reset */
  async verifyResetToken(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Lien de reinitialisation invalide');
    }
    const user = await this.requireValidResetToken(token);
    return {
      valid: true as const,
      email: this.maskEmail(user.email),
      expiresAt: user.passwordResetExpires?.toISOString() ?? null,
    };
  }

  private async requireValidResetToken(token: string) {
    const tokenHash = this.hashResetToken(token.trim());
    const user = await this.usersService.findByValidPasswordResetToken(tokenHash);
    if (!user) {
      throw new BadRequestException('Lien expire ou invalide. Demande un nouveau reset.');
    }
    return user;
  }

  private maskEmail(email: string) {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}***@${domain}`;
  }

  private hashResetToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private issueToken(user: User) {
    const payload = { sub: user.id, role: user.role };
    const publicUser = this.usersService.toPublic(user);
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: publicUser.id,
        fullName: publicUser.fullName,
        role: publicUser.role,
        verificationStatus: publicUser.verificationStatus,
      },
    };
  }
}
