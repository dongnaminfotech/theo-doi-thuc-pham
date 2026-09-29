import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function jsonSuccess<T>(data: T, status = 200, pagination?: ApiResponse['pagination']) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(pagination ? { pagination } : {}),
    },
    { status }
  );
}

export function jsonError(
  message: string,
  code = 'BAD_REQUEST',
  status = 400,
  details?: unknown
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
        requestId,
      },
    },
    { status }
  );
}

export function jsonNotFound(message = 'Tài nguyên không tìm thấy') {
  return jsonError(message, 'NOT_FOUND', 404);
}

export function jsonUnauthorized(message = 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn') {
  return jsonError(message, 'UNAUTHORIZED', 401);
}

export function jsonForbidden(message = 'Bạn không có quyền truy cập tài nguyên này') {
  return jsonError(message, 'FORBIDDEN', 403);
}

export function jsonConflict(message: string, details?: unknown) {
  return jsonError(message, 'CONFLICT', 409, details);
}
