import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminIngredientsPage() {
  const ingredients = await prisma.ingredient.findMany({
    include: {
      _count: {
        select: {
          recipes: true,
          lots: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-[#173b30]">Danh mục Nguyên liệu chuẩn</h1>
        <p className="text-xs text-[#667a70] mt-0.5">
          Danh sách các nguyên liệu thô và đơn vị tính chuẩn (kg, quả, lít, v.v.)
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e3e9df] shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f7f8f3] text-[#667a70] border-b border-[#e3e9df]">
            <tr>
              <th className="p-3">Mã NL</th>
              <th className="p-3">Tên nguyên liệu</th>
              <th className="p-3">Đơn vị chuẩn</th>
              <th className="p-3">Số món sử dụng</th>
              <th className="p-3">Số lô nhập</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3eb]">
            {ingredients.map((ing) => (
              <tr key={ing.id} className="hover:bg-[#f7f8f3]">
                <td className="p-3 font-mono font-bold text-[#173b30]">{ing.code}</td>
                <td className="p-3 font-bold text-[#173b30]">{ing.name}</td>
                <td className="p-3">
                  <span className="bg-[#f0f8df] text-[#175b40] font-bold px-2 py-0.5 rounded text-[11px]">
                    {ing.baseUnit}
                  </span>
                </td>
                <td className="p-3">{ing._count.recipes} món</td>
                <td className="p-3">{ing._count.lots} lô hàng</td>
                <td className="p-3">
                  <span className="badge-verified">Hoạt động ✓</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
