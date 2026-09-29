import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
  name: z.string().min(1, 'Tên người dùng không được để trống').max(100),
  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'KITCHEN', 'WAREHOUSE', 'AUDITOR']),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  schoolIds: z.array(z.string().uuid()).default([]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'KITCHEN', 'WAREHOUSE', 'AUDITOR']).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  schoolIds: z.array(z.string().uuid()).optional(),
});
