import { ForbiddenException, Injectable } from '@nestjs/common';
import { DocumentAccessLevel } from '@prisma/client';

type DocumentAccessCheck = {
  userId: string;
  accessLevel: DocumentAccessLevel;
};
import { AuthenticatedUser } from '../../../security/interfaces/authenticated-user.interface';
import { isWildcardPermission } from '../../../security/permissions/permission-catalog';

@Injectable()
export class DocumentAccessService {
  private has(user: AuthenticatedUser, permission: string): boolean {
    return isWildcardPermission(user.permissionIds) || user.permissionIds.includes(permission);
  }

  assertCanRead(doc: DocumentAccessCheck, user: AuthenticatedUser): void {
    if (!this.canRead(doc, user)) {
      throw new ForbiddenException('Access denied to document');
    }
  }

  canRead(doc: DocumentAccessCheck, user: AuthenticatedUser): boolean {
    if (doc.userId === user.userId && this.has(user, 'documents.read')) {
      return true;
    }
    if (this.has(user, 'documents.approve')) {
      return true;
    }
    if (
      doc.accessLevel === DocumentAccessLevel.COMPANY &&
      this.has(user, 'documents.read')
    ) {
      return true;
    }
    if (
      doc.accessLevel === DocumentAccessLevel.HR &&
      (this.has(user, 'documents.approve') || this.has(user, 'documents.download'))
    ) {
      return true;
    }
    if (
      doc.accessLevel === DocumentAccessLevel.MANAGER &&
      this.has(user, 'point.adjust.approve')
    ) {
      return true;
    }
    return false;
  }

  assertCanWrite(
    doc: { userId: string } | null,
    user: AuthenticatedUser,
    targetUserId: string,
  ): void {
    const isOwner = targetUserId === user.userId;
    if (isOwner && this.has(user, 'documents.upload')) return;
    if (!isOwner && this.has(user, 'documents.approve')) return;
    if (doc && doc.userId !== user.userId && !this.has(user, 'documents.approve')) {
      throw new ForbiddenException('Cannot modify another user document');
    }
  }

  assertCanApprove(user: AuthenticatedUser): void {
    if (!this.has(user, 'documents.approve')) {
      throw new ForbiddenException('Document approval permission required');
    }
  }

  assertCanDelete(doc: { userId: string }, user: AuthenticatedUser): void {
    if (doc.userId === user.userId && this.has(user, 'documents.upload')) return;
    if (this.has(user, 'documents.approve')) return;
    throw new ForbiddenException('Cannot delete document');
  }
}
