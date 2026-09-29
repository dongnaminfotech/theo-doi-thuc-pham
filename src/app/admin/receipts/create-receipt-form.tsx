'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateReceiptForm({
  schools,
  suppliers,
  ingredients,
}: {
  schools: any[];
  suppliers: any[];
  ingredients: any[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [schoolId, setSchoolId] = useState(schools[0]?.id || '');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [receiptNumber, setReceiptNumber] = useState(`PNK-${Date.now().toString().slice(-6)}`);
  const [receiptDate, setReceiptDate] = useState('2026-09-29');

  const [items, setItems] = useState([
    {
      ingredientId: ingredients[0]?.id || '',
      unit: 'kg',
      quantity: 50,
      unitPrice: 30000,
      baseQuantity: 50,
      lotCode: `LOT-${Date.now().toString().slice(-4)}`,
      mfgDate: '2026-09-28',
      expiryDate: '2026-10-15',
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, supplierId, receiptNumber, receiptDate, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Không thể tạo phiếu nhập');

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#e3e9df] shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-sm text-[#173b30]">Tạo Phiếu nhập kho & Lô hàng FEFO</h2>
          <p className="text-xs text-[#667a70]">Nhập hàng mới từ nhà cung cấp có kiểm định</p>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="btn-primary text-xs">
          {isOpen ? 'Đóng Form' : '+ Nhập kho mới'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-[#f0f3eb] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="font-bold block mb-1">Trường nhận</label>
              <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="w-full p-2 bg-[#f7f8f3] border rounded-lg">
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Nhà cung cấp</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full p-2 bg-[#f7f8f3] border rounded-lg">
                {suppliers.map((sup) => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Số phiếu</label>
              <input type="text" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} className="w-full p-2 bg-[#f7f8f3] border rounded-lg font-mono" />
            </div>
            <div>
              <label className="font-bold block mb-1">Ngày nhập</label>
              <input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} className="w-full p-2 bg-[#f7f8f3] border rounded-lg" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary text-xs py-2 w-full disabled:opacity-50">
            {loading ? 'Đang lưu...' : 'Xác nhận Nhập kho & Sinh mã Lô FEFO →'}
          </button>
        </form>
      )}
    </div>
  );
}
