import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { SchoolService } from '@/services/school.service';
import { createSchoolSchema } from '@/validators/school';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const schoolIds = user.role === 'SUPER_ADMIN' ? undefined : user.schoolIds;
  const schools = await SchoolService.getAll(schoolIds);
  return jsonSuccess(schools);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') {
    return jsonForbidden('Chỉ SUPER_ADMIN mới có quyền tạo trường mới');
  }

  try {
    const body = await req.json();
    const validated = createSchoolSchema.parse(body);

    const school = await SchoolService.create(validated);

    await logAudit({
      actor: user,
      schoolId: school.id,
      action: 'CREATE_SCHOOL',
      entityType: 'School',
      entityId: school.id,
      afterData: school,
    });

    return jsonSuccess(school, 201);
  } catch (error: any) {
    return jsonError(error.message || 'Lỗi tạo trường học', 'VALIDATION_ERROR', 400, error.errors);
  }
}
