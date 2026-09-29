import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminSchoolsPage() {
  const schools = await prisma.school.findMany({
    include: {
      _count: {
        select: {
          mealPlans: true,
          receipts: true,
          lots: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-[#173b30]">Danh sách Trường học & Điểm bếp</h1>
        <p className="text-xs text-[#667a70] mt-0.5">
          Quản lý thông tin các trường học, đường dẫn công khai (slug) và kết nối kho bếp
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map((school) => (
          <div key={school.id} className="bg-white p-5 rounded-2xl border border-[#e3e9df] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono font-bold text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded">
                  {school.code}
                </span>
                <span className="badge-verified">Đang phục vụ ✓</span>
              </div>
              <h3 className="font-extrabold text-base text-[#173b30]">{school.name}</h3>
              <p className="text-xs text-[#667a70] mt-1">📍 {school.address || 'Hà Nội'}</p>
              <p className="text-xs text-[#667a70]">📞 {school.phone || '024 3888 9999'}</p>

              <div className="mt-4 pt-3 border-t border-[#f0f3eb] grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#f7f8f3] p-2 rounded-lg">
                  <span className="text-[#667a70] block text-[10px]">Bữa ăn</span>
                  <strong className="text-[#173b30]">{school._count.mealPlans}</strong>
                </div>
                <div className="bg-[#f7f8f3] p-2 rounded-lg">
                  <span className="text-[#667a70] block text-[10px]">Phiếu nhập</span>
                  <strong className="text-[#173b30]">{school._count.receipts}</strong>
                </div>
                <div className="bg-[#f7f8f3] p-2 rounded-lg">
                  <span className="text-[#667a70] block text-[10px]">Lô hàng</span>
                  <strong className="text-[#173b30]">{school._count.lots}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f0f3eb] flex justify-between items-center text-xs">
              <Link
                href={`/truong/${school.slug}`}
                target="_blank"
                className="font-bold text-[#175b40] hover:underline"
              >
                Mở trang phụ huynh ↗
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
