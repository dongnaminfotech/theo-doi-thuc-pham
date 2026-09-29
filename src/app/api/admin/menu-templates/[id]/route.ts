import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { TemplateService } from '@/services/template.service';
import { logAudit } from '@/lib/audit';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  const { id } = await params;
  try {
    await TemplateService.deleteTemplateItem(id);

    await logAudit({
      actor: user,
      action: 'DELETE_MENU_TEMPLATE_ITEM',
      entityType: 'WeeklyMenuTemplate',
      entityId: id,
    });

    return jsonSuccess({ message: 'Đã xóa mục khỏi mẫu thực đơn' });
  } catch (error: any) {
    return jsonError(error.message, 'INTERNAL_ERROR', 500);
  }
}
