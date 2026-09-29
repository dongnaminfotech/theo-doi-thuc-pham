import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { SupplierService } from '@/services/supplier.service';
import { updateSupplierDocumentSchema } from '@/validators/supplier';
import { logAudit } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden();

  const { id } = await params;
  try {
    const body = await req.json();
    const validated = updateSupplierDocumentSchema.parse(body);
    const updated = await SupplierService.updateDocumentStatus(id, validated);

    await logAudit({
      actor: user,
      action: 'UPDATE_SUPPLIER_DOCUMENT',
      entityType: 'SupplierDocument',
      entityId: id,
      afterData: updated,
    });

    return jsonSuccess(updated);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden();

  const { id } = await params;
  try {
    await SupplierService.deleteDocument(id);

    await logAudit({
      actor: user,
      action: 'DELETE_SUPPLIER_DOCUMENT',
      entityType: 'SupplierDocument',
      entityId: id,
    });

    return jsonSuccess({ message: 'Đã xóa chứng từ' });
  } catch (error: any) {
    return jsonError(error.message, 'INTERNAL_ERROR', 500);
  }
}
