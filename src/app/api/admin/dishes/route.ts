import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { CatalogService } from '@/services/catalog.service';
import { createDishSchema } from '@/validators/dish';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId') || undefined;

  const dishes = await CatalogService.getDishes(categoryId);
  return jsonSuccess(dishes);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden('Chỉ SUPER_ADMIN mới có quyền tạo món ăn dùng chung');

  try {
    const body = await req.json();
    const validated = createDishSchema.parse(body);
    const dish = await CatalogService.createDish(validated);

    await logAudit({
      actor: user,
      action: 'CREATE_DISH',
      entityType: 'Dish',
      entityId: dish.id,
      afterData: dish,
    });

    return jsonSuccess(dish, 201);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
