export interface StorageUploadParams {
  tenantId: string;
  documentId: string;
  version: number;
  filename: string;
  body: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StorageUploadResult {
  storageKey: string;
  sizeBytes: number;
  etag?: string;
}

export interface SignedUrlParams {
  storageKey: string;
  expiresInSeconds?: number;
  filename?: string;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: Date;
}

export interface StorageMetadata {
  storageKey: string;
  sizeBytes: number;
  contentType?: string;
  lastModified?: Date;
}

export interface StorageCopyParams {
  sourceKey: string;
  destinationKey: string;
  tenantId: string;
}

/**
 * Object storage abstraction — local filesystem (dev) or S3-compatible (production).
 */
export interface StorageService {
  uploadFile(params: StorageUploadParams): Promise<StorageUploadResult>;
  getSignedDownloadUrl(params: SignedUrlParams): Promise<SignedUrlResult>;
  deleteFile(storageKey: string): Promise<void>;
  copyFile(params: StorageCopyParams): Promise<{ storageKey: string }>;
  getMetadata(storageKey: string): Promise<StorageMetadata | null>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
