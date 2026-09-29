import { describe, it, expect } from 'vitest';
import {
  canAccessSchool,
  canManageSchool,
  canManageCatalog,
  canManageSuppliers,
  canManageInventory,
  canManageMeals,
  canPublishMeals,
  canViewAudit,
  canManageUsers,
} from '@/lib/rbac';
import { AuthUser } from '@/lib/auth';

describe('Role-Based Access Control (RBAC) System', () => {
  const superAdmin: AuthUser = {
    id: 'u1',
    email: 'admin@newgreen.vn',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    schoolIds: [],
  };

  const schoolAdminBanMai: AuthUser = {
    id: 'u2',
    email: 'admin@banmai.vn',
    name: 'School Admin Ban Mai',
    role: 'SCHOOL_ADMIN',
    status: 'ACTIVE',
    schoolIds: ['school-bm'],
  };

  const kitchenBanMai: AuthUser = {
    id: 'u3',
    email: 'kitchen@banmai.vn',
    name: 'Kitchen Staff',
    role: 'KITCHEN',
    status: 'ACTIVE',
    schoolIds: ['school-bm'],
  };

  const warehouseBanMai: AuthUser = {
    id: 'u4',
    email: 'warehouse@banmai.vn',
    name: 'Warehouse Staff',
    role: 'WAREHOUSE',
    status: 'ACTIVE',
    schoolIds: ['school-bm'],
  };

  const auditor: AuthUser = {
    id: 'u5',
    email: 'auditor@inspect.vn',
    name: 'Auditor',
    role: 'AUDITOR',
    status: 'ACTIVE',
    schoolIds: ['school-bm'],
  };

  it('SUPER_ADMIN should have global access to all features and schools', () => {
    expect(canAccessSchool(superAdmin, 'any-school-id')).toBe(true);
    expect(canManageSchool(superAdmin, 'any-school-id')).toBe(true);
    expect(canManageCatalog(superAdmin)).toBe(true);
    expect(canManageSuppliers(superAdmin)).toBe(true);
    expect(canManageInventory(superAdmin, 'any-school-id')).toBe(true);
    expect(canManageMeals(superAdmin, 'any-school-id')).toBe(true);
    expect(canPublishMeals(superAdmin, 'any-school-id')).toBe(true);
    expect(canViewAudit(superAdmin)).toBe(true);
    expect(canManageUsers(superAdmin)).toBe(true);
  });

  it('SCHOOL_ADMIN should only manage their assigned school', () => {
    expect(canAccessSchool(schoolAdminBanMai, 'school-bm')).toBe(true);
    expect(canAccessSchool(schoolAdminBanMai, 'school-other')).toBe(false);

    expect(canManageSchool(schoolAdminBanMai, 'school-bm')).toBe(true);
    expect(canManageSchool(schoolAdminBanMai, 'school-other')).toBe(false);

    expect(canPublishMeals(schoolAdminBanMai, 'school-bm')).toBe(true);
    expect(canPublishMeals(schoolAdminBanMai, 'school-other')).toBe(false);

    expect(canManageCatalog(schoolAdminBanMai)).toBe(false); // Only SUPER_ADMIN
    expect(canManageUsers(schoolAdminBanMai)).toBe(false); // Only SUPER_ADMIN
  });

  it('KITCHEN role can manage meals in their school but cannot publish meals or manage suppliers/catalog', () => {
    expect(canManageMeals(kitchenBanMai, 'school-bm')).toBe(true);
    expect(canManageMeals(kitchenBanMai, 'school-other')).toBe(false);
    expect(canPublishMeals(kitchenBanMai, 'school-bm')).toBe(false); // Cannot publish
    expect(canManageCatalog(kitchenBanMai)).toBe(false);
  });

  it('WAREHOUSE role can manage inventory in their school but cannot manage meals or catalog', () => {
    expect(canManageInventory(warehouseBanMai, 'school-bm')).toBe(true);
    expect(canManageInventory(warehouseBanMai, 'school-other')).toBe(false);
    expect(canManageMeals(warehouseBanMai, 'school-bm')).toBe(false);
  });

  it('AUDITOR can view audit logs but cannot mutate inventory or publish meals', () => {
    expect(canViewAudit(auditor)).toBe(true);
    expect(canPublishMeals(auditor, 'school-bm')).toBe(false);
    expect(canManageInventory(auditor, 'school-bm')).toBe(false);
  });
});
