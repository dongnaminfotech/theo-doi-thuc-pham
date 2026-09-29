import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { SupplierService } from '@/services/supplier.service';
import { createSupplierDocumentSchema } from '@/validators/supplier';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden();

  const { id } = await params;
  try {
    const body = await req.json();
    const validated = createSupplierDocumentSchema.parse({ ...body, supplierId: id });
    const doc = await SupplierService.addDocument(validated);

    await logAudit({
      actor: user,
      action: 'ADD_SUPPLIER_DOCUMENT',
      entityType: 'SupplierDocument',
      entityId: doc.id,
      afterData: doc,
    });

    return jsonSuccess(doc, 201);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
