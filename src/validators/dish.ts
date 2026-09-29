import { z } from 'zod';

export const createDishSchema = z.object({
  categoryId: z.string().uuid('Nhóm món không hợp lệ'),
  code: z.string().min(1, 'Mã món không được để trống').max(50),
  name: z.string().min(1, 'Tên món không được để trống').max(200),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateDishSchema = createDishSchema.partial();
