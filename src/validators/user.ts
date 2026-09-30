import { z } from 'zod';

export const USER_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'KITCHEN', 'WAREHOUSE', 'AUDITOR'] as const;

export const createUserSchema = z.object({
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
  name: z.string().min(1, 'Tên người dùng không được để trống').max(100),
  role: z.enum(USER_ROLES),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  schoolIds: z.array(z.string().uuid()).default([]),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .optional()
    .or(z.literal('')),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống').max(100).optional(),
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim().optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  schoolIds: z.array(z.string().uuid()).optional(),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .optional()
    .or(z.literal('')),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional().or(z.literal('')),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(6, 'Xác nhận mật khẩu phải có ít nhất 6 ký tự'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  });

export const resetUserPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});
