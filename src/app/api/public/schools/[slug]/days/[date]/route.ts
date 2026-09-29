import { NextRequest } from 'next/server';
import { jsonSuccess, jsonNotFound, jsonError } from '@/lib/api-response';
import { PublicService } from '@/services/public.service';
import { isValidDateString } from '@/lib/date';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; date: string }> }
) {
  const { slug, date } = await params;

  if (!isValidDateString(date)) {
    return jsonError('Định dạng ngày không hợp lệ (cần YYYY-MM-DD)', 'INVALID_DATE', 400);
  }

  const data = await PublicService.getPublishedMealsForDate(slug, date);
  if (!data) {
    return jsonNotFound('Trường học không tồn tại hoặc chưa kích hoạt');
  }

  const res = jsonSuccess(data);
  res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res;
}
