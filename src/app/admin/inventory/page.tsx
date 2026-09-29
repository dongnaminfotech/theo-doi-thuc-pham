import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const [lots, ingredients] = await Promise.all([
    prisma.lot.findMany({
      include: {
        ingredient: true,
        supplier: true,
        school: true,
      },
      orderBy: { expiryDate: 'asc' },
    }),
    prisma.ingredient.findMany({
      include: {
        lots: {
          where: { currentStock: { gt: 0 } },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#173b30]">Kho & Quản lý Lô nguyên liệu</h1>
          <p className="text-xs text-[#667a70] mt-0.5">
            Giám sát tồn kho thực tế, hạn sử dụng và thứ tự ưu tiên xuất kho FEFO
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/receipts" className="btn-primary text-xs">
            + Nhập kho mới (Receipt)
          </Link>
        </div>
      </div>

      {/* Stock summary by Ingredient */}
      <div className="bg-white p-5 rounded-2xl border border-[#e3e9df] shadow-sm">
        <h2 className="font-extrabold text-sm text-[#173b30] mb-3">Tổng hợp tồn kho theo nguyên liệu</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ingredients.map((ing) => {
            const total = ing.lots.reduce((sum, l) => sum + Number(l.currentStock), 0);
            return (
              <div key={ing.id} className="p-3 bg-[#f7f8f3] rounded-xl text-xs">
                <span className="text-[#667a70] block truncate">{ing.name}</span>
                <strong className="text-sm text-[#173b30]">
                  {total.toFixed(1)} {ing.baseUnit}
                </strong>
                <span className="text-[10px] text-[#526a5d] block">
                  ({ing.lots.length} lô còn hạn)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lots Table */}
      <div className="bg-white rounded-2xl border border-[#e3e9df] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#f0f3eb] font-extrabold text-sm text-[#173b30]">
          Danh sách chi tiết các Lô hàng (Ưu tiên xuất FEFO: HSD gần nhất trước)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7f8f3] text-[#667a70] border-b border-[#e3e9df]">
              <tr>
                <th className="p-3">Mã Lô</th>
                <th className="p-3">Nguyên liệu</th>
                <th className="p-3">Trường</th>
                <th className="p-3">Nhà cung cấp</th>
                <th className="p-3">Tồn kho / Ban đầu</th>
                <th className="p-3">Hạn sử dụng (FEFO)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3eb]">
              {lots.map((lot) => (
                <tr key={lot.id} className="hover:bg-[#f7f8f3]">
                  <td className="p-3 font-mono font-bold text-[#173b30]">{lot.lotCode}</td>
                  <td className="p-3 font-bold text-[#173b30]">{lot.ingredient.name}</td>
                  <td className="p-3 text-[#667a70]">{lot.school.name}</td>
                  <td className="p-3 text-[#667a70]">{lot.supplier.name}</td>
                  <td className="p-3">
                    <strong className="text-[#175b40]">{Number(lot.currentStock)}</strong> / {Number(lot.initialQuantity)} {lot.baseUnit}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-red-700">
                      {new Date(lot.expiryDate).toLocaleDateString('vi-VN')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
