import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonNotFound, jsonError } from '@/lib/api-response';
import { SupplierService } from '@/services/supplier.service';
import { updateSupplierSchema } from '@/validators/supplier';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  const supplier = await SupplierService.getSupplierById(id);
  if (!supplier) return jsonNotFound('Nhà cung cấp không tồn tại');

  return jsonSuccess(supplier);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden();

  const { id } = await params;
  try {
    const body = await req.json();
    const validated = updateSupplierSchema.parse(body);
    const updated = await SupplierService.updateSupplier(id, validated);

    await logAudit({
      actor: user,
      action: 'UPDATE_SUPPLIER',
      entityType: 'Supplier',
      entityId: id,
      afterData: updated,
    });

    return jsonSuccess(updated);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
