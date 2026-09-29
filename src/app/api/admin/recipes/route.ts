import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { CatalogService } from '@/services/catalog.service';
import { createRecipeSchema } from '@/validators/recipe';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden('Chỉ SUPER_ADMIN mới có quyền cập nhật định lượng công thức');

  try {
    const body = await req.json();
    const validated = createRecipeSchema.parse(body);
    const recipe = await CatalogService.upsertRecipe(validated);

    await logAudit({
      actor: user,
      action: 'UPSERT_RECIPE',
      entityType: 'Recipe',
      entityId: `${recipe.dishId}_${recipe.ingredientId}`,
      afterData: recipe,
    });

    return jsonSuccess(recipe, 200);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden();

  try {
    const { searchParams } = new URL(req.url);
    const dishId = searchParams.get('dishId');
    const ingredientId = searchParams.get('ingredientId');

    if (!dishId || !ingredientId) {
      return jsonError('dishId và ingredientId là bắt buộc');
    }

    await CatalogService.deleteRecipe(dishId, ingredientId);

    await logAudit({
      actor: user,
      action: 'DELETE_RECIPE',
      entityType: 'Recipe',
      entityId: `${dishId}_${ingredientId}`,
    });

    return jsonSuccess({ message: 'Đã xóa công thức' });
  } catch (error: any) {
    return jsonError(error.message, 'INTERNAL_ERROR', 500);
  }
}
