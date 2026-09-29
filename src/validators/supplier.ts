import { z } from 'zod';

export const createSupplierSchema = z.object({
  code: z.string().min(1, 'Mã nhà cung cấp không được để trống').max(50),
  name: z.string().min(1, 'Tên nhà cung cấp không được để trống').max(200),
  taxCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const createSupplierDocumentSchema = z.object({
  supplierId: z.string().uuid('Nhà cung cấp không hợp lệ'),
  docType: z.string().min(1, 'Loại chứng từ không được để trống'),
  docNumber: z.string().min(1, 'Số chứng từ không được để trống'),
  issueDate: z.string().min(10, 'Ngày cấp không hợp lệ'),
  expiryDate: z.string().min(10, 'Ngày hết hạn không hợp lệ'),
  storageKey: z.string().min(1, 'File chứng từ không được để trống'),
  fileName: z.string().min(1, 'Tên file không được để trống'),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  verificationStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  isPublic: z.boolean().default(false),
});

export const updateSupplierDocumentSchema = createSupplierDocumentSchema.partial();
