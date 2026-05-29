import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsResolverService } from '../../modules/auth/services/permissions-resolver.service';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from '../constants/metadata-keys';

describe('PermissionsGuard', () => {
  const resolver = {
    hasAny: jest.fn(),
  } as unknown as PermissionsResolverService;

  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new PermissionsGuard(reflector, resolver);

  function ctx(user?: Record<string, unknown>) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
  }

  beforeEach(() => jest.clearAllMocks());

  it('allows public routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation((key) =>
      key === IS_PUBLIC_KEY ? true : undefined,
    );
    expect(guard.canActivate(ctx() as never)).toBe(true);
  });

  it('allows when no permissions required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(ctx({ permissionIds: [] }) as never)).toBe(true);
  });

  it('denies when user lacks permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation((key) =>
      key === PERMISSIONS_KEY ? ['users.write'] : false,
    );
    (resolver.hasAny as jest.Mock).mockReturnValue(false);
    expect(() =>
      guard.canActivate(
        ctx({ permissionIds: ['users.read'], mfaVerified: true, mfaEnabled: false }) as never,
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows when user has required permission', () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation((key) =>
      key === PERMISSIONS_KEY ? ['users.write'] : false,
    );
    (resolver.hasAny as jest.Mock).mockReturnValue(true);
    expect(
      guard.canActivate(
        ctx({ permissionIds: ['users.write'], mfaVerified: true, mfaEnabled: false }) as never,
      ),
    ).toBe(true);
  });
});
