import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canManageInventory } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { InventoryService } from '@/services/inventory.service';
import { stockAdjustmentSchema } from '@/validators/inventory';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  try {
    const body = await req.json();
    const validated = stockAdjustmentSchema.parse(body);

    if (!canManageInventory(user, validated.schoolId)) {
      return jsonForbidden('Bạn không có quyền điều chỉnh tồn kho của trường này');
    }

    const tx = await InventoryService.adjustStock(validated, user);

    await logAudit({
      actor: user,
      schoolId: validated.schoolId,
      action: 'ADJUST_STOCK',
      entityType: 'InventoryTransaction',
      entityId: tx.id,
      afterData: { ...validated, txId: tx.id },
    });

    return jsonSuccess(tx, 201);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
