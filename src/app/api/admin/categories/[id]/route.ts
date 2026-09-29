import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { CatalogService } from '@/services/catalog.service';
import { updateCategorySchema } from '@/validators/category';
import { logAudit } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();
  if (user.role !== 'SUPER_ADMIN') return jsonForbidden();

  const { id } = await params;
  try {
    const body = await req.json();
    const validated = updateCategorySchema.parse(body);
    const updated = await CatalogService.updateCategory(id, validated);

    await logAudit({
      actor: user,
      action: 'UPDATE_CATEGORY',
      entityType: 'DishCategory',
      entityId: id,
      afterData: updated,
    });

    return jsonSuccess(updated);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
