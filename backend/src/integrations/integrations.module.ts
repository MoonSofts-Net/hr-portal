import { Module } from '@nestjs/common';
import { GovBrIntegration } from './govbr/govbr.integration';
import { WhatsappIntegration } from './whatsapp/whatsapp.integration';
import { PayrollIntegration } from './payroll/payroll.integration';
import { ActiveDirectoryIntegration } from './active-directory/active-directory.integration';
import { ResendIntegration } from './resend/resend.integration';
import { EmailService } from './email/email.service';

@Module({
  providers: [
    GovBrIntegration,
    WhatsappIntegration,
    PayrollIntegration,
    ActiveDirectoryIntegration,
    ResendIntegration,
    EmailService,
  ],
  exports: [
    GovBrIntegration,
    WhatsappIntegration,
    PayrollIntegration,
    ActiveDirectoryIntegration,
    ResendIntegration,
    EmailService,
  ],
})
export class IntegrationsModule {}
