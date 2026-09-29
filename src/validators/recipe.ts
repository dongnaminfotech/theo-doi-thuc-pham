import { z } from 'zod';

export const createRecipeSchema = z.object({
  dishId: z.string().uuid('Món ăn không hợp lệ'),
  ingredientId: z.string().uuid('Nguyên liệu không hợp lệ'),
  qtyPerServing: z.number().positive('Định lượng mỗi suất phải lớn hơn 0'),
  wastePercent: z.number().min(0, 'Tỷ lệ hao hụt không được âm').default(0),
  unit: z.string().min(1, 'Đơn vị không được để trống'),
  conversionFactor: z.number().positive('Hệ số quy đổi phải lớn hơn 0').default(1),
  isActive: z.boolean().default(true),
});

export const updateRecipeSchema = createRecipeSchema.partial();
