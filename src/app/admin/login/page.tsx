'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@banmai.vn');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (loginEmail: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Đăng nhập thất bại');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8f3] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-[#e3e9df] shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 bg-[#175b40] text-[#d8efae] rounded-2xl items-center justify-center font-bold text-2xl shadow-sm mb-3">
            🌱
          </div>
          <h1 className="text-2xl font-black text-[#173b30]">Đăng nhập Ban Quản trị</h1>
          <p className="text-xs text-[#667a70] mt-1">
            New Green — Hệ thống Thực đơn & Truy xuất Nguồn gốc
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(email);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-[#173b30] mb-1">
              Email tài khoản
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-[#f7f8f3] border border-[#d1dec9] rounded-xl text-sm text-[#173b30] focus:outline-none focus:ring-2 focus:ring-[#175b40]"
              placeholder="admin@banmai.vn"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-sm py-3 disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống →'}
          </button>
        </form>

        {/* Quick Role Fill Presets for Testing */}
        <div className="mt-8 pt-6 border-t border-[#e3e9df]">
          <span className="block text-[11px] font-bold text-[#667a70] uppercase tracking-wider mb-2 text-center">
            Chọn nhanh vai trò thử nghiệm:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@newgreen.vn');
                handleLogin('admin@newgreen.vn');
              }}
              className="p-2 bg-[#f7f8f3] hover:bg-[#eaf5df] border border-[#e3e9df] rounded-xl font-bold text-left transition"
            >
              👑 Super Admin
              <span className="block text-[10px] text-[#667a70] font-normal">admin@newgreen.vn</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@banmai.vn');
                handleLogin('admin@banmai.vn');
              }}
              className="p-2 bg-[#f7f8f3] hover:bg-[#eaf5df] border border-[#e3e9df] rounded-xl font-bold text-left transition"
            >
              🏫 School Admin
              <span className="block text-[10px] text-[#667a70] font-normal">admin@banmai.vn</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('kitchen@banmai.vn');
                handleLogin('kitchen@banmai.vn');
              }}
              className="p-2 bg-[#f7f8f3] hover:bg-[#eaf5df] border border-[#e3e9df] rounded-xl font-bold text-left transition"
            >
              🍳 Kitchen Bếp ăn
              <span className="block text-[10px] text-[#667a70] font-normal">kitchen@banmai.vn</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('warehouse@banmai.vn');
                handleLogin('warehouse@banmai.vn');
              }}
              className="p-2 bg-[#f7f8f3] hover:bg-[#eaf5df] border border-[#e3e9df] rounded-xl font-bold text-left transition"
            >
              📦 Warehouse Kho
              <span className="block text-[10px] text-[#667a70] font-normal">warehouse@banmai.vn</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[#175b40] font-bold hover:underline">
            ← Quay lại trang tra cứu công khai
          </Link>
        </div>
      </div>
    </div>
  );
}
