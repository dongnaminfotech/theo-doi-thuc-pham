import { prisma } from '@/lib/prisma';
import { CreateReceiptForm } from './create-receipt-form';

export const dynamic = 'force-dynamic';

export default async function AdminReceiptsPage() {
  const [receipts, schools, suppliers, ingredients] = await Promise.all([
    prisma.receipt.findMany({
      include: {
        school: true,
        supplier: true,
        items: {
          include: {
            ingredient: true,
            lots: true,
          },
        },
      },
      orderBy: { receiptDate: 'desc' },
    }),
    prisma.school.findMany({ where: { status: 'ACTIVE' } }),
    prisma.supplier.findMany({ where: { status: 'ACTIVE' } }),
    prisma.ingredient.findMany({ where: { isActive: true } }),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#173b30]">Phiếu Nhập kho (Receipts & Batches)</h1>
          <p className="text-xs text-[#667a70] mt-0.5">
            Ghi nhận nhập hàng từ nhà cung cấp, tự động phát sinh Lô hàng kiểm định cho FEFO
          </p>
        </div>
      </div>

      <CreateReceiptForm schools={schools} suppliers={suppliers} ingredients={ingredients} />

      {/* Receipts List */}
      <div className="space-y-4">
        {receipts.map((rc) => (
          <div key={rc.id} className="bg-white p-5 rounded-2xl border border-[#e3e9df] shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between pb-3 border-b border-[#f0f3eb] gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded">
                    {rc.receiptNumber}
                  </span>
                  <span className="font-bold text-sm text-[#173b30]">
                    🏢 {rc.supplier.name} → 🏫 {rc.school.name}
                  </span>
                </div>
                <span className="text-xs text-[#667a70] block mt-1">
                  Ngày nhập: {new Date(rc.receiptDate).toLocaleDateString('vi-VN')} {rc.notes && `• Ghi chú: ${rc.notes}`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {rc.items.map((item) => (
                <div key={item.id} className="p-2.5 bg-[#f7f8f3] rounded-xl flex justify-between text-xs">
                  <div>
                    <strong className="text-[#173b30]">{item.ingredient.name}</strong>
                    <span className="text-[#667a70] ml-2">
                      ({Number(item.quantity)} {item.unit})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {item.lots.map((l) => (
                      <span key={l.id} className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#e3e9df]">
                        Lô: {l.lotCode} (HSD: {new Date(l.expiryDate).toLocaleDateString('vi-VN')})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
