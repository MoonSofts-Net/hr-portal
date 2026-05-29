import { PermissionsResolverService } from './permissions-resolver.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('PermissionsResolverService', () => {
  let service: PermissionsResolverService;
  let prisma: { role: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { role: { findUnique: jest.fn() } };
    service = new PermissionsResolverService(prisma as unknown as PrismaService);
  });

  it('returns wildcard for global system role', async () => {
    prisma.role.findUnique.mockResolvedValue({
      isSystem: true,
      isGlobal: true,
      rolePermissions: [],
    });
    const perms = await service.resolveForRole('role-super');
    expect(perms).toContain('*');
  });

  it('hasAny grants access when permission matches', () => {
    expect(service.hasAny(['users.read'], ['users.read', 'users.write'])).toBe(true);
    expect(service.hasAny(['users.delete'], ['users.read'])).toBe(false);
  });

  it('hasAny allows all when wildcard granted', () => {
    expect(service.hasAny(['tenants.write'], ['*'])).toBe(true);
  });

  it('hasAll requires every permission', () => {
    expect(service.hasAll(['a', 'b'], ['a', 'b', 'c'])).toBe(true);
    expect(service.hasAll(['a', 'b'], ['a'])).toBe(false);
  });
});
