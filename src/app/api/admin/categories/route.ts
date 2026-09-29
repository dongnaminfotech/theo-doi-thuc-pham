import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { CatalogService } from '@/services/catalog.service';
import { createCategorySchema } from '@/validators/category';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const categories = await CatalogService.getCategories();
  return jsonSuccess(categories);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden('Chỉ SUPER_ADMIN mới có quyền quản lý nhóm món');

  try {
    const body = await req.json();
    const validated = createCategorySchema.parse(body);
    const category = await CatalogService.createCategory(validated);

    await logAudit({
      actor: user,
      action: 'CREATE_CATEGORY',
      entityType: 'DishCategory',
      entityId: category.id,
      afterData: category,
    });

    return jsonSuccess(category, 201);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
