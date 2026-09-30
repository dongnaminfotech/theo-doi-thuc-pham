'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={logout} disabled={loading} className="text-red-300 hover:text-red-200 disabled:opacity-50">
      {loading ? 'Đang thoát...' : 'Đăng xuất'}
    </button>
  );
}
