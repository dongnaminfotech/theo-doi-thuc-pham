import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { UserContext } from './rbac';

export type AuthUser = UserContext;

const SESSION_COOKIE_NAME = 'ng_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  id: string;
  email: string;
  role: string;
  issuedAt: number;
  expiresAt: number;
}

function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET phải có ít nhất 32 ký tự');
  return secret;
}

function signPayload(encodedPayload: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
}

export function createSessionValue(user: { id: string; email: string; role: string }, now = Date.now()): string {
  const payload: SessionPayload = {
    id: user.id,
    email: user.email.toLowerCase().trim(),
    role: user.role,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifySessionValue(value: string, now = Date.now()): SessionPayload | null {
  try {
    const [encodedPayload, suppliedSignature, extra] = value.split('.');
    if (!encodedPayload || !suppliedSignature || extra) return null;
    const expectedSignature = signPayload(encodedPayload);
    const supplied = Buffer.from(suppliedSignature);
    const expected = Buffer.from(expectedSignature);
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.id || !payload.email || !payload.expiresAt || payload.expiresAt <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Gets the authenticated user context from a signed session cookie. */
export async function getAuthUser(req: NextRequest): Promise<UserContext | null> {
  try {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME);
    if (!cookie?.value) return null;
    const session = verifySessionValue(cookie.value);
    if (!session) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        userSchools: {
          select: { schoolId: true },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      schoolIds: user.userSchools.map((us) => us.schoolId),
    };
  } catch (error) {
    console.error('Error in getAuthUser:', error);
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
