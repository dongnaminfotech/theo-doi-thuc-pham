import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-[#173b30]">Nhật ký Kiểm định (Audit Trail)</h1>
        <p className="text-xs text-[#667a70] mt-0.5">
          Ghi nhận toàn bộ thao tác thêm, sửa, xuất kho, phát hành và thu hồi bất biến trên toàn hệ thống
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e3e9df] shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f7f8f3] text-[#667a70] border-b border-[#e3e9df]">
            <tr>
              <th className="p-3">Thời gian</th>
              <th className="p-3">Người thực hiện</th>
              <th className="p-3">Hành động</th>
              <th className="p-3">Đối tượng</th>
              <th className="p-3">Dữ liệu chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3eb]">
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[#667a70]">
                  Chưa có nhật ký ghi nhận
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f7f8f3]">
                  <td className="p-3 whitespace-nowrap text-[#667a70] font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-3">
                    <strong className="text-[#173b30] block">{log.actorEmail}</strong>
                    <span className="text-[10px] text-[#667a70]">{log.ipAddress || '127.0.0.1'}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-[#175b40] bg-[#eaf5df] px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[#526a5d] text-[11px]">
                    {log.entityType} ({log.entityId?.slice(0, 8) || 'N/A'})
                  </td>
                  <td className="p-3 text-[#667a70]">
                    {log.afterData ? (
                      <code className="text-[10px] bg-[#f7f8f3] p-1 rounded font-mono block max-w-xs truncate">
                        {log.afterData}
                      </code>
                    ) : (
                      <span className="text-[11px] italic">Không có thay đổi</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
