import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { CatalogService } from '@/services/catalog.service';
import { createIngredientSchema } from '@/validators/ingredient';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const ingredients = await CatalogService.getIngredients();
  return jsonSuccess(ingredients);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden('Chỉ SUPER_ADMIN mới có quyền tạo nguyên liệu');

  try {
    const body = await req.json();
    const validated = createIngredientSchema.parse(body);
    const ingredient = await CatalogService.createIngredient(validated);

    await logAudit({
      actor: user,
      action: 'CREATE_INGREDIENT',
      entityType: 'Ingredient',
      entityId: ingredient.id,
      afterData: ingredient,
    });

    return jsonSuccess(ingredient, 201);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
