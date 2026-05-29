import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';

/** Injects the authenticated principal from JWT + JwtStrategy. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/** Alias for CurrentUser — use in handlers: `@getCurrentUser() user` */
export const getCurrentUser = CurrentUser;
