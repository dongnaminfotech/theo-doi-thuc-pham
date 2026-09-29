import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';

export const dynamic = 'force-dynamic';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const [categories, dishes] = await Promise.all([
    prisma.dishCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { dishes: true } } },
    }),
    prisma.dish.findMany({
      where: {
        isActive: true,
        ...(category ? { categoryId: category } : {}),
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      },
      include: {
        category: true,
        recipes: {
          include: { ingredient: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <>
      <PublicHeader />
      <main className="flex-1 py-10">
        <div className="shell">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase text-[#175b40]">Dữ liệu chuẩn hóa</span>
            <h1 className="text-3xl font-black text-[#173b30] mt-1">Danh mục 10 nhóm món ăn học đường</h1>
            <p className="text-sm text-[#667a70] mt-1">
              Thực đơn được xây dựng theo định lượng và công thức chuẩn dinh dưỡng New Green
            </p>
          </div>

          {/* Categories Tab Bar */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            <Link
              href="/danh-muc"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                !category ? 'bg-[#175b40] text-white' : 'bg-white border border-[#e3e9df] text-[#173b30] hover:bg-[#f0f8df]'
              }`}
            >
              Tất cả ({dishes.length})
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/danh-muc?category=${c.id}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  category === c.id ? 'bg-[#175b40] text-white' : 'bg-white border border-[#e3e9df] text-[#173b30] hover:bg-[#f0f8df]'
                }`}
              >
                {c.name} ({c._count.dishes})
              </Link>
            ))}
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dishes.map((dish) => (
              <div key={dish.id} className="bg-white p-5 rounded-2xl border border-[#e3e9df] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded">
                      {dish.category.name}
                    </span>
                    <span className="text-[11px] font-mono text-[#667a70]">{dish.code}</span>
                  </div>
                  <h3 className="font-extrabold text-base text-[#173b30] mb-2">{dish.name}</h3>
                  <p className="text-xs text-[#667a70] mb-3">{dish.description || 'Món ăn đạt chuẩn dinh dưỡng học đường'}</p>

                  <div className="bg-[#f7f8f3] p-2.5 rounded-xl text-xs">
                    <span className="font-bold text-[11px] text-[#526a5d] block mb-1">Thành phần nguyên liệu chính:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {dish.recipes.map((r) => (
                        <span key={r.id} className="bg-white px-2 py-0.5 rounded border border-[#e7ede5] text-[11px]">
                          {r.ingredient.name} ({Number(r.qtyPerServing)} {r.unit}/suất)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f0f3eb] flex justify-between items-center text-xs">
                  <span className="badge-verified">Công thức chuẩn ✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
