import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Active Directory / LDAP — placeholder */
@Injectable()
export class ActiveDirectoryIntegration {
  private readonly logger = new Logger(ActiveDirectoryIntegration.name);

  constructor(private config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('integrations.activeDirectory.enabled', false);
  }

  async authenticate(_username: string, _password: string): Promise<boolean> {
    this.logger.warn('Active Directory integration not configured');
    return false;
  }
}
