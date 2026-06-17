import { PrismaClient, UserStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PasswordHasherService } from '../../security/password-hasher.service';
import { PERMISSION_CATALOG, ALL_PERMISSION_IDS } from '../../security/permissions/permission-catalog';

const prisma = new PrismaClient();
const passwordHasher = new PasswordHasherService();

const IDS = {
  tenantSystem: 'a0000000-0000-0000-0000-000000000001',
  tenantMoonsofts: 'a0000000-0000-0000-0000-000000000002',
  roleSuperAdmin: '00000000-0000-0000-0000-000000000001',
  roleEmployee: '00000000-0000-0000-0000-000000000002',
  roleHr: '00000000-0000-0000-0000-000000000003',
  roleManager: '00000000-0000-0000-0000-000000000004',
  userSuperAdmin: 'b0000000-0000-0000-0000-000000000001',
  userHr: 'b0000000-0000-0000-0000-000000000002',
  userManager: 'b0000000-0000-0000-0000-000000000003',
  userEmployee: 'b0000000-0000-0000-0000-000000000004',
};

const HR_PERMISSIONS = ALL_PERMISSION_IDS.filter(
  (id) => id !== 'admin.settings.update',
);

const BRANCH_LOCATIONS = [
  { code: 'LOJA-01', name: 'Recife — Centro', city: 'Recife', state: 'PE' },
  { code: 'LOJA-02', name: 'Boa Viagem', city: 'Recife', state: 'PE' },
  { code: 'LOJA-03', name: 'Casa Amarela', city: 'Recife', state: 'PE' },
  { code: 'LOJA-04', name: 'Pina', city: 'Recife', state: 'PE' },
  { code: 'LOJA-05', name: 'Olinda — Centro', city: 'Olinda', state: 'PE' },
  { code: 'LOJA-06', name: 'Jaboatão — Candeias', city: 'Jaboatão dos Guararapes', state: 'PE' },
  { code: 'LOJA-07', name: 'Paulista — Centro', city: 'Paulista', state: 'PE' },
  { code: 'LOJA-08', name: 'Camaragibe', city: 'Camaragibe', state: 'PE' },
  { code: 'LOJA-09', name: 'São Lourenço da Mata', city: 'São Lourenço da Mata', state: 'PE' },
  { code: 'LOJA-10', name: 'Igarassu', city: 'Igarassu', state: 'PE' },
  { code: 'LOJA-11', name: 'Abreu e Lima', city: 'Abreu e Lima', state: 'PE' },
  { code: 'LOJA-12', name: 'Recife — Torre', city: 'Recife', state: 'PE' },
  { code: 'LOJA-13', name: 'Recife — Graças', city: 'Recife', state: 'PE' },
  { code: 'LOJA-14', name: 'Recife — Madalena', city: 'Recife', state: 'PE' },
  { code: 'LOJA-15', name: 'Recife — Espinheiro', city: 'Recife', state: 'PE' },
  { code: 'LOJA-16', name: 'Jaboatão — Piedade', city: 'Jaboatão dos Guararapes', state: 'PE' },
  { code: 'LOJA-17', name: 'Olinda — Bairro Novo', city: 'Olinda', state: 'PE' },
  { code: 'LOJA-18', name: 'Cabo de Santo Agostinho', city: 'Cabo de Santo Agostinho', state: 'PE' },
  { code: 'LOJA-19', name: 'Recife — Varzea', city: 'Recife', state: 'PE' },
  { code: 'LOJA-20', name: 'Recife — Afogados', city: 'Recife', state: 'PE' },
  { code: 'LOJA-21', name: 'Recife — Bongi', city: 'Recife', state: 'PE' },
  { code: 'LOJA-22', name: 'Recife — Cordeiro', city: 'Recife', state: 'PE' },
  { code: 'LOJA-23', name: 'Recife — Ilha do Leite', city: 'Recife', state: 'PE' },
  { code: 'LOJA-24', name: 'Recife — Derby', city: 'Recife', state: 'PE' },
];

const MANAGER_PERMISSIONS = [
  'dashboard.read',
  'users.read',
  'onboarding.read',
  'onboarding.approve',
  'documents.read',
  'documents.download',
  'hr_requests.read',
  'hr_requests.create',
  'hr_requests.respond',
  'point.read',
  'point.adjust.approve',
];

const EMPLOYEE_PERMISSIONS = [
  'dashboard.read',
  'onboarding.read',
  'onboarding.submit',
  'documents.read',
  'documents.download',
  'documents.upload',
  'hr_requests.read',
  'hr_requests.create',
  'point.read',
  'point.adjust.request',
];

function loadEnvKey(): Buffer {
  const envPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^FIELD_ENCRYPTION_KEY=(.+)$/m);
    if (match?.[1]) return Buffer.from(match[1].trim(), 'utf8');
  }
  const key = process.env.FIELD_ENCRYPTION_KEY ?? '0123456789abcdef0123456789abcdef';
  return Buffer.from(key, 'utf8');
}

const encryptionKey = loadEnvKey();

function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function hashForLookup(value: string): string {
  return crypto.createHmac('sha256', encryptionKey).update(value).digest('hex');
}

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

async function linkPermissions(roleId: string, permissionIds: string[]) {
  for (const permissionId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      create: { roleId, permissionId },
      update: {},
    });
  }
}

async function seedUser(params: {
  id: string;
  tenantId: string;
  email: string;
  password: string;
  name: string;
  roleId: string;
  cpf: string;
  branchId?: string;
  department?: string;
  jobTitle?: string;
}) {
  const passwordHash = await passwordHasher.hash(params.password);
  const cpfNorm = normalizeCpf(params.cpf);

  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: params.tenantId, email: params.email } },
    create: {
      id: params.id,
      tenantId: params.tenantId,
      branchId: params.branchId,
      email: params.email,
      passwordHash,
      name: params.name,
      status: UserStatus.ACTIVE,
    },
    update: { passwordHash, name: params.name, status: UserStatus.ACTIVE, branchId: params.branchId },
  });

  await prisma.employeeProfile.upsert({
    where: { userId: user.id },
    create: {
      tenantId: params.tenantId,
      userId: user.id,
      cpfEncrypted: encryptField(cpfNorm),
      cpfHash: hashForLookup(cpfNorm),
      department: params.department,
      jobTitle: params.jobTitle,
    },
    update: {
      cpfEncrypted: encryptField(cpfNorm),
      cpfHash: hashForLookup(cpfNorm),
      department: params.department,
      jobTitle: params.jobTitle,
    },
  });

  await prisma.userRole.deleteMany({ where: { tenantId: params.tenantId, userId: user.id } });
  await prisma.userRole.create({
    data: {
      tenantId: params.tenantId,
      userId: user.id,
      roleId: params.roleId,
      isPrimary: true,
    },
  });

  return user;
}

async function seedBranches(tenantId: string) {
  const branches: { id: string; code: string; name: string }[] = [];

  for (let i = 0; i < BRANCH_LOCATIONS.length; i++) {
    const loc = BRANCH_LOCATIONS[i];
    const id = `d0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    const branch = await prisma.branch.upsert({
      where: { tenantId_code: { tenantId, code: loc.code } },
      create: {
        id,
        tenantId,
        code: loc.code,
        name: loc.name,
        city: loc.city,
        state: loc.state,
        isContracted: true,
        isActive: true,
      },
      update: {
        name: loc.name,
        city: loc.city,
        state: loc.state,
        isContracted: true,
        isActive: true,
      },
    });
    branches.push({ id: branch.id, code: branch.code, name: branch.name });
  }

  return branches;
}

async function main() {
  console.log('Seeding Portal RH database...');

  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        module: p.module,
        action: p.action,
        label: p.label,
        description: p.description,
      },
      update: { label: p.label, description: p.description },
    });
  }

  const tenantSystem = await prisma.tenant.upsert({
    where: { slug: 'system' },
    create: {
      id: IDS.tenantSystem,
      name: 'Portal RH Platform',
      slug: 'system',
      isActive: true,
    },
    update: {},
  });

  const tenantMoonsofts = await prisma.tenant.upsert({
    where: { slug: 'moonsofts' },
    create: {
      id: IDS.tenantMoonsofts,
      name: 'Moonsofts Tecnologia',
      slug: 'moonsofts',
      legalName: 'Moonsofts Tecnologia Ltda',
      isActive: true,
    },
    update: {},
  });

  const superRole = await prisma.role.upsert({
    where: { id: IDS.roleSuperAdmin },
    create: {
      id: IDS.roleSuperAdmin,
      tenantId: null,
      name: 'Super Administrator',
      description: 'Immutable global operator',
      isSystem: true,
      isGlobal: true,
    },
    update: { isSystem: true, isGlobal: true },
  });

  await linkPermissions(superRole.id, ALL_PERMISSION_IDS);

  const hrRole = await prisma.role.upsert({
    where: { id: IDS.roleHr },
    create: {
      id: IDS.roleHr,
      tenantId: tenantMoonsofts.id,
      name: 'HR',
      description: 'Default HR role — configurable via admin',
      isSystem: false,
    },
    update: {},
  });

  const managerRole = await prisma.role.upsert({
    where: { id: IDS.roleManager },
    create: {
      id: IDS.roleManager,
      tenantId: tenantMoonsofts.id,
      name: 'Manager',
      description: 'Default manager role — configurable via admin',
      isSystem: false,
    },
    update: {},
  });

  const employeeRole = await prisma.role.upsert({
    where: { id: IDS.roleEmployee },
    create: {
      id: IDS.roleEmployee,
      tenantId: tenantMoonsofts.id,
      name: 'Employee',
      description: 'Default employee role — configurable via admin',
      isSystem: false,
    },
    update: {},
  });

  await linkPermissions(hrRole.id, HR_PERMISSIONS);
  await linkPermissions(managerRole.id, MANAGER_PERMISSIONS);
  await linkPermissions(employeeRole.id, EMPLOYEE_PERMISSIONS);

  const branches = await seedBranches(tenantMoonsofts.id);
  const defaultBranchId = branches[0]?.id;

  const onboardingRequirements = [
    { code: 'RG', label: 'RG / Identity document', category: 'PERSONAL_DOCUMENT' as const, sortOrder: 1 },
    { code: 'CPF', label: 'CPF', category: 'PERSONAL_DOCUMENT' as const, sortOrder: 2 },
    { code: 'ADDRESS', label: 'Proof of address', category: 'PERSONAL_DOCUMENT' as const, sortOrder: 3 },
    { code: 'WORK_CARD', label: 'Work card (CTPS)', category: 'PERSONAL_DOCUMENT' as const, sortOrder: 4 },
    { code: 'CONTRACT', label: 'Signed contract', category: 'CONTRACT' as const, sortOrder: 5 },
  ];

  for (const req of onboardingRequirements) {
    await prisma.onboardingDocumentRequirement.upsert({
      where: { tenantId_code: { tenantId: tenantMoonsofts.id, code: req.code } },
      create: {
        tenantId: tenantMoonsofts.id,
        code: req.code,
        label: req.label,
        category: req.category,
        isRequired: true,
        sortOrder: req.sortOrder,
      },
      update: { label: req.label, sortOrder: req.sortOrder },
    });
  }

  await seedUser({
    id: IDS.userSuperAdmin,
    tenantId: tenantSystem.id,
    email: 'admin@portalrh.com',
    password: 'admin123',
    name: 'Super Admin',
    roleId: superRole.id,
    cpf: '00000000191',
    jobTitle: 'Platform Administrator',
  });

  await seedUser({
    id: IDS.userHr,
    tenantId: tenantMoonsofts.id,
    branchId: defaultBranchId,
    email: 'rh@moonsofts.com',
    password: 'rh123',
    name: 'Ana RH',
    roleId: hrRole.id,
    cpf: '52998224725',
    department: 'Human Resources',
    jobTitle: 'HR Analyst',
  });

  await seedUser({
    id: IDS.userManager,
    tenantId: tenantMoonsofts.id,
    branchId: branches[1]?.id ?? defaultBranchId,
    email: 'gestor@moonsofts.com',
    password: 'gestor123',
    name: 'Carlos Gestor',
    roleId: managerRole.id,
    cpf: '39053344705',
    department: 'Engineering',
    jobTitle: 'Engineering Manager',
  });

  const employee = await seedUser({
    id: IDS.userEmployee,
    tenantId: tenantMoonsofts.id,
    branchId: branches[2]?.id ?? defaultBranchId,
    email: 'colaborador@moonsofts.com',
    password: 'colab123',
    name: 'Diego Colaborador',
    roleId: employeeRole.id,
    cpf: '12345678909',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
  });

  const requirements = await prisma.onboardingDocumentRequirement.findMany({
    where: { tenantId: tenantMoonsofts.id, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const onboarding = await prisma.onboardingProcess.upsert({
    where: { id: 'c0000000-0000-0000-0000-000000000001' },
    create: {
      id: 'c0000000-0000-0000-0000-000000000001',
      tenantId: tenantMoonsofts.id,
      userId: employee.id,
      status: 'DRAFT',
      progressPercent: 0,
    },
    update: {},
  });

  for (const req of requirements) {
    await prisma.onboardingDocumentSubmission.upsert({
      where: { processId_requirementId: { processId: onboarding.id, requirementId: req.id } },
      create: {
        tenantId: tenantMoonsofts.id,
        processId: onboarding.id,
        requirementId: req.id,
        status: 'PENDING',
      },
      update: {},
    });
  }

  await prisma.systemSetting.upsert({
    where: {
      scope_tenantId_key: { scope: 'TENANT', tenantId: tenantMoonsofts.id, key: 'onboarding.enabled' },
    },
    create: {
      scope: 'TENANT',
      tenantId: tenantMoonsofts.id,
      key: 'onboarding.enabled',
      value: true,
    },
    update: { value: true },
  });

  const globalMaintenance = await prisma.systemSetting.findFirst({
    where: { scope: 'GLOBAL', key: 'platform.maintenance', tenantId: null },
  });
  if (globalMaintenance) {
    await prisma.systemSetting.update({
      where: { id: globalMaintenance.id },
      data: { value: false },
    });
  } else {
    await prisma.systemSetting.create({
      data: {
        scope: 'GLOBAL',
        tenantId: null,
        key: 'platform.maintenance',
        value: false,
      },
    });
  }

  console.log(`Seed completed (${branches.length} branches).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
