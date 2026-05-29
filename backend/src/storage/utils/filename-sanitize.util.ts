import { createHash } from 'crypto';

const MAX_FILENAME_LENGTH = 200;

/**
 * Strip path segments and unsafe characters; preserve extension when possible.
 */
export function sanitizeFilename(original: string): string {
  const base = original.replace(/\\/g, '/').split('/').pop() ?? 'file';
  const cleaned = base
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, MAX_FILENAME_LENGTH);

  if (cleaned.length > 0) return cleaned;
  return `file_${createHash('sha256').update(original).digest('hex').slice(0, 12)}`;
}
