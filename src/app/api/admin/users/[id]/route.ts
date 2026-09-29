import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError, jsonNotFound } from '@/lib/api-response';
import { UserService } from '@/services/user.service';
import { updateUserSchema } from '@/validators/user';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden();

  const { id } = await params;
  const targetUser = await UserService.getUserById(id);
  if (!targetUser) return jsonNotFound('Người dùng không tồn tại');

  return jsonSuccess(targetUser);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden();

  const { id } = await params;
  try {
    const body = await req.json();
    const validated = updateUserSchema.parse(body);

    const oldUser = await UserService.getUserById(id);
    const updated = await UserService.updateUser(id, validated);

    await logAudit({
      actor: user,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: id,
      beforeData: oldUser,
      afterData: updated,
    });

    return jsonSuccess(updated);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
