const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'cpf',
  'cpfEncrypted',
  'cpfHash',
  'phone',
  'phoneEncrypted',
  'address',
  'addressEncrypted',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'secret',
  'taxId',
]);

export function maskCpfValue(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***.***.***-${digits.slice(-2)}`;
}

export function maskSensitiveValue(key: string, value: unknown): unknown {
  const lower = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lower) || lower.includes('password') || lower.includes('token')) {
    return '[REDACTED]';
  }
  if (lower.includes('cpf') && typeof value === 'string') {
    return maskCpfValue(value);
  }
  return value;
}

export function maskSensitiveMetadata<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveMetadata(item)) as T;
  }
  if (typeof data === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        out[key] = maskSensitiveMetadata(value);
      } else {
        out[key] = maskSensitiveValue(key, value);
      }
    }
    return out as T;
  }
  return data;
}
