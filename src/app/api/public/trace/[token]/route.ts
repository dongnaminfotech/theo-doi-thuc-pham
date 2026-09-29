import { NextRequest } from 'next/server';
import { jsonSuccess, jsonNotFound } from '@/lib/api-response';
import { PublicService } from '@/services/public.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const urlObj = new URL(req.url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

  const traceData = await PublicService.getTraceSnapshot(token, baseUrl);
  if (!traceData) {
    return jsonNotFound('Mã truy xuất không hợp lệ hoặc thông tin đã bị thu hồi');
  }

  const res = jsonSuccess(traceData);
  res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return res;
}
