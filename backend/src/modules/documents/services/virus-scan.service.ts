import { Injectable, Logger } from '@nestjs/common';

export interface VirusScanResult {
  clean: boolean;
  threatName?: string;
  scannedAt: Date;
}

/**
 * Virus scanning abstraction — replace with ClamAV / cloud scanner in production.
 */
export interface VirusScanner {
  scan(buffer: Buffer, filename: string): Promise<VirusScanResult>;
}

@Injectable()
export class NoOpVirusScannerService implements VirusScanner {
  private readonly logger = new Logger(NoOpVirusScannerService.name);

  async scan(buffer: Buffer, filename: string): Promise<VirusScanResult> {
    this.logger.debug(`[VIRUS SCAN STUB] skipped for ${filename} (${buffer.length} bytes)`);
    return { clean: true, scannedAt: new Date() };
  }
}

export const VIRUS_SCANNER = Symbol('VIRUS_SCANNER');
