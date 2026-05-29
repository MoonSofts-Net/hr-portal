import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Sets PostgreSQL session variable for RLS policies (call per request) */
  async setTenantContext(tenantId: string): Promise<void> {
    await this.$executeRawUnsafe(
      `SELECT set_config('app.current_tenant_id', $1, true)`,
      tenantId,
    );
  }

  async setSuperAdminContext(isSuperAdmin: boolean): Promise<void> {
    await this.$executeRawUnsafe(
      `SELECT set_config('app.is_super_admin', $1, true)`,
      isSuperAdmin ? 'true' : 'false',
    );
  }
}
