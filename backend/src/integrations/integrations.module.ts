import { Module } from '@nestjs/common';
import { GovBrIntegration } from './govbr/govbr.integration';
import { WhatsappIntegration } from './whatsapp/whatsapp.integration';
import { PayrollIntegration } from './payroll/payroll.integration';
import { ActiveDirectoryIntegration } from './active-directory/active-directory.integration';

@Module({
  providers: [
    GovBrIntegration,
    WhatsappIntegration,
    PayrollIntegration,
    ActiveDirectoryIntegration,
  ],
  exports: [
    GovBrIntegration,
    WhatsappIntegration,
    PayrollIntegration,
    ActiveDirectoryIntegration,
  ],
})
export class IntegrationsModule {}
