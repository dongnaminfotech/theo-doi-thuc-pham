import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { canManageMeals } from '@/lib/rbac';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { TemplateService } from '@/services/template.service';
import { generateWeeklyMealsSchema } from '@/validators/menu-template';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  try {
    const body = await req.json();
    const validated = generateWeeklyMealsSchema.parse(body);

    if (!canManageMeals(user, validated.schoolId)) {
      return jsonForbidden('Bạn không có quyền sinh thực đơn cho trường này');
    }

    const result = await TemplateService.generateWeeklyMeals(validated, user);

    await logAudit({
      actor: user,
      schoolId: validated.schoolId,
      action: 'GENERATE_WEEKLY_MEALS',
      entityType: 'MealPlan',
      afterData: { ...validated, result },
    });

    return jsonSuccess(result);
  } catch (error: any) {
    return jsonError(error.message, 'OPERATION_ERROR', 400);
  }
}
