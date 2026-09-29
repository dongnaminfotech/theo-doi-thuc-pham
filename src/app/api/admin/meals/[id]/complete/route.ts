import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canManageMeals } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonNotFound, jsonError } from '@/lib/api-response';
import { MealService } from '@/services/meal.service';
import { completeMealSchema } from '@/validators/meal';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  const currentMeal = await MealService.getMealById(id);
  if (!currentMeal) return jsonNotFound('Bữa ăn không tồn tại');

  if (!canManageMeals(user, currentMeal.schoolId)) {
    return jsonForbidden();
  }

  try {
    const body = await req.json();
    const validated = completeMealSchema.parse(body);
    const updated = await MealService.completeMeal(id, validated, user);

    await logAudit({
      actor: user,
      schoolId: currentMeal.schoolId,
      action: 'COMPLETE_MEAL',
      entityType: 'MealPlan',
      entityId: id,
      afterData: updated,
    });

    return jsonSuccess(updated);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
