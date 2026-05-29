import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  JwtAccessPayload,
  JwtPasswordResetPayload,
  JwtPayload,
  JwtRefreshPayload,
  isAccessPayload,
} from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signAccessToken(payload: Omit<JwtAccessPayload, 'type'>): Promise<string> {
    return this.jwt.signAsync(
      { ...payload, type: 'access' },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
      },
    );
  }

  async signRefreshToken(payload: Omit<JwtRefreshPayload, 'type'>): Promise<string> {
    return this.jwt.signAsync(
      { ...payload, type: 'refresh' },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
      },
    );
  }

  async signPasswordResetToken(
    payload: Omit<JwtPasswordResetPayload, 'type'>,
  ): Promise<string> {
    return this.jwt.signAsync(
      { ...payload, type: 'password_reset' },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: '1h',
      },
    );
  }

  async verifyAccessToken(token: string): Promise<JwtAccessPayload> {
    const payload = await this.verify<JwtPayload>(token, 'access');
    if (!isAccessPayload(payload)) {
      throw new UnauthorizedException('Invalid access token');
    }
    return payload;
  }

  async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.config.get<string>('jwt.refreshSecret'),
    });
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return payload as JwtRefreshPayload;
  }

  async verifyPasswordResetToken(token: string): Promise<JwtPasswordResetPayload> {
    const payload = await this.verify<JwtPayload>(token, 'password_reset');
    if (payload.type !== 'password_reset') {
      throw new UnauthorizedException('Invalid reset token');
    }
    return payload as JwtPasswordResetPayload;
  }

  getAccessExpiresInSeconds(): number {
    const raw = this.config.get<string>('jwt.accessExpiresIn', '15m');
    return parseExpiresIn(raw);
  }

  private async verify<T extends object>(token: string, expectedType: string): Promise<T> {
    try {
      const payload = await this.jwt.verifyAsync<T>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      if ((payload as { type?: string }).type !== expectedType) {
        throw new UnauthorizedException('Invalid token type');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

function parseExpiresIn(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return 900;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * (multipliers[unit] ?? 60);
}
