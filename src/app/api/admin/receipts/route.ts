import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canManageInventory } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { InventoryService } from '@/services/inventory.service';
import { createReceiptSchema } from '@/validators/receipt';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('schoolId');

  if (!schoolId) {
    return jsonError('schoolId là bắt buộc');
  }

  if (!canManageInventory(user, schoolId)) {
    return jsonForbidden('Bạn không có quyền xem phiếu nhập kho trường này');
  }

  const receipts = await InventoryService.getReceipts(schoolId);
  return jsonSuccess(receipts);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  try {
    const body = await req.json();
    const validated = createReceiptSchema.parse(body);

    if (!canManageInventory(user, validated.schoolId)) {
      return jsonForbidden('Bạn không có quyền nhập kho cho trường này');
    }

    const receipt = await InventoryService.createReceipt(validated, user);

    await logAudit({
      actor: user,
      schoolId: validated.schoolId,
      action: 'CREATE_RECEIPT',
      entityType: 'Receipt',
      entityId: receipt.id,
      afterData: receipt,
    });

    return jsonSuccess(receipt, 201);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
