import { NextRequest } from 'next/server';
import { jsonSuccess, jsonNotFound } from '@/lib/api-response';
import { PublicService } from '@/services/public.service';
import { getTodayVN } from '@/lib/date';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const today = getTodayVN();

  const data = await PublicService.getPublishedMealsForDate(slug, today);
  if (!data) {
    return jsonNotFound('Trường học không tồn tại hoặc chưa kích hoạt');
  }

  const res = jsonSuccess(data);
  // Cache for 60 seconds with stale-while-revalidate
  res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res;
}
