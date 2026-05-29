import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_SERVICE } from './interfaces/storage-service.interface';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageService,
    S3StorageService,
    {
      provide: STORAGE_SERVICE,
      inject: [ConfigService, LocalStorageService, S3StorageService],
      useFactory: (
        config: ConfigService,
        local: LocalStorageService,
        s3: S3StorageService,
      ) => {
        const provider = config.get<string>('storage.provider', 'local');
        return provider === 's3' ? s3 : local;
      },
    },
  ],
  exports: [STORAGE_SERVICE, LocalStorageService, S3StorageService],
})
export class StorageModule {}
