import { z } from 'zod';

export const createMenuTemplateItemSchema = z.object({
  schoolId: z.string().uuid().optional().nullable(),
  dayOfWeek: z.number().int().min(1).max(7),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER']),
  dishId: z.string().uuid('Món ăn không hợp lệ'),
  sortOrder: z.number().int().default(0),
});

export const generateWeeklyMealsSchema = z.object({
  schoolId: z.string().uuid('Trường không hợp lệ'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu phải là YYYY-MM-DD'), // Monday
  servingsCount: z.number().int().positive('Số suất ăn phải lớn hơn 0'),
  overwriteExisting: z.boolean().default(false),
});
