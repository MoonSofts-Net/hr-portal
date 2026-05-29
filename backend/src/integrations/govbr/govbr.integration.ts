import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** GOV.BR SSO — placeholder for future OAuth2/OIDC integration */
@Injectable()
export class GovBrIntegration {
  private readonly logger = new Logger(GovBrIntegration.name);

  constructor(private config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('integrations.govbr.enabled', false);
  }

  getAuthorizationUrl(_state: string): string {
    this.logger.warn('GOV.BR integration not configured');
    throw new Error('GOV.BR integration is disabled');
  }
}
