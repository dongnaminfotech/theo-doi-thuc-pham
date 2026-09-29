import { z } from 'zod';

export const createIngredientSchema = z.object({
  code: z.string().min(1, 'Mã nguyên liệu không được để trống').max(50),
  name: z.string().min(1, 'Tên nguyên liệu không được để trống').max(200),
  baseUnit: z.string().min(1, 'Đơn vị chuẩn không được để trống').max(30),
  isActive: z.boolean().default(true),
});

export const updateIngredientSchema = createIngredientSchema.partial();
