import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  schoolId: z.string().uuid('Trường không hợp lệ'),
  lotId: z.string().uuid('Lô hàng không hợp lệ'),
  txType: z.enum(['ADJUST_IN', 'ADJUST_OUT', 'RETURN']),
  quantity: z.number().positive('Số lượng điều chỉnh phải lớn hơn 0'),
  reason: z.string().min(1, 'Lý do điều chỉnh không được để trống'),
});
