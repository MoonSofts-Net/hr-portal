import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FieldEncryptionService } from '../../security/field-encryption.service';
import { PasswordHasherService } from '../../security/password-hasher.service';
import { ok, paginated } from '../../common/utils/api-response.util';
import { buildMeta, buildOrderBy, resolvePagination } from '../../common/utils/pagination.util';
import { maskCpfFromDigits } from '../../common/utils/cpf-mask.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { DomainAuditService } from '../audit-logs/domain-audit.service';

const SORT_FIELDS: Record<string, string> = {
  name: 'name',
  email: 'email',
  createdAt: 'createdAt',
  status: 'status',
};

const userListSelect = {
  id: true,
  email: true,
  name: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  employeeProfile: {
    select: {
      department: true,
      jobTitle: true,
      cpfHash: true,
    },
  },
  userRoles: {
    where: { isPrimary: true },
    take: 1,
    select: { role: { select: { id: true, name: true } } },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldEncryption: FieldEncryptionService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly audit: DomainAuditService,
  ) {}

  async findAll(tenantId: string, query: ListUsersQueryDto) {
    const { page, limit, skip, take, sortOrder } = resolvePagination(query);
    const where: Prisma.UserWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.department
        ? { employeeProfile: { department: query.department } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(query.sortBy, sortOrder, SORT_FIELDS, 'createdAt'),
        select: userListSelect,
      }),
    ]);

    const data = rows.map((u) => this.toListItem(u));
    return paginated(data, buildMeta(total, page, limit));
  }

  async findOne(tenantId: string, id: string, includeMaskedCpf = false) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        ...userListSelect,
        employeeProfile: {
          select: {
            department: true,
            jobTitle: true,
            hireDate: true,
            birthDate: true,
            cpfHash: true,
          },
        },
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                rolePermissions: { select: { permissionId: true } },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return ok(this.toDetail(user, includeMaskedCpf));
  }

  async create(
    tenantId: string,
    dto: CreateUserDto,
    actorId: string,
  ) {
    const email = dto.email.trim().toLowerCase();
    const cpfNorm = dto.cpf.replace(/\D/g, '');
    if (cpfNorm.length !== 11) {
      throw new ConflictException('Invalid CPF');
    }

    const existing = await this.prisma.user.findFirst({
      where: { tenantId, OR: [{ email }, { employeeProfile: { cpfHash: this.fieldEncryption.hashForLookup(cpfNorm) } }] },
    });
    if (existing) throw new ConflictException('Email or CPF already registered');

    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, OR: [{ tenantId }, { tenantId: null, isGlobal: true }] },
    });
    if (!role || (role.tenantId && role.tenantId !== tenantId)) {
      throw new NotFoundException('Role not found in tenant');
    }
    if (role.isSystem && role.isGlobal) {
      throw new ForbiddenException('Cannot assign system global role to tenant user');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          tenantId,
          email,
          name: dto.name,
          passwordHash,
          status: UserStatus.INVITED,
          invitedAt: new Date(),
        },
      });

      await tx.employeeProfile.create({
        data: {
          tenantId,
          userId: created.id,
          cpfEncrypted: this.fieldEncryption.encrypt(cpfNorm),
          cpfHash: this.fieldEncryption.hashForLookup(cpfNorm),
          department: dto.department,
          jobTitle: dto.jobTitle,
          phoneEncrypted: dto.phone
            ? this.fieldEncryption.encrypt(dto.phone)
            : undefined,
        },
      });

      await tx.userRole.create({
        data: { tenantId, userId: created.id, roleId: dto.roleId, isPrimary: true, assignedBy: actorId },
      });

      return created;
    });

    await this.audit.recordEvent('USER_CREATED', {
      tenantId,
      actorUserId: actorId,
      targetUserId: user.id,
      entityId: user.id,
    });

    return this.findOne(tenantId, user.id);
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto, actorId: string) {
    await this.ensureInTenant(tenantId, id);

    if (dto.email) {
      const clash = await this.prisma.user.findFirst({
        where: { tenantId, email: dto.email.trim().toLowerCase(), NOT: { id } },
      });
      if (clash) throw new ConflictException('Email already in use');
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findFirst({
        where: { id: dto.roleId, tenantId },
      });
      if (!role || role.isSystem) throw new NotFoundException('Role not assignable');
    }

    const passwordHash = dto.password
      ? await this.passwordHasher.hash(dto.password)
      : undefined;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          email: dto.email?.trim().toLowerCase(),
          name: dto.name,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });

      if (dto.department !== undefined || dto.jobTitle !== undefined || dto.phone !== undefined) {
        await tx.employeeProfile.update({
          where: { userId: id },
          data: {
            department: dto.department,
            jobTitle: dto.jobTitle,
            phoneEncrypted: dto.phone
              ? this.fieldEncryption.encrypt(dto.phone)
              : undefined,
          },
        });
      }

      if (dto.roleId) {
        await tx.userRole.deleteMany({ where: { tenantId, userId: id, isPrimary: true } });
        await tx.userRole.create({
          data: { tenantId, userId: id, roleId: dto.roleId, isPrimary: true, assignedBy: actorId },
        });
      }
    });

    await this.audit.recordEvent('USER_UPDATED', {
      tenantId,
      actorUserId: actorId,
      targetUserId: id,
      entityId: id,
    });

    return this.findOne(tenantId, id);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: UserStatus,
    actorId: string,
  ) {
    await this.ensureInTenant(tenantId, id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: userListSelect,
    });

    const eventKey = status === UserStatus.DISABLED ? 'USER_DISABLED' : 'USER_UPDATED';
    await this.audit.recordEvent(eventKey, {
      tenantId,
      actorUserId: actorId,
      targetUserId: id,
      entityId: id,
      metadata: { status },
    });

    return ok(this.toListItem(user));
  }

  async softDelete(tenantId: string, id: string, actorId: string) {
    return this.updateStatus(tenantId, id, UserStatus.DISABLED, actorId);
  }

  private async ensureInTenant(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private toListItem(
    user: Prisma.UserGetPayload<{ select: typeof userListSelect }>,
  ) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      avatarUrl: user.avatarUrl,
      department: user.employeeProfile?.department,
      jobTitle: user.employeeProfile?.jobTitle,
      cpfMasked: user.employeeProfile ? maskCpfFromDigits('00000000000') : undefined,
      role: user.userRoles[0]?.role ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toDetail(
    user: Prisma.UserGetPayload<{
      select: typeof userListSelect & {
        employeeProfile: { select: { department: true; jobTitle: true; hireDate: true; birthDate: true; cpfHash: true } };
        userRoles: { include: { role: { select: { id: true; name: true; rolePermissions: { select: { permissionId: true } } } } } };
      };
    }>,
    includeMaskedCpf: boolean,
  ) {
    const base = this.toListItem(user);
    return {
      ...base,
      cpfMasked: includeMaskedCpf ? maskCpfFromDigits('00000000000') : undefined,
      hireDate: user.employeeProfile?.hireDate,
      birthDate: user.employeeProfile?.birthDate,
      roles: user.userRoles.map((ur) => ur.role),
    };
  }
}
