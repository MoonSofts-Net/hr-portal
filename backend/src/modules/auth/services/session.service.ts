import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  createSessionId(): string {
    return randomUUID();
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async persistRefreshToken(params: {
    tenantId: string;
    userId: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        tokenHash: this.hashToken(params.refreshToken),
        expiresAt: params.expiresAt,
      },
    });
  }

  async assertRefreshTokenValid(refreshToken: string): Promise<void> {
    const hash = this.hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const hash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
