import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Response } from 'express';
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

export interface LocalFileDownloadQuery {
  key: string;
  token: string;
  expires: string;
  filename?: string;
  mime?: string;
}

/**
 * Local filesystem storage for development.
 * Signed URLs point to the API file-download route (proxied by Next.js in dev).
 */
@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly basePath: string;
  private readonly apiPrefix: string;

  constructor(config: ConfigService) {
    this.basePath = path.resolve(
      config.get<string>('storage.local.basePath', './storage/uploads'),
    );
    this.apiPrefix = config.get<string>('apiPrefix', 'api/v1');
  }

  private resolvePath(storageKey: string): string {
    const normalized = storageKey.replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(this.basePath, normalized);
  }

  private buildDownloadToken(storageKey: string, expiresAt: Date): string {
    return createHash('sha256')
      .update(`${storageKey}:${expiresAt.getTime()}`)
      .digest('hex')
      .slice(0, 32);
  }

  verifyDownloadToken(storageKey: string, token: string, expires: string): void {
    const expiresAt = new Date(expires);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Download link has expired');
    }

    const expected = this.buildDownloadToken(storageKey, expiresAt);
    if (token !== expected) {
      throw new UnauthorizedException('Invalid download token');
    }
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
    const token = this.buildDownloadToken(params.storageKey, expiresAt);

    const query = new URLSearchParams({
      key: params.storageKey,
      token,
      expires: expiresAt.toISOString(),
    });
    if (params.filename) query.set('filename', params.filename);
    if (params.contentType) query.set('mime', params.contentType);

    const url = `/${this.apiPrefix}/documents/file-download?${query.toString()}`;

    return { url, expiresAt };
  }

  async serveSignedDownload(query: LocalFileDownloadQuery, res: Response): Promise<void> {
    this.verifyDownloadToken(query.key, query.token, query.expires);

    const fullPath = this.resolvePath(query.key);
    try {
      await fs.access(fullPath);
    } catch {
      throw new NotFoundException('File not found in storage');
    }

    const stat = await fs.stat(fullPath);
    const filename = query.filename?.replace(/[^\w\s.\-()]/g, '_') || path.basename(fullPath);
    const contentType = query.mime || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, no-store');

    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(fullPath);
      stream.on('error', reject);
      res.on('finish', resolve);
      res.on('close', resolve);
      stream.pipe(res);
    });
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
