import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonSuccess, jsonError, jsonForbidden } from '@/lib/api-response';
import { createSessionValue, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase().trim();

    if (!email) {
      return jsonError('Vui lòng cung cấp email', 'VALIDATION_ERROR', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userSchools: {
          include: { school: true },
        },
      },
    });

    if (!user) {
      return jsonForbidden('Email không thuộc danh sách được cấp quyền truy cập. Vui lòng liên hệ Quản trị viên (SUPER_ADMIN).');
    }

    if (user.status !== 'ACTIVE') {
      return jsonForbidden('Tài khoản của bạn đã bị vô hiệu hóa (DISABLED). Vui lòng liên hệ Quản trị viên.');
    }

    const sessionVal = createSessionValue(user);
    const res = jsonSuccess({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        schools: user.userSchools.map((us) => us.school),
      },
    });

    // Set secure cookie
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionVal,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    await logAudit({
      actor: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        schoolIds: user.userSchools.map((s) => s.schoolId),
      },
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    });

    return res;
  } catch (error: any) {
    return jsonError(error.message || 'Đăng nhập thất bại', 'INTERNAL_ERROR', 500);
  }
}
