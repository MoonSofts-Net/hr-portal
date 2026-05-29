import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileValidationService {
  private readonly maxBytes: number;
  private readonly allowedMimeTypes: Set<string>;

  constructor(config: ConfigService) {
    this.maxBytes = config.get<number>('documents.maxFileSizeBytes', 10 * 1024 * 1024);
    const types = config.get<string[]>('documents.allowedMimeTypes', []);
    this.allowedMimeTypes = new Set(types.map((t) => t.trim().toLowerCase()));
  }

  validate(file: Express.Multer.File): void {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }
    if (file.size > this.maxBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${Math.round(this.maxBytes / 1024 / 1024)}MB`,
      );
    }
    const mime = (file.mimetype ?? '').toLowerCase();
    if (!this.allowedMimeTypes.has(mime)) {
      throw new BadRequestException(`File type not allowed: ${mime}`);
    }
  }
}
