import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      userSchools: {
        include: { school: true },
      },
    },
    orderBy: { email: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-[#173b30]">Người dùng & Phân quyền RBAC</h1>
        <p className="text-xs text-[#667a70] mt-0.5">
          Danh sách tài khoản và phân quyền theo trường (Super Admin, School Admin, Kitchen, Warehouse, Auditor)
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e3e9df] shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f7f8f3] text-[#667a70] border-b border-[#e3e9df]">
            <tr>
              <th className="p-3">Họ tên & Email</th>
              <th className="p-3">Vai trò (Role)</th>
              <th className="p-3">Trường phụ trách</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3eb]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#f7f8f3]">
                <td className="p-3">
                  <strong className="text-[#173b30] block">{u.name}</strong>
                  <span className="text-[#667a70]">{u.email}</span>
                </td>
                <td className="p-3">
                  <span className="bg-[#f0f8df] text-[#175b40] font-bold px-2 py-0.5 rounded text-[11px]">
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  {u.userSchools.length === 0 ? (
                    <span className="text-[#667a70] italic">Toàn hệ thống (Tất cả)</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {u.userSchools.map((us) => (
                        <span key={us.id} className="bg-white px-2 py-0.5 border border-[#e3e9df] rounded text-[11px]">
                          {us.school.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <span className="badge-verified">{u.status} ✓</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
