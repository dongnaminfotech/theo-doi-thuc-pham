import { prisma } from './prisma';
import { UserContext } from './rbac';

export interface CreateAuditLogParams {
  schoolId?: string | null;
  actor?: UserContext | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit(params: CreateAuditLogParams) {
  try {
    const sanitize = (data: unknown) => {
      if (!data) return null;
      const clone = JSON.parse(JSON.stringify(data));
      // Remove sensitive fields
      if (typeof clone === 'object' && clone !== null) {
        delete clone.password;
        delete clone.token;
        delete clone.secret;
      }
      return JSON.stringify(clone);
    };

    await prisma.auditLog.create({
      data: {
        schoolId: params.schoolId || null,
        actorId: params.actor?.id || null,
        actorEmail: params.actor?.email || 'system',
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        beforeData: sanitize(params.beforeData),
        afterData: sanitize(params.afterData),
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
