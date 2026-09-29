import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canManageMeals } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { MealService } from '@/services/meal.service';
import { createMealPlanSchema } from '@/validators/meal';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('schoolId');
  const date = searchParams.get('date');

  if (!schoolId || !date) {
    return jsonError('schoolId và date là bắt buộc');
  }

  if (!canManageMeals(user, schoolId)) {
    return jsonForbidden();
  }

  const meals = await MealService.getMealsByDate(schoolId, date);
  return jsonSuccess(meals);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  try {
    const body = await req.json();
    const validated = createMealPlanSchema.parse(body);

    if (!canManageMeals(user, validated.schoolId)) {
      return jsonForbidden('Bạn không có quyền tạo bữa ăn cho trường này');
    }

    const meal = await MealService.createMeal(validated, user);

    await logAudit({
      actor: user,
      schoolId: validated.schoolId,
      action: 'CREATE_MEAL',
      entityType: 'MealPlan',
      entityId: meal.id,
      afterData: meal,
    });

    return jsonSuccess(meal, 201);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
