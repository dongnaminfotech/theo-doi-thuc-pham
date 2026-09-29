import { z } from 'zod';

export const createSchoolSchema = z.object({
  code: z.string().min(1, 'Mã trường không được để trống').max(50),
  name: z.string().min(1, 'Tên trường không được để trống').max(200),
  slug: z.string().min(1, 'Slug không được để trống').regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateSchoolSchema = createSchoolSchema.partial();
