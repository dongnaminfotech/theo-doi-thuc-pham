import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { SupplierService } from '@/services/supplier.service';
import { createSupplierSchema } from '@/validators/supplier';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const suppliers = await SupplierService.getSuppliers();
  return jsonSuccess(suppliers);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden('Chỉ SUPER_ADMIN mới có quyền tạo nhà cung cấp dùng chung');

  try {
    const body = await req.json();
    const validated = createSupplierSchema.parse(body);
    const supplier = await SupplierService.createSupplier(validated);

    await logAudit({
      actor: user,
      action: 'CREATE_SUPPLIER',
      entityType: 'Supplier',
      entityId: supplier.id,
      afterData: supplier,
    });

    return jsonSuccess(supplier, 201);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
