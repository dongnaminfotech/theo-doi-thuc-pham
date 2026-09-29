import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="mt-auto bg-[#102f25] text-[#d4e8d5] pt-14 pb-8">
      <div className="shell grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-7 h-7 bg-[#dceeba] text-[#175b40] rounded-lg flex items-center justify-center font-bold text-sm">
              🌱
            </span>
            <span className="font-extrabold text-xl text-white">
              new<span className="text-[#86efac]">green</span>
            </span>
          </div>
          <p className="text-xs text-[#9eb9a8] leading-relaxed max-w-sm">
            Nền tảng minh bạch hóa thực đơn và truy xuất nguồn gốc từng nguyên liệu, lô sản xuất, và chứng nhận an toàn thực phẩm trong bữa ăn học đường.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-4">Khám phá nhanh</h4>
          <ul className="space-y-2 text-xs text-[#a8c3ad]">
            <li>
              <Link href="/" className="hover:text-white transition">
                Trang chủ
              </Link>
            </li>
            <li>
              <Link href="/danh-muc" className="hover:text-white transition">
                Danh mục 10 nhóm món ăn
              </Link>
            </li>
            <li>
              <Link href="/truong/tieu-hoc-ban-mai" className="hover:text-white transition">
                Thực đơn Trường Tiểu học Ban Mai
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-white transition">
                Đăng nhập Ban Quản lý & Bếp ăn
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-4">Cam kết chất lượng</h4>
          <p className="text-xs text-[#9eb9a8] leading-relaxed">
            100% nguyên liệu sử dụng trong bữa ăn học đường đều có xuất xứ rõ ràng từ các nhà cung cấp uy tín, có giấy kiểm dịch thú y, chứng nhận VietGAP và chứng chỉ ATVSTP được kiểm duyệt.
          </p>
        </div>
      </div>

      <div className="shell pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#88a594] gap-3">
        <span>© 2026 New Green. Hệ thống Quản lý Bữa ăn Học đường Minh bạch.</span>
        <span>Thiết kế cho phụ huynh, nhà trường và các cơ quan kiểm định.</span>
      </div>
    </footer>
  );
}
