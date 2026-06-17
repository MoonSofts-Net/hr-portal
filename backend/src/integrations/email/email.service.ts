import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ResendIntegration } from '../resend/resend.integration';

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

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly smtpEnabled: boolean;
  private readonly fromEmail: string;
  private transporter: Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly resend: ResendIntegration,
  ) {
    const host = this.config.get<string>('smtp.host');
    this.smtpEnabled =
      this.config.get<boolean>('smtp.enabled', false) && !!host;

    this.fromEmail =
      this.config.get<string>('smtp.fromEmail') ??
      this.config.get<string>('resend.fromEmail', 'Portal RH <admin@hrportal.com>');

    if (this.smtpEnabled && host) {
      const port = this.config.get<number>('smtp.port', 587);
      const user = this.config.get<string>('smtp.user');
      const pass = this.config.get<string>('smtp.pass');

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });

      this.logger.log(`SMTP email ready (${host}:${port})`);
    } else if (this.resend.isEnabled()) {
      this.logger.log('Email via Resend API (SMTP not configured)');
    } else {
      this.logger.warn('No email provider configured — emails will be skipped');
    }
  }

  isEnabled(): boolean {
    return this.smtpEnabled || this.resend.isEnabled();
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    if (!this.isEnabled()) {
      this.logger.debug(
        `Email skipped (no provider): "${params.subject}" → ${recipients.join(', ')}`,
      );
      return { id: null, skipped: true };
    }

    if (this.smtpEnabled && this.transporter) {
      return this.sendViaSmtp(params, recipients);
    }

    return this.resend.send(params);
  }

  private async sendViaSmtp(
    params: SendEmailParams,
    recipients: string[],
  ): Promise<SendEmailResult> {
    try {
      const info = await this.transporter!.sendMail({
        from: this.fromEmail,
        to: recipients.join(', '),
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      this.logger.log(`Email sent (SMTP): "${params.subject}" → ${recipients.join(', ')}`);
      return { id: info.messageId ?? null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`SMTP send failed: ${message}`);
      return { id: null, error: message };
    }
  }
}
