import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { UserService } from '@/services/user.service';
import { createUserSchema } from '@/validators/user';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden('Chỉ SUPER_ADMIN mới có quyền xem danh sách người dùng');

  const users = await UserService.getUsers();
  return jsonSuccess(users);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden('Chỉ SUPER_ADMIN mới có quyền tạo người dùng');

  try {
    const body = await req.json();
    const validated = createUserSchema.parse(body);
    const newUser = await UserService.createUser(validated);

    await logAudit({
      actor: user,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: newUser.id,
      afterData: { email: newUser.email, role: newUser.role, status: newUser.status },
    });

    return jsonSuccess(newUser, 201);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
