import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canManageMeals } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonNotFound, jsonError } from '@/lib/api-response';
import { MealService } from '@/services/meal.service';
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

  const idempotencyKey = req.headers.get('idempotency-key') || undefined;

  try {
    const meal = await MealService.issueMeal(id, idempotencyKey, user);

    await logAudit({
      actor: user,
      schoolId: currentMeal.schoolId,
      action: 'ISSUE_MEAL_FEFO',
      entityType: 'MealPlan',
      entityId: id,
      afterData: meal,
    });

    return jsonSuccess(meal);
  } catch (error: any) {
    return jsonError(error.message, 'ISSUE_FAILED', 400);
  }
}
