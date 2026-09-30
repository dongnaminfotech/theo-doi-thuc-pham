import Link from 'next/link';
import { AdminLogoutButton } from '@/components/admin-logout-button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#f0f3eb]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#102f25] text-white flex flex-col justify-between p-5 border-r border-[#173b30]">
        <div>
          {/* Brand */}
          <Link href="/admin" className="flex items-center gap-3 pb-6 border-b border-white/10 mb-6">
            <span className="w-9 h-9 bg-[#dceeba] text-[#175b40] rounded-xl flex items-center justify-center font-bold text-lg">
              🌱
            </span>
            <div>
              <span className="font-black text-lg tracking-tight text-white block">
                new<span className="text-[#86efac]">green</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#88a594] uppercase block">
                Cổng Quản Trị
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-bold">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white transition"
            >
              <span>📊</span>
              <span>Tổng quan</span>
            </Link>
            <Link
              href="/admin/meals"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white transition"
            >
              <span>🍱</span>
              <span>Kế hoạch & Bữa ăn</span>
            </Link>
            <Link
              href="/admin/inventory"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white transition"
            >
              <span>📦</span>
              <span>Kho & Lô nguyên liệu</span>
            </Link>
            <Link
              href="/admin/receipts"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white transition"
            >
              <span>📥</span>
              <span>Nhập kho (Receipts)</span>
            </Link>
            <Link
              href="/admin/dishes"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white transition"
            >
              <span>🍲</span>
              <span>Món ăn & Công thức</span>
            </Link>
            <Link
              href="/admin/ingredients"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white transition"
            >
              <span>🥕</span>
              <span>Nguyên liệu chuẩn</span>
            </Link>
            <Link
              href="/admin/suppliers"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white transition"
            >
              <span>🏢</span>
              <span>Nhà cung cấp & ATTP</span>
            </Link>
            <Link
              href="/admin/schools"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white transition"
            >
              <span>🏫</span>
              <span>Trường học</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white transition"
            >
              <span>👥</span>
              <span>Người dùng & Phân quyền</span>
            </Link>
            <Link
              href="/admin/audit"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white transition"
            >
              <span>📜</span>
              <span>Nhật ký Audit Trail</span>
            </Link>
          </nav>
        </div>

        {/* Footer profile & fast links */}
        <div className="pt-4 border-t border-white/10 text-xs">
          <div className="flex items-center justify-between mb-3 text-[#88a594]">
            <Link href="/" target="_blank" className="hover:text-white flex items-center gap-1">
              <span>Trang phụ huynh</span> ↗
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#e3e9df] px-8 flex items-center justify-between">
          <div className="text-xs font-bold text-[#667a70]">
            Hệ thống Quản lý Thực đơn & Truy xuất Nguồn gốc Bữa ăn
          </div>
          <div className="flex items-center gap-3">
            <span className="badge-verified text-[11px]">Server Ready ✓</span>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
