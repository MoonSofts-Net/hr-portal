import {
  assertSameTenantOrThrow,
  assertTenantMatch,
  tenantWhere,
} from './tenant-scope.util';

describe('tenant-scope.util', () => {
  it('tenantWhere merges tenantId into filter', () => {
    expect(tenantWhere('t1', { status: 'ACTIVE' })).toEqual({
      tenantId: 't1',
      status: 'ACTIVE',
    });
  });

  it('assertTenantMatch returns true for same tenant', () => {
    expect(assertTenantMatch('a', 'a')).toBe(true);
    expect(assertTenantMatch('a', 'b')).toBe(false);
  });

  it('assertSameTenantOrThrow throws on mismatch', () => {
    expect(() => assertSameTenantOrThrow('a', 'b')).toThrow('TENANT_MISMATCH');
    expect(() => assertSameTenantOrThrow('a', 'a')).not.toThrow();
  });
});
