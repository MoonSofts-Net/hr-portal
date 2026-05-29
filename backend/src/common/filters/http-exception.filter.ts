import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

/**
 * Centralized errors — never leak stack traces or internal details in production.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    this.isProduction = config.get<string>('nodeEnv') === 'production';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let clientMessage: string | object = 'An unexpected error occurred';
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        clientMessage = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        clientMessage = {
          statusCode: status,
          message: body.message ?? body.error ?? 'Request failed',
          error: body.error,
        };
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      if (this.isProduction) {
        clientMessage = 'Internal server error';
      }
    }

    const payload =
      typeof clientMessage === 'string'
        ? { success: false, statusCode: status, message: clientMessage, path: request.url }
        : { success: false, ...(clientMessage as object), path: request.url };

    response.status(status).json({
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}
