import fs from 'fs';
import path from 'path';

export interface UploadResult {
  storageKey: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

const LOCAL_UPLOAD_DIR = process.env.STORAGE_LOCAL_DIR || './public/uploads';

export async function uploadFile(
  fileBuffer: Buffer,
  originalFileName: string,
  mimeType: string,
  folder = 'general'
): Promise<UploadResult> {
  const ext = path.extname(originalFileName) || '.jpg';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const cleanFileName = `${timestamp}_${randomStr}${ext}`;
  const storageKey = `${folder}/${cleanFileName}`;

  const targetDir = path.resolve(LOCAL_UPLOAD_DIR, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, cleanFileName);
  await fs.promises.writeFile(filePath, fileBuffer);

  const publicUrl = `/uploads/${folder}/${cleanFileName}`;

  return {
    storageKey,
    url: publicUrl,
    fileName: originalFileName,
    fileSize: fileBuffer.length,
    mimeType,
  };
}

export function getFileUrl(storageKey: string): string {
  if (!storageKey) return '';
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }
  return `/uploads/${storageKey}`;
}
