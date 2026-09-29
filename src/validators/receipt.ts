import { z } from 'zod';

export const createReceiptItemSchema = z.object({
  ingredientId: z.string().uuid('Nguyên liệu không hợp lệ'),
  unit: z.string().min(1, 'Đơn vị không được để trống'),
  quantity: z.number().positive('Số lượng nhập phải lớn hơn 0'),
  unitPrice: z.number().min(0, 'Đơn giá không được âm').default(0),
  baseQuantity: z.number().positive('Số lượng quy đổi chuẩn phải lớn hơn 0'),
  lotCode: z.string().min(1, 'Mã lô không được để trống'),
  mfgDate: z.string().min(10, 'Ngày sản xuất không hợp lệ'),
  expiryDate: z.string().min(10, 'Hạn sử dụng không hợp lệ'),
});

export const createReceiptSchema = z.object({
  schoolId: z.string().uuid('Trường không hợp lệ'),
  supplierId: z.string().uuid('Nhà cung cấp không hợp lệ'),
  receiptNumber: z.string().min(1, 'Số phiếu nhập không được để trống'),
  receiptDate: z.string().min(10, 'Ngày nhập không hợp lệ'),
  notes: z.string().optional().nullable(),
  items: z.array(createReceiptItemSchema).min(1, 'Phiếu nhập phải có ít nhất 1 mặt hàng'),
});
