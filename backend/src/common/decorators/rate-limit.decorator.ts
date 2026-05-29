import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_KEY } from '../constants/metadata-keys';

export interface RateLimitOptions {
  /** Max requests per window per key */
  limit: number;
  windowMs: number;
  /** Prefix for rate-limit bucket (combined with IP) */
  keyPrefix: string;
}

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);
