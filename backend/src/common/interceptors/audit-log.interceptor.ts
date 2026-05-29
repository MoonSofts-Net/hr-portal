import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Generic HTTP audit is disabled — domain services write canonical audit events
 * via DomainAuditService.recordEvent().
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle();
  }
}
