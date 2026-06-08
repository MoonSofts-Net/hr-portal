import { IsUUID, ValidationOptions } from 'class-validator';

/**
 * PostgreSQL UUID strings, including deterministic dev seed IDs
 * (e.g. 00000000-0000-0000-0000-000000000003). Stricter @IsUUID() / RFC "all"
 * rejects those values.
 */
export function IsDatabaseUuid(validationOptions?: ValidationOptions) {
  return IsUUID('loose', validationOptions);
}
