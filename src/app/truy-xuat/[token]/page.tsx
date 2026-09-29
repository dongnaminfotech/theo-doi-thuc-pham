import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { PublicMealSnapshot, generateQRCodeDataUrl, computeSnapshotHash } from '@/lib/snapshot';

export const dynamic = 'force-dynamic';

export default async function TraceDetailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const traceRecord = await prisma.traceSnapshot.findUnique({
    where: { publicToken: token },
  });

  if (!traceRecord) notFound();

  let snapshot: PublicMealSnapshot;
  try {
    snapshot = JSON.parse(traceRecord.snapshotData);
  } catch {
    notFound();
  }

  const qrCodeUrl = await generateQRCodeDataUrl(`https://newgreen.edu.vn/truy-xuat/${token}`);
  const hashSeal = computeSnapshotHash(snapshot);

  return (
    <>
      <PublicHeader />
      <main className="flex-1 py-8">
        <div className="shell max-w-4xl">
          {traceRecord.isRevoked && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs">
              <strong>⚠️ Bản chụp đã thu hồi:</strong> {traceRecord.revokedReason || 'Dữ liệu đã được điều chỉnh.'}
            </div>
          )}

          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#e3e9df] shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#f0f3eb]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-verified">Bản chụp số nguyên bản ✓</span>
                  <span className="text-xs font-mono text-[#667a70]">v{traceRecord.version}</span>
                </div>
                <h1 className="text-2xl font-black text-[#173b30]">Truy xuất nguồn gốc bữa ăn</h1>
                <p className="text-sm font-bold text-[#175b40] mt-1">
                  {snapshot.school?.name} • {snapshot.mealTypeName} ({snapshot.mealDate})
                </p>
              </div>
              <div className="flex flex-col items-center bg-[#f7f8f3] p-2 rounded-xl border border-[#e3e9df]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 rounded" />
                <span className="text-[9px] font-mono text-[#667a70] mt-1">Quét mã kiểm tra</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
              <div>
                <span className="text-[#667a70] block">Số suất</span>
                <strong>{snapshot.servingsCount || snapshot.portions || 0} suất</strong>
              </div>
              <div>
                <span className="text-[#667a70] block">Công bố</span>
                <strong>{new Date(traceRecord.publishedAt).toLocaleDateString('vi-VN')}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-[#667a70] block">SHA-256</span>
                <code className="text-[10px] text-[#175b40] font-mono break-all">{hashSeal.slice(0, 32)}...</code>
              </div>
            </div>
          </div>

          {/* Dishes */}
          <div className="space-y-5">
            <h2 className="text-lg font-black text-[#173b30]">Chi tiết món ăn & Lô hàng</h2>
            {snapshot.dishes?.map((dish, dIdx) => (
              <div key={dIdx} className="bg-white p-5 rounded-2xl border border-[#e3e9df] shadow-sm">
                <div className="flex justify-between pb-3 border-b border-[#f0f3eb] mb-3">
                  <h3 className="font-bold text-base text-[#173b30]">{dish.dishName}</h3>
                  {dish.categoryName && (
                    <span className="text-[10px] font-bold text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded">{dish.categoryName}</span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {dish.ingredients?.map((ing, iIdx) => (
                    <div key={iIdx} className="p-3 bg-[#f7f8f3] rounded-xl text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <strong className="text-[#173b30]">{ing.ingredientName}</strong>
                        <span className="font-mono text-[#667a70]">Lô: <strong>{ing.lotNumber || 'LOT-OK'}</strong></span>
                      </div>
                      {ing.supplier && (
                        <div className="pt-1.5 border-t border-[#e7ede5] text-[11px] text-[#526a5d]">
                          <div>🏢 {ing.supplier.name} {ing.supplier.taxCode ? `(MST: ${ing.supplier.taxCode})` : ''}</div>
                          {ing.supplier.documents && ing.supplier.documents.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {ing.supplier.documents.map((doc, docIdx) => (
                                <span key={docIdx} className="px-2 py-0.5 bg-white border border-[#d1dec9] rounded text-[10px] text-[#173b30]">
                                  📜 {doc.docType} ({doc.docNumber}) <span className="text-[#175b40] font-bold">✓</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
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
