import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminDishesPage() {
  const [dishes, categories, ingredients] = await Promise.all([
    prisma.dish.findMany({
      include: {
        category: true,
        recipes: {
          include: { ingredient: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.dishCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.ingredient.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#173b30]">Danh mục Món ăn & Công thức</h1>
          <p className="text-xs text-[#667a70] mt-0.5">
            Quản lý định lượng nguyên liệu chuẩn trên từng suất ăn để tự động tính toán nhu cầu FEFO
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dishes.map((dish) => (
          <div key={dish.id} className="bg-white p-5 rounded-2xl border border-[#e3e9df] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded">
                  {dish.category.name}
                </span>
                <span className="font-mono text-xs text-[#667a70]">{dish.code}</span>
              </div>
              <h3 className="font-extrabold text-base text-[#173b30]">{dish.name}</h3>
              <p className="text-xs text-[#667a70] mt-1 mb-3">{dish.description || 'Chuẩn dinh dưỡng'}</p>

              <div className="bg-[#f7f8f3] p-3 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-[11px] text-[#526a5d] block mb-1">
                  Định lượng công thức (Recipe):
                </span>
                {dish.recipes.length === 0 ? (
                  <span className="text-[#667a70] italic">Chưa khai báo công thức</span>
                ) : (
                  dish.recipes.map((r) => (
                    <div key={r.id} className="flex justify-between text-[11px]">
                      <span>• {r.ingredient.name}</span>
                      <strong className="text-[#173b30] font-mono">
                        {Number(r.qtyPerServing)} {r.unit}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f0f3eb] flex justify-between items-center text-xs">
              <span className="badge-verified">Đang sử dụng ✓</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
