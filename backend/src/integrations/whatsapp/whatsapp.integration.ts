import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** WhatsApp Business API — placeholder */
@Injectable()
export class WhatsappIntegration {
  private readonly logger = new Logger(WhatsappIntegration.name);

  constructor(private config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('integrations.whatsapp.enabled', false);
  }

  async sendTemplateMessage(_to: string, _template: string, _params: string[]): Promise<void> {
    this.logger.warn('WhatsApp integration not configured');
  }
}
