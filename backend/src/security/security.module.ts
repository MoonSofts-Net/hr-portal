import { Global, Module } from '@nestjs/common';
import { FieldEncryptionService } from './field-encryption.service';
import { PasswordHasherService } from './password-hasher.service';

@Global()
@Module({
  providers: [FieldEncryptionService, PasswordHasherService],
  exports: [FieldEncryptionService, PasswordHasherService],
})
export class SecurityModule {}
