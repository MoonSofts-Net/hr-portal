import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithContext extends Request {
  auditContext?: {
    ipAddress?: string;
    userAgent?: string;
  };
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: RequestWithContext, _res: Response, next: NextFunction) {
    req.auditContext = {
      ipAddress: req.ip ?? req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    next();
  }
}

export function getAuditContext(req: RequestWithContext) {
  return req.auditContext ?? {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}
