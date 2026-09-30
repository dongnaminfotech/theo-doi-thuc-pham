import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { UserService } from '@/services/user.service';
import { changePasswordSchema } from '@/validators/user';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  try {
    const body = await req.json();
    const validated = changePasswordSchema.parse(body);

    await UserService.changePassword(
      user.id,
      validated.currentPassword,
      validated.newPassword
    );

    await logAudit({
      actor: user,
      action: 'CHANGE_PASSWORD',
      entityType: 'User',
      entityId: user.id,
    });

    return jsonSuccess({ message: 'Đổi mật khẩu thành công' });
  } catch (error: any) {
    return jsonError(error.message || 'Đổi mật khẩu thất bại', 'VALIDATION_ERROR', 400);
  }
}
