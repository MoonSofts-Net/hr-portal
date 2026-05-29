import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants/metadata-keys';

/** Require at least one of the listed permission IDs (e.g. "users.view") */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
