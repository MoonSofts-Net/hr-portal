import { SetMetadata } from '@nestjs/common';
import { SKIP_AUDIT_KEY } from '../constants/metadata-keys';

export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);
