import { z } from 'zod';

export const mealDishInputSchema = z.object({
  dishId: z.string().uuid('Món ăn không hợp lệ'),
  sortOrder: z.number().int().default(0),
  notes: z.string().optional().nullable(),
});

export const createMealPlanSchema = z.object({
  schoolId: z.string().uuid('Trường không hợp lệ'),
  mealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bữa ăn phải có định dạng YYYY-MM-DD'),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER']),
  slotCode: z.string().default('DEFAULT'),
  servingsCount: z.number().int().positive('Số suất ăn phải lớn hơn 0'),
  notes: z.string().optional().nullable(),
  dishes: z.array(mealDishInputSchema).min(1, 'Bữa ăn phải có ít nhất 1 món'),
});

export const updateMealPlanDraftSchema = z.object({
  servingsCount: z.number().int().positive('Số suất ăn phải lớn hơn 0').optional(),
  notes: z.string().optional().nullable(),
  dishes: z.array(mealDishInputSchema).optional(),
});

export const completeMealSchema = z.object({
  photoUrl: z.string().min(1, 'Ảnh bữa ăn là bắt buộc'),
  photoStorageKey: z.string().optional().nullable(),
});

export const publishMealSchema = z.object({
  notes: z.string().optional().nullable(),
});

export const revokeMealSchema = z.object({
  reason: z.string().min(1, 'Lý do thu hồi không được để trống'),
});
