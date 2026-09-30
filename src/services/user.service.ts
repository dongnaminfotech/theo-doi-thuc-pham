import { prisma } from '@/lib/prisma';
import { Role, UserStatus } from '@prisma/client';
import { hashPassword, verifyPassword } from '@/lib/password';

export class UserService {
  static async getUsers() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        userSchools: {
          include: { school: true },
        },
        _count: { select: { createdMeals: true, receipts: true } },
      },
    });

    return users.map((u) => {
      const { passwordHash, ...rest } = u;
      return {
        ...rest,
        hasPassword: !!passwordHash,
      };
    });
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userSchools: {
          include: { school: true },
        },
      },
    });

    if (!user) return null;

    const { passwordHash, ...rest } = user;
    return {
      ...rest,
      hasPassword: !!passwordHash,
    };
  }

  static async createUser(data: {
    email: string;
    name: string;
    role: Role;
    status?: UserStatus;
    schoolIds?: string[];
    password?: string | null;
  }) {
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error(`Email "${email}" đã tồn tại trong hệ thống`);
    }

    const passwordHash = data.password && data.password.trim() ? hashPassword(data.password.trim()) : null;

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: data.name.trim(),
          role: data.role,
          status: data.status || 'ACTIVE',
          passwordHash,
        },
      });

      if (data.schoolIds && data.schoolIds.length > 0) {
        for (const schoolId of data.schoolIds) {
          await tx.userSchool.create({
            data: {
              userId: user.id,
              schoolId,
            },
          });
        }
      }

      const { passwordHash: _, ...sanitized } = user;
      return { ...sanitized, hasPassword: !!passwordHash };
    });
  }

  static async updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: Role;
      status?: UserStatus;
      schoolIds?: string[];
      password?: string | null;
    },
    currentUserId?: string
  ) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Người dùng không tồn tại');
    }

    const removesSuperAdminRole = Boolean(data.role && data.role !== 'SUPER_ADMIN');
    const disablesUser = data.status === 'DISABLED';
    if (id === currentUserId && (removesSuperAdminRole || disablesUser)) {
      throw new Error('Bạn không thể tự hạ quyền hoặc khóa tài khoản của chính mình');
    }
    if (existing.role === 'SUPER_ADMIN' && existing.status === 'ACTIVE' && (removesSuperAdminRole || disablesUser)) {
      const activeSuperAdmins = await prisma.user.count({ where: { role: 'SUPER_ADMIN', status: 'ACTIVE' } });
      if (activeSuperAdmins <= 1) throw new Error('Hệ thống phải còn ít nhất một SUPER_ADMIN đang hoạt động');
    }

    let passwordHash: string | undefined = undefined;
    if (data.password && data.password.trim().length > 0) {
      passwordHash = hashPassword(data.password.trim());
    }

    let email = undefined;
    if (data.email && data.email.toLowerCase().trim() !== existing.email) {
      email = data.email.toLowerCase().trim();
      const duplicate = await prisma.user.findUnique({ where: { email } });
      if (duplicate) {
        throw new Error(`Email "${email}" đã được sử dụng bởi tài khoản khác`);
      }
    }

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          name: data.name ? data.name.trim() : undefined,
          email,
          role: data.role,
          status: data.status,
          passwordHash,
        },
      });

      if (data.schoolIds !== undefined) {
        await tx.userSchool.deleteMany({ where: { userId: id } });
        for (const sId of data.schoolIds) {
          await tx.userSchool.create({
            data: {
              userId: id,
              schoolId: sId,
            },
          });
        }
      }

      const { passwordHash: _, ...sanitized } = updatedUser;
      return { ...sanitized, hasPassword: !!updatedUser.passwordHash };
    });
  }

  static async deleteUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new Error('Bạn không thể tự xóa tài khoản của chính mình');
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      throw new Error('Người dùng cần xóa không tồn tại');
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      const activeSuperAdmins = await prisma.user.count({
        where: {
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        },
      });
      if (activeSuperAdmins <= 1) {
        throw new Error('Không thể xóa Quản trị viên tối cao (SUPER_ADMIN) duy nhất còn hoạt động trong hệ thống');
      }
    }

    return prisma.$transaction(async (tx) => {
      await tx.userSchool.deleteMany({ where: { userId: id } });

      await tx.mealPlan.updateMany({
        where: { createdById: id },
        data: { createdById: null },
      });
      await tx.mealPlan.updateMany({
        where: { updatedById: id },
        data: { updatedById: null },
      });
      await tx.receipt.updateMany({
        where: { createdById: id },
        data: { createdById: null },
      });
      await tx.inventoryTransaction.updateMany({
        where: { actorId: id },
        data: { actorId: null },
      });
      await tx.traceSnapshot.updateMany({
        where: { publishedById: id },
        data: { publishedById: null },
      });
      await tx.auditLog.updateMany({
        where: { actorId: id },
        data: { actorId: null },
      });

      return tx.user.delete({
        where: { id },
      });
    });
  }

  static async changePassword(
    userId: string,
    currentPassword?: string | null,
    newPassword?: string
  ) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        throw new Error('Vui lòng nhập mật khẩu hiện tại');
      }
      const isMatch = verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new Error('Mật khẩu hiện tại không chính xác');
      }
    }

    const newHash = hashPassword(newPassword.trim());
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  }
}
