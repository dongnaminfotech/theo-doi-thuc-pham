import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { getMealTypeName } from '@/lib/snapshot';

export const dynamic = 'force-dynamic';

export default async function SchoolMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const { date } = await searchParams;

  const school = await prisma.school.findUnique({ where: { slug } });
  if (!school) notFound();

  const selectedDate = date || '2026-09-29';

  const mealPlans = await prisma.mealPlan.findMany({
    where: { schoolId: school.id, mealDate: selectedDate, status: 'PUBLISHED' },
    include: {
      mealDishes: {
        include: { dish: { include: { category: true } } },
        orderBy: { sortOrder: 'asc' },
      },
      traceSnapshots: {
        where: { isRevoked: false },
        take: 1,
        orderBy: { version: 'desc' },
      },
    },
    orderBy: { mealType: 'asc' },
  });

  return (
    <>
      <PublicHeader />
      <main className="flex-1 py-8">
        <div className="shell">
          <div className="bg-white p-6 rounded-2xl border border-[#e3e9df] shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded">{school.code}</span>
                <span className="badge-verified">Đạt chuẩn ATTP ✓</span>
              </div>
              <h1 className="text-2xl font-black text-[#173b30]">{school.name}</h1>
              <p className="text-xs text-[#667a70] mt-1">📍 {school.address || 'Hà Nội'}</p>
            </div>

            <div className="flex items-center gap-2 bg-[#f7f8f3] p-1.5 rounded-xl border border-[#e3e9df]">
              <Link href={`/truong/${slug}?date=2026-09-28`} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${selectedDate === '2026-09-28' ? 'bg-[#175b40] text-white' : 'text-[#173b30]'}`}>28/09</Link>
              <Link href={`/truong/${slug}?date=2026-09-29`} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${selectedDate === '2026-09-29' ? 'bg-[#175b40] text-white' : 'text-[#173b30]'}`}>29/09 (Hôm nay)</Link>
              <Link href={`/truong/${slug}?date=2026-09-30`} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${selectedDate === '2026-09-30' ? 'bg-[#175b40] text-white' : 'text-[#173b30]'}`}>30/09</Link>
            </div>
          </div>

          {mealPlans.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-[#e3e9df] text-center max-w-md mx-auto my-6">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="font-bold text-base text-[#173b30]">Chưa có thực đơn công bố</h3>
              <p className="text-xs text-[#667a70] mt-1 mb-3">Chưa có thực đơn cho ngày {selectedDate}.</p>
              <Link href={`/truong/${slug}?date=2026-09-29`} className="btn-primary text-xs">Xem ngày 29/09/2026</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {mealPlans.map((meal) => {
                const snapshot = meal.traceSnapshots[0];
                return (
                  <div key={meal.id} className="bg-white p-6 rounded-2xl border border-[#e3e9df] shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#f0f3eb] gap-3 mb-4">
                      <div>
                        <span className="text-xs font-bold text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded uppercase">{getMealTypeName(meal.mealType)}</span>
                        <h2 className="text-lg font-black text-[#173b30] mt-1">Thực đơn dinh dưỡng ({meal.servingsCount} suất)</h2>
                      </div>
                      {snapshot && (
                        <Link href={`/truy-xuat/${snapshot.publicToken}`} className="btn-primary text-xs">
                          🔍 Xem nguồn gốc bữa ăn & Chứng chỉ ↗
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {meal.mealDishes.map((md) => (
                        <div key={md.id} className="p-3.5 bg-[#f7f8f3] border border-[#e7ede5] rounded-xl flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-[#175b40] bg-white px-2 py-0.5 rounded border border-[#e3e9df]">{md.dish.category.name}</span>
                            <h4 className="font-bold text-sm text-[#173b30] mt-1.5 mb-1">{md.dish.name}</h4>
                            <p className="text-xs text-[#667a70] line-clamp-2">{md.dish.description || 'Chế biến tươi trong ngày'}</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-[#e3e9df] flex justify-between text-[10px] text-[#526a5d]">
                            <span>Tiêu chuẩn</span>
                            <span className="text-[#175b40] font-bold">VietGAP / HACCP</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
