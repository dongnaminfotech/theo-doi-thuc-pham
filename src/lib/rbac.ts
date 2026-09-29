import { Role } from '@prisma/client';

export interface UserContext {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  schoolIds: string[]; // List of school IDs the user is assigned to
}

export function hasSystemPermission(user: UserContext, allowedRoles: Role[]): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  return allowedRoles.includes(user.role);
}

export function canAccessSchool(user: UserContext, schoolId: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  return user.schoolIds.includes(schoolId);
}

export function canManageSchool(user: UserContext, schoolId: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'SCHOOL_ADMIN' && user.schoolIds.includes(schoolId)) return true;
  return false;
}

export function canManageInventory(user: UserContext, schoolId: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if ((user.role === 'SCHOOL_ADMIN' || user.role === 'WAREHOUSE') && user.schoolIds.includes(schoolId)) return true;
  return false;
}

export function canManageMeals(user: UserContext, schoolId: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if ((user.role === 'SCHOOL_ADMIN' || user.role === 'KITCHEN') && user.schoolIds.includes(schoolId)) return true;
  return false;
}

export function canPublishMeals(user: UserContext, schoolId: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'SCHOOL_ADMIN' && user.schoolIds.includes(schoolId)) return true;
  return false;
}

export function canManageUsers(user: UserContext): boolean {
  return user.role === 'SUPER_ADMIN';
}

export function canManageCatalog(user: UserContext): boolean {
  return user.role === 'SUPER_ADMIN';
}

export function canManageSuppliers(user: UserContext): boolean {
  return user.role === 'SUPER_ADMIN';
}

export function canViewAudit(user: UserContext): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'AUDITOR' || user.role === 'SCHOOL_ADMIN';
}

export function canManageGlobalCatalog(user: UserContext): boolean {
  return user.role === 'SUPER_ADMIN';
}
