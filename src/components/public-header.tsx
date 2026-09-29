import Link from 'next/link';

export function PublicHeader() {
  return (
    <>
      <div className="bg-[#e8f2da] text-[#356441] text-center text-xs font-bold py-2 tracking-wider">
        HỆ THỐNG TRUY XUẤT NGUỒN GỐC THỰC PHẨM & BỮA ĂN HỌC ĐƯỜNG NEW GREEN
      </div>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e7ede5]">
        <div className="shell min-h-[72px] flex items-center justify-between gap-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-[#175b40] text-[#d8efae] rounded-xl flex items-center justify-center font-bold text-xl shadow-sm">
              🌱
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#173b30]">
                new<span className="text-[#48bb78]">green</span>
              </span>
              <span className="block text-[9px] font-bold tracking-widest text-[#6f8175] uppercase">
                Bữa Ăn Học Đường
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#5f7469]">
            <Link href="/" className="hover:text-[#175b40] transition">
              Trang chủ
            </Link>
            <Link href="/danh-muc" className="hover:text-[#175b40] transition">
              Danh mục món ăn
            </Link>
            <Link href="/truong/tieu-hoc-ban-mai" className="hover:text-[#175b40] transition">
              Thực đơn theo trường
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="text-xs font-bold text-[#175b40] px-3 py-2 rounded-lg border border-[#c2d6b8] hover:bg-[#f0f8df] transition"
            >
              Cổng Quản Trị 🔒
            </Link>
            <Link
              href="/truong/tieu-hoc-ban-mai"
              className="hidden sm:inline-flex bg-[#175b40] hover:bg-[#103e30] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              Xem thực đơn ↗
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
