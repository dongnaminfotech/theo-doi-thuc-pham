import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canManageInventory } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { InventoryService } from '@/services/inventory.service';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('schoolId');

  if (!schoolId) {
    return jsonError('schoolId là bắt buộc');
  }

  if (!canManageInventory(user, schoolId)) {
    return jsonForbidden();
  }

  const summary = await InventoryService.getStockSummary(schoolId);
  return jsonSuccess(summary);
}
