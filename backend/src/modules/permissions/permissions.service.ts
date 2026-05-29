import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ok } from '../../common/utils/api-response.util';
import { PERMISSION_CATALOG } from '../../security/permissions/permission-catalog';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const dbPermissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    if (dbPermissions.length === 0) {
      return ok(PERMISSION_CATALOG);
    }

    return ok(dbPermissions);
  }
}
