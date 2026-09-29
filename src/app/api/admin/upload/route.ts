import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { uploadFile } from '@/lib/storage';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return jsonUnauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'meals';

    if (!file) {
      return jsonError('Không tìm thấy file tải lên');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return jsonError(`Định dạng file ${file.type} không được hỗ trợ. Chỉ hỗ trợ JPEG, PNG, WEBP, PDF.`);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError('Dung lượng file vượt quá giới hạn 10MB');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile(buffer, file.name, file.type, folder);
    return jsonSuccess(result, 201);
  } catch (error: any) {
    return jsonError(error.message || 'Lỗi tải lên file', 'UPLOAD_ERROR', 500);
  }
}
