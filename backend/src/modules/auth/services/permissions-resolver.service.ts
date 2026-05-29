import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  ALL_PERMISSION_IDS,
  isWildcardPermission,
  SUPER_ADMIN_WILDCARD,
} from '../../../security/permissions/permission-catalog';

@Injectable()
export class PermissionsResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveForRole(roleId: string): Promise<string[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { rolePermissions: { select: { permissionId: true } } },
    });

    if (!role) return [];

    if (role.isSystem && role.isGlobal) {
      return [SUPER_ADMIN_WILDCARD, ...ALL_PERMISSION_IDS];
    }

    return role.rolePermissions.map((rp) => rp.permissionId);
  }

  hasAny(required: string[], granted: string[]): boolean {
    if (isWildcardPermission(granted)) return true;
    return required.some((p) => granted.includes(p));
  }

  hasAll(required: string[], granted: string[]): boolean {
    if (isWildcardPermission(granted)) return true;
    return required.every((p) => granted.includes(p));
  }
}
