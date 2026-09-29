import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { UserContext } from './rbac';

export type AuthUser = UserContext;

const SESSION_COOKIE_NAME = 'ng_session';

/**
 * Gets the authenticated user context from request
 */
export async function getAuthUser(req: NextRequest): Promise<UserContext | null> {
  try {
    // 1. Check Bearer token or custom header or Cookie
    const authHeader = req.headers.get('authorization');
    let sessionEmail: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionEmail = authHeader.replace('Bearer ', '').trim();
    } else {
      const cookie = req.cookies.get(SESSION_COOKIE_NAME);
      if (cookie?.value) {
        try {
          const decoded = Buffer.from(cookie.value, 'base64').toString('utf-8');
          const parsed = JSON.parse(decoded);
          sessionEmail = parsed.email;
        } catch {
          sessionEmail = cookie.value;
        }
      }
    }

    if (!sessionEmail) return null;

    // 2. Query user from database
    const user = await prisma.user.findUnique({
      where: { email: sessionEmail.toLowerCase().trim() },
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

/**
 * Creates session cookie payload
 */
export function createSessionValue(user: { id: string; email: string; role: string }): string {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: Date.now(),
  });
  return Buffer.from(payload).toString('base64');
}

export { SESSION_COOKIE_NAME };
