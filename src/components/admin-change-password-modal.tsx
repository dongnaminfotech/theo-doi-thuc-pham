'use client';

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  hasPassword?: boolean;
}

export default function AdminChangePasswordModal({ isOpen, onClose, userEmail, hasPassword = true }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : '',
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Đổi mật khẩu thất bại');

      setSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl border border-[#e3e9df] shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-5 bg-[#f7f8f3] border-b border-[#e3e9df] flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-[#173b30]">🔐 Đổi mật khẩu tài khoản</h3>
            {userEmail && <p className="text-xs text-[#667a70] mt-0.5">{userEmail}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-[#667a70] hover:text-[#173b30] font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">{error}</div>}
          {success && <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl font-bold">✓ {success}</div>}

          {hasPassword ? (
            <div>
              <label className="block text-xs font-bold text-[#173b30] mb-1">Mật khẩu hiện tại *</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#f7f8f3] border border-[#d1dec9] rounded-xl text-xs"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
              💡 Bạn chưa đặt mật khẩu. Đặt mật khẩu mới để bảo vệ tài khoản.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#173b30] mb-1">Mật khẩu mới * (tối thiểu 6 ký tự)</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-[#f7f8f3] border border-[#d1dec9] rounded-xl text-xs"
              placeholder="Nhập mật khẩu mới"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#173b30] mb-1">Xác nhận mật khẩu mới *</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-[#f7f8f3] border border-[#d1dec9] rounded-xl text-xs"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#667a70]">
            <input type="checkbox" checked={showPass} onChange={(e) => setShowPass(e.target.checked)} className="rounded" />
            <span>Hiện mật khẩu</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e3e9df]">
            <button type="button" onClick={onClose} className="px-3.5 py-2 text-xs font-bold text-[#667a70] bg-[#f7f8f3] hover:bg-[#e3e9df] rounded-xl">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary text-xs py-2 px-4 disabled:opacity-50">
              {loading ? 'Đang lưu...' : 'Lưu mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
