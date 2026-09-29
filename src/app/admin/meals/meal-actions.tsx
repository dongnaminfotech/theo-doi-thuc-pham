'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function MealActionButtons({
  meal,
  snapshotToken,
}: {
  meal: any;
  snapshotToken?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const executeAction = async (actionPath: string, payload = {}) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/meals/${meal.id}/${actionPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Lỗi: ${data.error?.message || 'Thao tác không thành công'}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(`Lỗi kết nối: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {meal.status === 'DRAFT' && (
        <button
          onClick={() => executeAction('ready')}
          disabled={loading}
          className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
        >
          ✓ Chuyển READY
        </button>
      )}

      {meal.status === 'READY' && (
        <button
          onClick={() => executeAction('issue')}
          disabled={loading}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
        >
          📦 Xuất kho FEFO (ISSUE)
        </button>
      )}

      {meal.status === 'ISSUED' && (
        <button
          onClick={() =>
            executeAction('complete', {
              photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
            })
          }
          disabled={loading}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
        >
          📸 Đính kèm ảnh (COMPLETE)
        </button>
      )}

      {meal.status === 'COMPLETED' && (
        <button
          onClick={() => executeAction('publish')}
          disabled={loading}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
        >
          📢 Công bố phụ huynh (PUBLISH)
        </button>
      )}

      {meal.status === 'PUBLISHED' && (
        <>
          {snapshotToken && (
            <Link
              href={`/truy-xuat/${snapshotToken}`}
              target="_blank"
              className="px-3 py-1.5 bg-[#f0f8df] text-[#175b40] border border-[#bbf7d0] hover:bg-[#dcfce7] rounded-lg text-xs font-bold transition"
            >
              👁️ Xem trang phụ huynh ↗
            </Link>
          )}
          <button
            onClick={() => {
              const reason = prompt('Nhập lý do thu hồi bữa ăn:');
              if (reason) executeAction('revoke', { reason });
            }}
            disabled={loading}
            className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-bold transition disabled:opacity-50"
          >
            ⚠️ Thu hồi (REVOKE)
          </button>
        </>
      )}
    </div>
  );
}
