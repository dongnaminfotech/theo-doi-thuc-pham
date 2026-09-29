import { prisma } from '@/lib/prisma';
import { Role, UserStatus } from '@prisma/client';

export class UserService {
  static async getUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        userSchools: {
          include: { school: true },
        },
        _count: { select: { createdMeals: true, receipts: true } },
      },
    });
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userSchools: {
          include: { school: true },
        },
      },
    });
  }

  static async createUser(data: {
    email: string;
    name: string;
    role: Role;
    status?: UserStatus;
    schoolIds?: string[];
  }) {
    const email = data.email.toLowerCase().trim();
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: data.name.trim(),
          role: data.role,
          status: data.status || 'ACTIVE',
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

      return user;
    });
  }

  static async updateUser(
    id: string,
    data: {
      name?: string;
      role?: Role;
      status?: UserStatus;
      schoolIds?: string[];
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          name: data.name ? data.name.trim() : undefined,
          role: data.role,
          status: data.status,
        },
      });

      if (data.schoolIds !== undefined) {
        // Replace school assignments
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

      return updatedUser;
    });
  }
}
