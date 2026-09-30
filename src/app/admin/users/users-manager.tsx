'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Role, UserStatus } from '@prisma/client';

type School = { id: string; name: string; code: string };
type User = { id: string; email: string; name: string; role: Role; status: UserStatus; hasPassword: boolean; userSchools: { schoolId: string; school: { name: string } }[] };
type Form = { name: string; email: string; password: string; role: Role; status: UserStatus; schoolIds: string[] };
const roleLabels: Record<Role, string> = { SUPER_ADMIN: 'Quản trị toàn hệ thống', SCHOOL_ADMIN: 'Quản trị trường', KITCHEN: 'Nhân viên bếp', WAREHOUSE: 'Nhân viên kho', AUDITOR: 'Kiểm tra / giám sát' };
const blank: Form = { name: '', email: '', password: '', role: 'KITCHEN', status: 'ACTIVE', schoolIds: [] };

export default function UsersManager({ initialUsers, schools }: { initialUsers: User[]; schools: School[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState<Form>(blank);
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  const openCreate = () => { setEditing(null); setForm(blank); setMessage(null); setOpen(true); };
  const openEdit = (user: User) => { setEditing(user); setForm({ name: user.name, email: user.email, password: '', role: user.role, status: user.status, schoolIds: user.userSchools.map((x) => x.schoolId) }); setMessage(null); setOpen(true); };
  const parse = async (response: Response) => { const json = await response.json(); if (!response.ok) throw new Error(json.error?.message || 'Yêu cầu thất bại'); return json.data; };
  const reload = async () => { setUsers(await parse(await fetch('/api/admin/users'))); router.refresh(); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const payload = { ...form, schoolIds: form.role === 'SUPER_ADMIN' ? [] : form.schoolIds };
      await parse(await fetch(editing ? `/api/admin/users/${editing.id}` : '/api/admin/users', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
      await reload(); setOpen(false); setMessage({ error: false, text: editing ? 'Đã cập nhật người dùng và quyền.' : 'Đã thêm người dùng.' });
    } catch (error) { setMessage({ error: true, text: error instanceof Error ? error.message : 'Có lỗi xảy ra' }); } finally { setBusy(false); }
  };
  const remove = async (user: User) => {
    if (!confirm(`Xóa tài khoản ${user.email}?`)) return;
    setBusy(true); setMessage(null);
    try { await parse(await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })); setUsers((old) => old.filter((x) => x.id !== user.id)); setMessage({ error: false, text: 'Đã xóa người dùng.' }); router.refresh(); }
    catch (error) { setMessage({ error: true, text: error instanceof Error ? error.message : 'Không thể xóa người dùng' }); } finally { setBusy(false); }
  };

  return <div className="space-y-6 max-w-7xl">
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-2xl font-black text-[#173b30]">Người dùng & Phân quyền RBAC</h1><p className="text-xs text-[#667a70]">Quản lý tài khoản, vai trò và phạm vi trường.</p></div><button onClick={openCreate} className="btn-primary text-xs px-4 py-2.5">＋ Thêm người dùng</button></header>
    {message && <p className={`p-3 rounded-xl border text-xs font-bold ${message.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>{message.text}</p>}
    <div className="bg-white rounded-2xl border border-[#e3e9df] overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-[#f7f8f3] text-[#667a70]"><tr><th className="p-3">Họ tên & Email</th><th className="p-3">Vai trò</th><th className="p-3">Trường phụ trách</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-[#f0f3eb]">
      {users.map((user) => <tr key={user.id}><td className="p-3"><strong className="block text-[#173b30]">{user.name}</strong><span>{user.email}</span>{!user.hasPassword && <small className="block text-amber-700">Chưa đặt mật khẩu</small>}</td><td className="p-3 font-bold text-[#175b40]">{roleLabels[user.role]}</td><td className="p-3">{user.role === 'SUPER_ADMIN' ? 'Toàn hệ thống' : user.userSchools.map((x) => x.school.name).join(', ') || 'Chưa gán trường'}</td><td className="p-3">{user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}</td><td className="p-3 text-right whitespace-nowrap"><button onClick={() => openEdit(user)} className="font-bold text-[#175b40] mr-4">Sửa</button><button disabled={busy} onClick={() => remove(user)} className="font-bold text-red-600">Xóa</button></td></tr>)}
    </tbody></table></div>
    {open && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={submit} className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
      <div className="flex justify-between"><h2 className="font-black text-[#173b30]">{editing ? 'Chỉnh sửa người dùng & quyền' : 'Thêm người dùng'}</h2><button type="button" onClick={() => setOpen(false)}>✕</button></div>
      {message?.error && <p className="p-3 bg-red-50 text-red-700 rounded-xl text-xs">{message.text}</p>}
      <div className="grid sm:grid-cols-2 gap-4"><label className="text-xs font-bold">Họ và tên *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="block w-full mt-1 p-2.5 border rounded-xl font-normal" /></label><label className="text-xs font-bold">Email *<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="block w-full mt-1 p-2.5 border rounded-xl font-normal" /></label></div>
      <label className="block text-xs font-bold">{editing ? 'Mật khẩu mới (để trống để giữ nguyên)' : 'Mật khẩu'}<input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="block w-full mt-1 p-2.5 border rounded-xl font-normal" /></label>
      <div className="grid sm:grid-cols-2 gap-4"><label className="text-xs font-bold">Vai trò<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="block w-full mt-1 p-2.5 border rounded-xl bg-white font-normal">{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-bold">Trạng thái<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })} className="block w-full mt-1 p-2.5 border rounded-xl bg-white font-normal"><option value="ACTIVE">Hoạt động</option><option value="DISABLED">Khóa tài khoản</option></select></label></div>
      {form.role === 'SUPER_ADMIN' ? <p className="p-3 bg-green-50 text-green-800 rounded-xl text-xs">Vai trò này có quyền trên toàn hệ thống.</p> : <fieldset className="border rounded-xl p-3"><legend className="text-xs font-bold px-1">Trường được phép truy cập</legend><div className="grid sm:grid-cols-2 gap-2">{schools.map((school) => <label key={school.id} className="p-2 bg-[#f7f8f3] rounded-lg text-xs"><input type="checkbox" className="mr-2" checked={form.schoolIds.includes(school.id)} onChange={() => setForm((old) => ({ ...old, schoolIds: old.schoolIds.includes(school.id) ? old.schoolIds.filter((id) => id !== school.id) : [...old.schoolIds, school.id] }))} />{school.name} ({school.code})</label>)}</div></fieldset>}
      <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold">Hủy</button><button disabled={busy} className="btn-primary px-4 py-2 text-xs">{busy ? 'Đang lưu...' : 'Lưu'}</button></div>
    </form></div>}
  </div>;
}
