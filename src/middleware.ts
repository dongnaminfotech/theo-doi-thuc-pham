import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'ng_session';

function base64UrlToBytes(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function hasValidSession(value: string | undefined): Promise<boolean> {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!value || !secret || secret.length < 32) return false;
    const [payload, signature, extra] = value.split('.');
    if (!payload || !signature || extra) return false;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const validSignature = await crypto.subtle.verify(
      'HMAC', key, base64UrlToBytes(signature), new TextEncoder().encode(payload),
    );
    if (!validSignature) return false;

    const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as {
      id?: unknown; email?: unknown; expiresAt?: unknown;
    };
    return typeof session.id === 'string' && typeof session.email === 'string' &&
      typeof session.expiresAt === 'number' && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  if (await hasValidSession(request.cookies.get(SESSION_COOKIE_NAME)?.value)) {
    return NextResponse.next();
  }
  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ['/admin/((?!login(?:/|$)).*)'] };
