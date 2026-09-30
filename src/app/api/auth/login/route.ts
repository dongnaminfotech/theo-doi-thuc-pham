import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonSuccess, jsonError, jsonForbidden } from '@/lib/api-response';
import { createSessionValue, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { verifyPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase().trim();
    const password = typeof body.password === 'string' ? body.password : '';

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

    if (!password) {
      return jsonError('Vui lòng nhập mật khẩu tài khoản', 'PASSWORD_REQUIRED', 400);
    }
    if (!user.passwordHash) {
      return jsonForbidden('Tài khoản chưa được thiết lập mật khẩu. Vui lòng liên hệ Quản trị viên.');
    }
    if (!verifyPassword(password, user.passwordHash)) {
      return jsonForbidden('Email hoặc mật khẩu không chính xác.');
    }

    const sessionVal = createSessionValue(user);
    const res = jsonSuccess({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        hasPassword: !!user.passwordHash || !!password,
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
      maxAge: SESSION_MAX_AGE_SECONDS,
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
