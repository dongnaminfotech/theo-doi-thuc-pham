import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [schoolsCount, dishesCount, mealsCount, lotsCount, lotsNearExpiry, recentAuditLogs] =
    await Promise.all([
      prisma.school.count({ where: { status: 'ACTIVE' } }),
      prisma.dish.count({ where: { isActive: true } }),
      prisma.mealPlan.count(),
      prisma.lot.count({ where: { currentStock: { gt: 0 } } }),
      prisma.lot.findMany({
        where: { currentStock: { gt: 0 } },
        include: { ingredient: true },
        take: 4,
        orderBy: { expiryDate: 'asc' },
      }),
      prisma.auditLog.findMany({ take: 4, orderBy: { createdAt: 'desc' } }),
    ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#173b30]">Tổng quan Hệ thống New Green</h1>
          <p className="text-xs text-[#667a70] mt-0.5">Trung tâm điều hành thực đơn & truy xuất nguồn gốc</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/meals" className="btn-primary text-xs">+ Kế hoạch bữa ăn</Link>
          <Link href="/admin/receipts" className="btn-secondary text-xs">+ Nhập kho</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#e3e9df] shadow-sm">
          <span className="text-[#667a70] text-xs block mb-1">Trường học</span>
          <div className="text-2xl font-black text-[#173b30]">{schoolsCount}</div>
          <span className="text-[10px] text-[#397448] font-bold">✓ Hoạt động</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e3e9df] shadow-sm">
          <span className="text-[#667a70] text-xs block mb-1">Tổng bữa ăn</span>
          <div className="text-2xl font-black text-[#173b30]">{mealsCount}</div>
          <span className="text-[10px] text-[#175b40] font-bold">Lập kế hoạch</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e3e9df] shadow-sm">
          <span className="text-[#667a70] text-xs block mb-1">Lô hàng trong kho</span>
          <div className="text-2xl font-black text-[#173b30]">{lotsCount}</div>
          <span className="text-[10px] text-[#397448] font-bold">✓ Phân bổ FEFO</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e3e9df] shadow-sm">
          <span className="text-[#667a70] text-xs block mb-1">Món ăn</span>
          <div className="text-2xl font-black text-[#173b30]">{dishesCount}</div>
          <span className="text-[10px] text-[#526a5d] font-bold">10 Nhóm chuẩn</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-[#e3e9df] shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-[#f0f3eb] mb-3">
            <h2 className="font-bold text-sm text-[#173b30]">⏳ Cảnh báo lô hạn sớm (FEFO)</h2>
            <Link href="/admin/inventory" className="text-xs text-[#175b40] font-bold hover:underline">Tất cả →</Link>
          </div>
          <div className="space-y-2">
            {lotsNearExpiry.map((lot) => (
              <div key={lot.id} className="p-2.5 bg-[#f7f8f3] rounded-lg flex justify-between text-xs">
                <div>
                  <strong className="text-[#173b30] block">{lot.ingredient.name}</strong>
                  <span className="text-[10px] text-[#667a70] font-mono">Lô: {lot.lotCode}</span>
                </div>
                <div className="text-right">
                  <span className="text-red-700 font-bold block">HSD: {new Date(lot.expiryDate).toLocaleDateString('vi-VN')}</span>
                  <span className="text-[10px] text-[#526a5d]">{Number(lot.currentStock)} {lot.baseUnit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e3e9df] shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-[#f0f3eb] mb-3">
            <h2 className="font-bold text-sm text-[#173b30]">📜 Nhật ký hoạt động gần nhất</h2>
            <Link href="/admin/audit" className="text-xs text-[#175b40] font-bold hover:underline">Tất cả →</Link>
          </div>
          <div className="space-y-2">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="p-2.5 bg-[#f7f8f3] rounded-lg flex justify-between text-xs">
                <div>
                  <span className="font-bold text-[#173b30] block">{log.action}</span>
                  <span className="text-[10px] text-[#667a70]">{log.actorEmail}</span>
                </div>
                <span className="text-[10px] text-[#526a5d] font-mono">{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
