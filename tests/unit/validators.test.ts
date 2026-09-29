import { describe, it, expect } from 'vitest';
import { createSchoolSchema } from '@/validators/school';
import { createDishSchema } from '@/validators/dish';
import { createReceiptSchema } from '@/validators/receipt';
import { createMealPlanSchema } from '@/validators/meal';

const VALID_UUID_1 = 'a0000000-0000-0000-0000-000000000001';
const VALID_UUID_2 = 'a0000000-0000-0000-0000-000000000002';
const VALID_UUID_3 = 'a0000000-0000-0000-0000-000000000003';

describe('Zod Input Validation Schemas', () => {
  it('should validate createSchoolSchema correctly', () => {
    const valid = {
      code: 'TH-01',
      name: 'Trường Tiểu học Chu Văn An',
      slug: 'tieu-hoc-chu-van-an',
      address: 'Thụy Khuê, Tây Hồ, Hà Nội',
      phone: '024 3823 4567',
    };

    expect(() => createSchoolSchema.parse(valid)).not.toThrow();

    // Invalid slug with uppercase or special characters
    expect(() =>
      createSchoolSchema.parse({
        ...valid,
        slug: 'Tieu-Hoc-Chu-Van-An!',
      })
    ).toThrow();
  });

  it('should validate createDishSchema correctly', () => {
    const valid = {
      code: 'DISH-COM-RANG',
      name: 'Cơm rang thập cẩm',
      categoryId: VALID_UUID_1,
    };

    expect(() => createDishSchema.parse(valid)).not.toThrow();

    // Invalid categoryId not UUID
    expect(() =>
      createDishSchema.parse({
        ...valid,
        categoryId: 'not-a-uuid',
      })
    ).toThrow();
  });

  it('should validate createReceiptSchema with item lots', () => {
    const valid = {
      receiptNumber: 'PNK-001',
      schoolId: VALID_UUID_1,
      supplierId: VALID_UUID_2,
      receiptDate: '2026-09-29',
      items: [
        {
          ingredientId: VALID_UUID_3,
          lotCode: 'LOT-001',
          quantity: 50,
          baseQuantity: 50,
          unit: 'kg',
          unitPrice: 25000,
          mfgDate: '2026-09-28',
          expiryDate: '2026-10-15',
        },
      ],
    };

    expect(() => createReceiptSchema.parse(valid)).not.toThrow();

    // Invalid empty items array
    expect(() =>
      createReceiptSchema.parse({
        ...valid,
        items: [],
      })
    ).toThrow();
  });

  it('should validate createMealPlanSchema', () => {
    const valid = {
      schoolId: VALID_UUID_1,
      mealDate: '2026-09-29',
      mealType: 'LUNCH' as const,
      servingsCount: 300,
      dishes: [{ dishId: VALID_UUID_2, sortOrder: 1 }],
    };

    expect(() => createMealPlanSchema.parse(valid)).not.toThrow();

    // Invalid date format
    expect(() =>
      createMealPlanSchema.parse({
        ...valid,
        mealDate: '29/09/2026',
      })
    ).toThrow();

    // Invalid empty dishes
    expect(() =>
      createMealPlanSchema.parse({
        ...valid,
        dishes: [],
      })
    ).toThrow();
  });
});

