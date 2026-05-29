import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  SignedUrlParams,
  SignedUrlResult,
  StorageCopyParams,
  StorageMetadata,
  StorageService,
  StorageUploadParams,
  StorageUploadResult,
} from './interfaces/storage-service.interface';
import { buildDocumentStorageKey } from './utils/storage-key.util';

/**
 * Local filesystem storage for development.
 * Signed URLs point to API proxy route pattern (stub tokenized path).
 */
@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly basePath: string;

  constructor(config: ConfigService) {
    this.basePath = path.resolve(
      config.get<string>('storage.local.basePath', './storage/uploads'),
    );
  }

  private resolvePath(storageKey: string): string {
    const normalized = storageKey.replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(this.basePath, normalized);
  }

  async uploadFile(params: StorageUploadParams): Promise<StorageUploadResult> {
    const storageKey = buildDocumentStorageKey({
      tenantId: params.tenantId,
      documentId: params.documentId,
      version: params.version,
      filename: params.filename,
    });

    const fullPath = this.resolvePath(storageKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, params.body);

    this.logger.debug(`Local upload: ${storageKey} (${params.body.length} bytes)`);

    return {
      storageKey,
      sizeBytes: params.body.length,
      etag: createHash('md5').update(params.body).digest('hex'),
    };
  }

  async getSignedDownloadUrl(params: SignedUrlParams): Promise<SignedUrlResult> {
    const fullPath = this.resolvePath(params.storageKey);
    try {
      await fs.access(fullPath);
    } catch {
      throw new NotFoundException('File not found in storage');
    }

    const expiry = params.expiresInSeconds ?? 300;
    const expiresAt = new Date(Date.now() + expiry * 1000);
    const token = createHash('sha256')
      .update(`${params.storageKey}:${expiresAt.getTime()}`)
      .digest('hex')
      .slice(0, 32);

    // Dev-only URL pattern — production uses S3 presigned URLs via API gateway
    const url = `local-storage://${params.storageKey}?token=${token}&expires=${expiresAt.toISOString()}`;

    return { url, expiresAt };
  }

  async deleteFile(storageKey: string): Promise<void> {
    const fullPath = this.resolvePath(storageKey);
    try {
      await fs.unlink(fullPath);
    } catch {
      this.logger.warn(`Local delete skipped (missing): ${storageKey}`);
    }
  }

  async copyFile(params: StorageCopyParams): Promise<{ storageKey: string }> {
    const src = this.resolvePath(params.sourceKey);
    const dest = this.resolvePath(params.destinationKey);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
    return { storageKey: params.destinationKey };
  }

  async getMetadata(storageKey: string): Promise<StorageMetadata | null> {
    const fullPath = this.resolvePath(storageKey);
    try {
      const stat = await fs.stat(fullPath);
      return {
        storageKey,
        sizeBytes: stat.size,
        lastModified: stat.mtime,
      };
    } catch {
      return null;
    }
  }
}
