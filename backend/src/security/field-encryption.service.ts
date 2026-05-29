import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Application-level encryption for LGPD-sensitive fields (CPF).
 * Prefer envelope encryption / KMS in production.
 */
@Injectable()
export class FieldEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const hex = config.get<string>('security.fieldEncryptionKey');
    if (!hex || hex.length !== 32) {
      throw new Error('FIELD_ENCRYPTION_KEY must be 32 characters');
    }
    this.key = Buffer.from(hex, 'utf8');
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt(payload: string): string {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  hashForLookup(value: string): string {
    return crypto.createHmac('sha256', this.key).update(value).digest('hex');
  }
}
