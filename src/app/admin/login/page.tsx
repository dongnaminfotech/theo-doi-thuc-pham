'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (loginEmail: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Đăng nhập thất bại');
      }

      const nextPath = new URLSearchParams(window.location.search).get('next');
      router.replace(nextPath?.startsWith('/admin') ? nextPath : '/admin');
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

          <div>
            <label className="block text-xs font-bold text-[#173b30] mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 pr-20 bg-[#f7f8f3] border border-[#d1dec9] rounded-xl text-sm text-[#173b30] focus:outline-none focus:ring-2 focus:ring-[#175b40]"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-3 text-xs font-bold text-[#175b40]"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-sm py-3 disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống →'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[#175b40] font-bold hover:underline">
            ← Quay lại trang tra cứu công khai
          </Link>
        </div>
      </div>
    </div>
  );
}
