import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  id: string | null;
  skipped?: boolean;
  error?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

@Injectable()
export class ResendIntegration {
  private readonly logger = new Logger(ResendIntegration.name);
  private readonly apiKey: string | undefined;
  private readonly fromEmail: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('resend.apiKey');
    this.fromEmail = this.config.get<string>(
      'resend.fromEmail',
      'Portal RH <yuji@moonsofts.net>',
    );
    this.enabled = this.config.get<boolean>('resend.enabled', false);

    if (this.enabled && !this.apiKey) {
      this.logger.warn('RESEND_ENABLED but RESEND_API_KEY is missing — emails will be skipped');
    } else if (this.enabled && this.apiKey) {
      this.logger.log('Resend email integration ready');
    }
  }

  isEnabled(): boolean {
    return this.enabled && !!this.apiKey;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    if (!this.isEnabled()) {
      this.logger.debug(
        `Email skipped (Resend disabled): "${params.subject}" → ${recipients.join(', ')}`,
      );
      return { id: null, skipped: true };
    }

    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: recipients,
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
        name?: string;
      };

      if (!response.ok) {
        const message = payload.message ?? payload.name ?? `HTTP ${response.status}`;
        this.logger.error(`Resend API error: ${message}`);
        return { id: null, error: message };
      }

      this.logger.log(`Email sent: "${params.subject}" → ${recipients.join(', ')}`);
      return { id: payload.id ?? null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email: ${message}`);
      return { id: null, error: message };
    }
  }
}
