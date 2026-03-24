import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { AdminGovernanceService } from './admin-governance.service';

describe('AdminGovernanceService', () => {
  let svc: AdminGovernanceService;
  let prisma: {
    user: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    session: { updateMany: jest.Mock };
    internalAdminAuditLog: { count: jest.Mock; findMany: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    const prismaMock: any = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        updateMany: jest.fn(),
      },
      internalAdminAuditLog: {
        count: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminGovernanceService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    svc = moduleRef.get(AdminGovernanceService);
    prisma = moduleRef.get(PrismaService) as any;
  });

  it('creates an internal admin user with normalized email and permissions', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'ops@example.com',
      name: 'Ops',
      role: 'operations_admin',
      isActive: true,
      lastLogin: null,
      createdAt: new Date('2026-03-23T00:00:00.000Z'),
    });

    const created = await svc.createInternalUser({
      email: 'OPS@EXAMPLE.COM ',
      password: 'ChangeMe123!',
      role: 'operations_admin',
      name: 'Ops',
    });

    expect(created.email).toBe('ops@example.com');
    expect(created.role).toBe('operations_admin');
    expect(created.permissions).toContain('admin.observability.read');
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('rejects duplicate internal admin email', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      svc.createInternalUser({
        email: 'ops@example.com',
        password: 'ChangeMe123!',
        role: 'operations_admin',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects self-deactivation for internal admins', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'ops@example.com',
      name: 'Ops',
      role: 'operations_admin',
      isActive: true,
      lastLogin: null,
      createdAt: new Date('2026-03-23T00:00:00.000Z'),
    });

    await expect(
      svc.updateInternalUser('u1', { is_active: false }, 'u1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('revokes sessions when role or password changes', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'ops@example.com',
      name: 'Ops',
      role: 'operations_admin',
      isActive: true,
      lastLogin: null,
      createdAt: new Date('2026-03-23T00:00:00.000Z'),
    });
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      email: 'ops@example.com',
      name: 'Ops Lead',
      role: 'support_admin',
      isActive: true,
      lastLogin: null,
      createdAt: new Date('2026-03-23T00:00:00.000Z'),
    });

    const updated = await svc.updateInternalUser(
      'u1',
      { name: 'Ops Lead', role: 'support_admin', password: 'Reset123!' },
      'admin2',
    );

    expect(updated.role).toBe('support_admin');
    expect(prisma.session.updateMany).toHaveBeenCalled();
  });

  it('throws when updating a non-admin user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u2',
      email: 'staff@example.com',
      name: 'Staff',
      role: 'staff',
      isActive: true,
      lastLogin: null,
      createdAt: new Date('2026-03-23T00:00:00.000Z'),
    });

    await expect(
      svc.updateInternalUser('u2', { role: 'support_admin' }, 'admin2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
