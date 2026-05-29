import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { join } from 'path';
import configuration from './configuration';
import { validateEnv } from './env.validation';

const backendRoot = join(__dirname, '..', '..');

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        join(backendRoot, '.env.local'),
        join(backendRoot, '.env'),
        join(backendRoot, '..', '.env.local'),
        join(backendRoot, '..', '.env'),
      ],
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
