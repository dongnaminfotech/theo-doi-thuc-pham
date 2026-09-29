import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminSuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      documents: true,
      _count: {
        select: { lots: true, receipts: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-[#173b30]">Nhà Cung Cấp & Chứng Nhận ATTP</h1>
        <p className="text-xs text-[#667a70] mt-0.5">
          Quản lý các đơn vị cung ứng thực phẩm và hồ sơ pháp lý, kiểm dịch, chứng nhận VietGAP/HACCP
        </p>
      </div>

      <div className="space-y-4">
        {suppliers.map((sup) => (
          <div key={sup.id} className="bg-white p-5 rounded-2xl border border-[#e3e9df] shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between pb-3 border-b border-[#f0f3eb] gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded">
                    {sup.code}
                  </span>
                  <h3 className="font-bold text-base text-[#173b30]">{sup.name}</h3>
                </div>
                <p className="text-xs text-[#667a70] mt-1">
                  📍 {sup.address || 'Hà Nội'} • MST: {sup.taxCode || 'Chưa cập nhật'} • 📞 {sup.phone || 'N/A'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge-verified">Đối tác tin cậy ✓</span>
              </div>
            </div>

            {/* Documents */}
            <div>
              <span className="font-bold text-xs text-[#526a5d] block mb-2">
                Hồ sơ & Chứng nhận An toàn Thực phẩm ({sup.documents.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {sup.documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-[#f7f8f3] border border-[#e7ede5] rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-[#173b30] block">📜 {doc.docType}</strong>
                      <span className="text-[11px] text-[#667a70] font-mono">Số: {doc.docNumber}</span>
                      <span className="text-[10px] text-red-700 block mt-0.5">
                        HSD: {new Date(doc.expiryDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <span className="badge-verified text-[10px]">{doc.verificationStatus}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
