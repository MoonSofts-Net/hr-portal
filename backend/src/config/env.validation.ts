import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV!: string;

  @IsOptional()
  @IsNumber()
  PORT?: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @MinLength(32)
  FIELD_ENCRYPTION_KEY!: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsIn(['local', 's3'])
  STORAGE_PROVIDER?: string;

  @IsOptional()
  @IsString()
  HTTP_BODY_LIMIT?: string;
}

/** Nest passes parsed .env into `config` before merging into process.env */
export function validateEnv(config: Record<string, unknown>) {
  const env = {
    NODE_ENV: config.NODE_ENV ?? process.env.NODE_ENV ?? 'development',
    PORT: config.PORT ?? process.env.PORT,
    DATABASE_URL: config.DATABASE_URL ?? process.env.DATABASE_URL,
    JWT_ACCESS_SECRET: config.JWT_ACCESS_SECRET ?? process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: config.JWT_REFRESH_SECRET ?? process.env.JWT_REFRESH_SECRET,
    FIELD_ENCRYPTION_KEY:
      config.FIELD_ENCRYPTION_KEY ?? process.env.FIELD_ENCRYPTION_KEY,
    CORS_ORIGIN: config.CORS_ORIGIN ?? process.env.CORS_ORIGIN,
    STORAGE_PROVIDER: config.STORAGE_PROVIDER ?? process.env.STORAGE_PROVIDER,
    HTTP_BODY_LIMIT: config.HTTP_BODY_LIMIT ?? process.env.HTTP_BODY_LIMIT,
  };

  const validated = plainToInstance(EnvironmentVariables, env, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }
  return validated;
}
