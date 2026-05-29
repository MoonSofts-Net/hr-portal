import { ForbiddenException } from '@nestjs/common';
import { DocumentAccessLevel } from '@prisma/client';
import { DocumentAccessService } from './document-access.service';
import { employeeTenantA, hrTenantA, managerTenantA } from '../../../../test/fixtures/test-users.fixture';

describe('DocumentAccessService', () => {
  const service = new DocumentAccessService();

  const ownDoc = { userId: employeeTenantA.userId, accessLevel: DocumentAccessLevel.PRIVATE };
  const otherDoc = { userId: 'other-user', accessLevel: DocumentAccessLevel.PRIVATE };

  it('owner with documents.read can read own document', () => {
    expect(service.canRead(ownDoc, employeeTenantA)).toBe(true);
  });

  it('employee cannot read another employee private document', () => {
    expect(service.canRead(otherDoc, employeeTenantA)).toBe(false);
    expect(() => service.assertCanRead(otherDoc, employeeTenantA)).toThrow(ForbiddenException);
  });

  it('HR with documents.approve can read private documents of others', () => {
    expect(service.canRead(otherDoc, hrTenantA)).toBe(true);
  });

  it('manager with point.adjust.approve can read manager-level docs', () => {
    const mgrDoc = { userId: 'x', accessLevel: DocumentAccessLevel.MANAGER };
    expect(service.canRead(mgrDoc, managerTenantA)).toBe(true);
  });

  it('employee cannot delete another user document', () => {
    expect(() => service.assertCanDelete(otherDoc, employeeTenantA)).toThrow(ForbiddenException);
  });
});
