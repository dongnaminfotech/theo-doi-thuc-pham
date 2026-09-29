import { describe, it, expect } from 'vitest';
import {
  generatePublicToken,
  computeSnapshotHash,
  buildPublicMealSnapshot,
  generateQRCodeDataUrl,
  PublicMealSnapshot,
} from '@/lib/snapshot';

describe('Trace Snapshot & Token Generation', () => {
  it('should generate unique 24-character public tokens with alphanumeric chars', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const token = generatePublicToken();
      expect(token).toMatch(/^[a-zA-Z0-9_-]{24}$/);
      tokens.add(token);
    }
    expect(tokens.size).toBe(100); // All unique
  });

  it('should compute deterministic SHA-256 hash regardless of object key order', () => {
    const objA = {
      a: 1,
      b: 'text',
      c: { nested: true, arr: [1, 2, 3] },
    };

    const objB = {
      c: { arr: [1, 2, 3], nested: true },
      b: 'text',
      a: 1,
    };

    const hashA = computeSnapshotHash(objA);
    const hashB = computeSnapshotHash(objB);

    expect(hashA).toHaveLength(64);
    expect(hashA).toBe(hashB);
  });

  it('should build public meal snapshot properly from DB entities', () => {
    const mockMealPlan: any = {
      id: 'meal-123',
      mealDate: new Date('2026-09-29T00:00:00.000Z'),
      mealType: 'LUNCH',
      actualPortions: 250,
      plannedPortions: 250,
      school: {
        name: 'Trường Tiểu học Ban Mai',
        code: 'TH-BM',
        slug: 'tieu-hoc-ban-mai',
        address: 'Hà Đông, Hà Nội',
        phone: '024 3354 4444',
      },
      dishes: [
        {
          dish: {
            name: 'Thịt bò xào rau củ',
            category: { name: 'Món mặn - Thịt bò & Gà' },
          },
          allocations: [
            {
              lot: {
                lotNumber: 'LOT-BO-01',
                ingredient: { name: 'Thịt bò thăn' },
                supplier: {
                  name: 'Công ty C.P.',
                  taxCode: '3600224523',
                  address: 'Hà Nội',
                  documents: [
                    {
                      docType: 'KiemDich_ThuY',
                      docNumber: 'KD-001',
                      issuedDate: new Date('2026-01-01'),
                      expiryDate: new Date('2026-12-31'),
                      issuedBy: 'Chi cục Thú y',
                      fileUrl: '/uploads/kd.pdf',
                      status: 'VERIFIED',
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    };

    const snapshot = buildPublicMealSnapshot(mockMealPlan, 1);

    expect(snapshot.mealPlanId).toBe('meal-123');
    expect(snapshot.school.name).toBe('Trường Tiểu học Ban Mai');
    expect(snapshot.mealTypeName).toBe('Bữa Trưa');
    expect(snapshot.portions).toBe(250);
    expect(snapshot.dishes).toHaveLength(1);
    expect(snapshot.dishes[0]?.dishName).toBe('Thịt bò xào rau củ');
    expect(snapshot.dishes[0]?.ingredients[0]?.supplier?.name).toBe('Công ty C.P.');
    expect(snapshot.dishes[0]?.ingredients[0]?.supplier?.documents[0]?.docNumber).toBe('KD-001');
    expect(snapshot.version).toBe(1);
  });

  it('should generate valid QR code data URL', async () => {
    const dataUrl = await generateQRCodeDataUrl('https://trace.newgreen.edu.vn/truy-xuat/test1234');
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
