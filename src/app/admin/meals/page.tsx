import { prisma } from '@/lib/prisma';
import { getMealTypeName } from '@/lib/snapshot';
import { MealActionButtons } from './meal-actions';

export const dynamic = 'force-dynamic';

export default async function AdminMealsPage() {
  const [meals, schools, dishes] = await Promise.all([
    prisma.mealPlan.findMany({
      include: {
        school: true,
        mealDishes: {
          include: { dish: true },
        },
        traceSnapshots: {
          where: { isRevoked: false },
          take: 1,
        },
      },
      orderBy: [{ mealDate: 'desc' }, { mealType: 'asc' }],
    }),
    prisma.school.findMany({ where: { status: 'ACTIVE' } }),
    prisma.dish.findMany({ where: { isActive: true }, include: { category: true } }),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#173b30]">Quản lý Kế hoạch & Bữa ăn</h1>
          <p className="text-xs text-[#667a70] mt-0.5">
            Quy trình chuẩn: DRAFT → READY → Xuất kho FEFO → Chụp ảnh → Công bố phụ huynh
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {meals.map((meal) => {
          const snapshot = meal.traceSnapshots[0];
          return (
            <div
              key={meal.id}
              className="bg-white p-5 rounded-2xl border border-[#e3e9df] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded">
                    {meal.school.name}
                  </span>
                  <span className="text-xs font-bold text-[#173b30]">
                    {getMealTypeName(meal.mealType)} ({meal.mealDate})
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      meal.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-800'
                        : meal.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : meal.status === 'ISSUED'
                        ? 'bg-purple-100 text-purple-800'
                        : meal.status === 'READY'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {meal.status}
                  </span>
                </div>

                <div className="text-xs text-[#526a5d] mb-2">
                  Quy mô: <strong>{meal.servingsCount}</strong> suất •{' '}
                  {meal.mealDishes.length} món ăn
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {meal.mealDishes.map((md) => (
                    <span
                      key={md.id}
                      className="px-2 py-0.5 bg-[#f7f8f3] border border-[#e7ede5] rounded text-[11px] font-semibold text-[#173b30]"
                    >
                      {md.dish.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons Client Component */}
              <MealActionButtons meal={meal} snapshotToken={snapshot?.publicToken} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
