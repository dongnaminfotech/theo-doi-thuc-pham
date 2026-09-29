import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canPublishMeals } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonNotFound, jsonError } from '@/lib/api-response';
import { MealService } from '@/services/meal.service';
import { revokeMealSchema } from '@/validators/meal';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  const currentMeal = await MealService.getMealById(id);
  if (!currentMeal) return jsonNotFound('Bữa ăn không tồn tại');

  if (!canPublishMeals(user, currentMeal.schoolId)) {
    return jsonForbidden('Bạn không có quyền thu hồi công bố bữa ăn này');
  }

  try {
    const body = await req.json();
    const validated = revokeMealSchema.parse(body);

    const updated = await MealService.revokeMeal(id, validated.reason, user);

    await logAudit({
      actor: user,
      schoolId: currentMeal.schoolId,
      action: 'REVOKE_MEAL_PUBLISH',
      entityType: 'MealPlan',
      entityId: id,
      afterData: { reason: validated.reason },
    });

    return jsonSuccess(updated);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
