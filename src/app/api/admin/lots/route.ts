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
  const ingredientId = searchParams.get('ingredientId') || undefined;

  if (!schoolId) {
    return jsonError('schoolId là bắt buộc');
  }

  if (!canManageInventory(user, schoolId)) {
    return jsonForbidden();
  }

  const lots = await InventoryService.getLots(schoolId, ingredientId);
  return jsonSuccess(lots);
}
