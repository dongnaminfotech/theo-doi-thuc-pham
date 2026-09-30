import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonSuccess, jsonUnauthorized } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return jsonUnauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      userSchools: {
        include: { school: true },
      },
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    return jsonUnauthorized();
  }

  return jsonSuccess({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      hasPassword: !!user.passwordHash,
      schools: user.userSchools.map((us) => us.school),
    },
  });
}
