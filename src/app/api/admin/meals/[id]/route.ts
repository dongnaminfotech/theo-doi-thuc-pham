import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canManageMeals } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonNotFound, jsonError } from '@/lib/api-response';
import { MealService } from '@/services/meal.service';
import { updateMealPlanDraftSchema } from '@/validators/meal';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  const meal = await MealService.getMealById(id);
  if (!meal) return jsonNotFound('Bữa ăn không tồn tại');

  if (!canManageMeals(user, meal.schoolId)) {
    return jsonForbidden();
  }

  return jsonSuccess(meal);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const validated = updateMealPlanDraftSchema.parse(body);
    const updated = await MealService.updateDraft(id, validated, user);

    await logAudit({
      actor: user,
      schoolId: currentMeal.schoolId,
      action: 'UPDATE_MEAL_DRAFT',
      entityType: 'MealPlan',
      entityId: id,
      beforeData: currentMeal,
      afterData: updated,
    });

    return jsonSuccess(updated);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
