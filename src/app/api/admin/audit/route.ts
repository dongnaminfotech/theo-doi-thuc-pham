import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('schoolId') || undefined;
  const entityType = searchParams.get('entityType') || undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  // Auditors and Super Admins can see audit logs
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'AUDITOR' && user.role !== 'SCHOOL_ADMIN') {
    return jsonForbidden();
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      schoolId: schoolId || (user.role === 'SUPER_ADMIN' ? undefined : { in: user.schoolIds }),
      entityType: entityType || undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      school: { select: { id: true, name: true, code: true } },
    },
  });

  return jsonSuccess(logs);
}
