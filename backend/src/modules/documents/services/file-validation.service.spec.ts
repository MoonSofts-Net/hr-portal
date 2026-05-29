import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileValidationService } from './file-validation.service';

describe('FileValidationService', () => {
  const config = {
    get: jest.fn((key: string, def?: unknown) => {
      if (key === 'documents.maxFileSizeBytes') return 1024;
      if (key === 'documents.allowedMimeTypes') return ['application/pdf'];
      return def;
    }),
  } as unknown as ConfigService;

  const service = new FileValidationService(config);

  it('rejects disallowed mime type', () => {
    expect(() =>
      service.validate({
        buffer: Buffer.from('x'),
        size: 1,
        mimetype: 'application/x-msdownload',
        originalname: 'mal.exe',
      } as Express.Multer.File),
    ).toThrow(BadRequestException);
  });

  it('accepts allowed mime within size', () => {
    expect(() =>
      service.validate({
        buffer: Buffer.from('%PDF'),
        size: 4,
        mimetype: 'application/pdf',
        originalname: 'doc.pdf',
      } as Express.Multer.File),
    ).not.toThrow();
  });
});
