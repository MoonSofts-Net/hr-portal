import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
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
 * S3-compatible adapter (AWS S3, MinIO).
 * V1: structured stub — wire @aws-sdk/client-s3 PutObject / getSignedUrl in production.
 */
@Injectable()
export class S3StorageService implements StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly inMemory = new Map<string, Buffer>();

  constructor(private readonly config: ConfigService) {}

  async uploadFile(params: StorageUploadParams): Promise<StorageUploadResult> {
    const storageKey = buildDocumentStorageKey({
      tenantId: params.tenantId,
      documentId: params.documentId,
      version: params.version,
      filename: params.filename,
    });

    // Stub: in-memory until SDK wired; production uses SSE-S3 PutObject
    this.inMemory.set(storageKey, params.body);
    this.logger.debug(`[S3 STUB] PutObject ${storageKey} (${params.contentType})`);

    return {
      storageKey,
      sizeBytes: params.body.length,
      etag: createHash('md5').update(params.body).digest('hex'),
    };
  }

  async getSignedDownloadUrl(params: SignedUrlParams): Promise<SignedUrlResult> {
    if (!this.inMemory.has(params.storageKey)) {
      const endpoint = this.config.get<string>('storage.s3.endpoint');
      const bucket = this.config.get<string>('storage.s3.bucket');
      if (!endpoint || !bucket) {
        throw new NotFoundException('Storage object not found');
      }
    }

    const expiry =
      params.expiresInSeconds ??
      this.config.get<number>('storage.s3.presignedUrlExpirySeconds', 300);
    const expiresAt = new Date(Date.now() + expiry * 1000);
    const endpoint = this.config.get<string>('storage.s3.endpoint');
    const bucket = this.config.get<string>('storage.s3.bucket');
    const encodedKey = encodeURIComponent(params.storageKey).replace(/%2F/g, '/');
    const url = `${endpoint}/${bucket}/${encodedKey}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=${expiry}`;

    this.logger.debug(`[S3 STUB] presigned GET ${params.storageKey}`);
    return { url, expiresAt };
  }

  async deleteFile(storageKey: string): Promise<void> {
    this.inMemory.delete(storageKey);
    this.logger.debug(`[S3 STUB] DeleteObject ${storageKey}`);
  }

  async copyFile(params: StorageCopyParams): Promise<{ storageKey: string }> {
    const body = this.inMemory.get(params.sourceKey);
    if (!body) throw new NotFoundException('Source object not found');
    this.inMemory.set(params.destinationKey, Buffer.from(body));
    this.logger.debug(`[S3 STUB] Copy ${params.sourceKey} -> ${params.destinationKey}`);
    return { storageKey: params.destinationKey };
  }

  async getMetadata(storageKey: string): Promise<StorageMetadata | null> {
    const body = this.inMemory.get(storageKey);
    if (!body) return null;
    return { storageKey, sizeBytes: body.length };
  }
}
