import { z } from 'zod';

export const createCategorySchema = z.object({
  code: z.string().min(1, 'Mã nhóm món không được để trống').max(50),
  name: z.string().min(1, 'Tên nhóm món không được để trống').max(200),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();
