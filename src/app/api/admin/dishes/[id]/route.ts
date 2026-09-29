import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonNotFound, jsonError } from '@/lib/api-response';
import { CatalogService } from '@/services/catalog.service';
import { updateDishSchema } from '@/validators/dish';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  const dish = await CatalogService.getDishById(id);
  if (!dish) return jsonNotFound('Món ăn không tồn tại');

  return jsonSuccess(dish);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden();

  const { id } = await params;
  try {
    const body = await req.json();
    const validated = updateDishSchema.parse(body);
    const updated = await CatalogService.updateDish(id, validated);

    await logAudit({
      actor: user,
      action: 'UPDATE_DISH',
      entityType: 'Dish',
      entityId: id,
      afterData: updated,
    });

    return jsonSuccess(updated);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
