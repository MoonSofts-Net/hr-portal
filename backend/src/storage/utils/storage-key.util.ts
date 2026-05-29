import { sanitizeFilename } from './filename-sanitize.util';

/** Safe object key: tenant/documents/{documentId}/v{n}/{filename} */
export function buildDocumentStorageKey(params: {
  tenantId: string;
  documentId: string;
  version: number;
  filename: string;
}): string {
  const safeName = sanitizeFilename(params.filename) || 'file';
  return `${params.tenantId}/documents/${params.documentId}/v${params.version}/${safeName}`;
}
