import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canAccessSchool, canManageSchool } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonNotFound, jsonForbidden, jsonError } from '@/lib/api-response';
import { SchoolService } from '@/services/school.service';
import { updateSchoolSchema } from '@/validators/school';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  if (!canAccessSchool(user, id)) {
    return jsonNotFound('Trường không tìm thấy hoặc không thuộc quyền quản lý');
  }

  const school = await SchoolService.getById(id);
  if (!school) return jsonNotFound();

  return jsonSuccess(school);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  if (!canManageSchool(user, id)) {
    return jsonForbidden('Bạn không có quyền chỉnh sửa thông tin trường này');
  }

  try {
    const body = await req.json();
    const validated = updateSchoolSchema.parse(body);

    const oldSchool = await SchoolService.getById(id);
    const updated = await SchoolService.update(id, validated);

    await logAudit({
      actor: user,
      schoolId: id,
      action: 'UPDATE_SCHOOL',
      entityType: 'School',
      entityId: id,
      beforeData: oldSchool,
      afterData: updated,
    });

    return jsonSuccess(updated);
  } catch (error: any) {
    return jsonError(error.message || 'Lỗi cập nhật trường học', 'VALIDATION_ERROR', 400, error.errors);
  }
}
