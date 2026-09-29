import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canPublishMeals } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonNotFound, jsonError } from '@/lib/api-response';
import { MealService } from '@/services/meal.service';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  const currentMeal = await MealService.getMealById(id);
  if (!currentMeal) return jsonNotFound('Bữa ăn không tồn tại');

  if (!canPublishMeals(user, currentMeal.schoolId)) {
    return jsonForbidden('Chỉ SUPER_ADMIN hoặc SCHOOL_ADMIN của trường mới có quyền công bố bữa ăn');
  }

  try {
    const result = await MealService.publishMeal(id, user);

    await logAudit({
      actor: user,
      schoolId: currentMeal.schoolId,
      action: 'PUBLISH_MEAL_SNAPSHOT',
      entityType: 'MealPlan',
      entityId: id,
      afterData: {
        mealId: id,
        version: result.snapshot.version,
        publicToken: result.publicToken,
      },
    });

    return jsonSuccess(result);
  } catch (error: any) {
    return jsonError(error.message, 'PUBLISH_FAILED', 400);
  }
}
