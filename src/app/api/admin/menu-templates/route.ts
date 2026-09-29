import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { TemplateService } from '@/services/template.service';
import { createMenuTemplateItemSchema } from '@/validators/menu-template';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('schoolId') || undefined;

  const templates = await TemplateService.getTemplates(schoolId);
  return jsonSuccess(templates);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  try {
    const body = await req.json();
    const validated = createMenuTemplateItemSchema.parse(body);

    if (validated.schoolId && user.role !== 'SUPER_ADMIN' && !user.schoolIds.includes(validated.schoolId)) {
      return jsonForbidden();
    }
    if (!validated.schoolId && user.role !== 'SUPER_ADMIN') {
      return jsonForbidden('Chỉ SUPER_ADMIN mới có quyền tạo mẫu thực đơn dùng chung');
    }

    const item = await TemplateService.createTemplateItem(validated);

    await logAudit({
      actor: user,
      schoolId: validated.schoolId,
      action: 'CREATE_MENU_TEMPLATE_ITEM',
      entityType: 'WeeklyMenuTemplate',
      entityId: item.id,
      afterData: item,
    });

    return jsonSuccess(item, 201);
  } catch (error: any) {
    return jsonError(error.message, 'VALIDATION_ERROR', 400);
  }
}
