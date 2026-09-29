import { NextRequest } from 'next/server';
import { jsonSuccess } from '@/lib/api-response';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(_req: NextRequest) {
  const res = jsonSuccess({ message: 'Đăng xuất thành công' });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
