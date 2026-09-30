import { prisma } from '@/lib/prisma';
import UsersManager from './users-manager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const [users, schools] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        passwordHash: true,
        userSchools: { select: { schoolId: true, school: { select: { name: true } } } },
      },
      orderBy: { email: 'asc' },
    }),
    prisma.school.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const safeUsers = users.map(({ passwordHash, ...user }) => ({
    ...user,
    hasPassword: Boolean(passwordHash),
  }));

  return <UsersManager initialUsers={safeUsers} schools={schools} />;
}
