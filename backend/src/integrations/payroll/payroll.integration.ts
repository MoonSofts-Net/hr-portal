import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Payroll / eSocial ERP — placeholder for point mirror sync */
@Injectable()
export class PayrollIntegration {
  private readonly logger = new Logger(PayrollIntegration.name);

  constructor(private config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('integrations.payroll.enabled', false);
  }

  async fetchPointMirror(_tenantId: string, _userId: string, _from: Date, _to: Date): Promise<unknown[]> {
    this.logger.warn('Payroll integration not configured');
    return [];
  }
}
