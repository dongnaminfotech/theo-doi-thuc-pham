import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let schools: any[] = [];
  try {
    schools = await prisma.school.findMany({ where: { status: 'ACTIVE' }, take: 6, orderBy: { name: 'asc' } });
  } catch {
    schools = [{ id: '1', name: 'Trường Tiểu học Ban Mai', code: 'TH-BANMAI', slug: 'tieu-hoc-ban-mai', address: 'Văn Quán, Hà Đông, Hà Nội' }];
  }

  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-[#f0f8df] via-[#f7f8f3] to-[#f7f8f3] py-12 border-b border-[#e3e9df]">
          <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#eaf5df] text-[#2f6f43] px-3 py-1 rounded-full text-xs font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
                Minh bạch nguồn gốc từng bữa ăn
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#173b30] tracking-tight leading-tight">
                Bữa ăn dinh dưỡng <br />
                <span className="text-[#175b40] underline decoration-[#86efac] decoration-2">Minh bạch 100%</span> nguồn gốc
              </h1>
              <p className="text-sm text-[#526a5d] max-w-xl">
                Phụ huynh có thể tra cứu chi tiết nguyên liệu, lô sản xuất và chứng nhận an toàn thực phẩm qua mã QR.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/truong/tieu-hoc-ban-mai" className="btn-primary text-sm">
                  Tra cứu thực đơn hôm nay ↗
                </Link>
                <Link href="/danh-muc" className="btn-secondary text-sm">
                  Danh mục món ăn
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white p-5 rounded-2xl shadow-lg border border-[#e3e9df]">
                <div className="flex items-center justify-between pb-3 border-b border-[#f0f3eb] mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded">
                      Thực đơn mẫu
                    </span>
                    <h3 className="font-bold text-base text-[#173b30] mt-1">Tiểu học Ban Mai</h3>
                  </div>
                  <span className="badge-verified">Đã kiểm duyệt ✓</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-[#f7f8f3] rounded-lg flex justify-between">
                    <span className="font-bold">🍛 Thịt heo nạc kho trứng</span>
                    <span className="text-[#526a5d]">C.P. / Ba Huân</span>
                  </div>
                  <div className="p-2.5 bg-[#f7f8f3] rounded-lg flex justify-between">
                    <span className="font-bold">🥣 Canh thịt băm rau ngót</span>
                    <span className="text-[#526a5d]">VietGAP Đất Việt</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#f0f3eb] flex justify-between items-center text-xs">
                  <span className="text-[#667a70]">🛡️ Bản chụp SHA-256</span>
                  <Link href="/truong/tieu-hoc-ban-mai" className="font-bold text-[#175b40] hover:underline">
                    Xem chi tiết →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 bg-white border-b border-[#e3e9df]">
          <div className="shell">
            <h2 className="text-xl font-black text-[#173b30] mb-4">Hệ thống trường học</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {schools.map((s) => (
                <Link
                  key={s.id}
                  href={`/truong/${s.slug}`}
                  className="p-4 bg-[#f7f8f3] hover:bg-[#f0f8df] border border-[#e3e9df] rounded-xl transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#175b40] bg-white px-2 py-0.5 rounded border border-[#dceeba]">{s.code}</span>
                      <span className="text-xs font-bold text-[#397448]">✓ Đang phục vụ</span>
                    </div>
                    <h3 className="font-bold text-base text-[#173b30]">{s.name}</h3>
                    <p className="text-xs text-[#667a70] mt-1 line-clamp-1">📍 {s.address || 'Hà Nội'}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#e7ede5] flex justify-between text-xs font-bold text-[#175b40]">
                    <span>Xem thực đơn</span>
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

