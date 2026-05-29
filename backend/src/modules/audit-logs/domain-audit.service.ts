import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, PermissionModule, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { maskSensitiveMetadata } from '../../security/sensitive-data.util';
import { AuditEventDefinition, AuditEventKey, AuditEvents } from './audit-event.catalog';

export interface AuditRecordParams {
  tenantId: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: AuditAction;
  module?: PermissionModule;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

export interface RequestAuditContext {
  ipAddress?: string;
  userAgent?: string;
}

/** @deprecated Use recordEvent — kept for gradual migration */
export interface DomainAuditParams {
  tenantId: string;
  userId: string;
  action: AuditAction;
  module?: PermissionModule;
  resource?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
  targetUserId?: string;
}

@Injectable()
export class DomainAuditService {
  private readonly logger = new Logger(DomainAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(
    eventKey: AuditEventKey,
    params: Omit<AuditRecordParams, 'action' | 'module' | 'entityType'> & {
      entityId?: string;
      metadata?: Prisma.InputJsonValue;
    },
  ): Promise<void> {
    const def = AuditEvents[eventKey];
    return this.record({
      ...params,
      action: def.action,
      module: def.module,
      entityType: def.entityType,
      entityId: params.entityId,
    });
  }

  async record(params: AuditRecordParams): Promise<void> {
    try {
      const safeMetadata = params.metadata
        ? (maskSensitiveMetadata(params.metadata) as Prisma.InputJsonValue)
        : undefined;

      await this.prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          actorUserId: params.actorUserId ?? null,
          targetUserId: params.targetUserId ?? null,
          module: params.module,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: safeMetadata,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      this.logger.error('Failed to write audit log', err);
    }
  }

  /** Legacy adapter */
  async log(params: DomainAuditParams): Promise<void> {
    const parsed = this.parseResource(params.resource);
    return this.record({
      tenantId: params.tenantId,
      actorUserId: params.userId,
      targetUserId: params.targetUserId,
      action: params.action,
      module: params.module,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  onboardingResource(processId: string): string {
    return `onboarding:${processId}`;
  }

  hrRequestResource(requestId: string): string {
    return `hr_request:${requestId}`;
  }

  pointAdjustmentResource(id: string): string {
    return `point_adjustment:${id}`;
  }

  documentResource(documentId: string): string {
    return `document:${documentId}`;
  }

  private parseResource(resource?: string): { entityType?: string; entityId?: string } {
    if (!resource) return {};
    const idx = resource.indexOf(':');
    if (idx === -1) return { entityType: resource };
    return {
      entityType: resource.slice(0, idx),
      entityId: resource.slice(idx + 1),
    };
  }
}
