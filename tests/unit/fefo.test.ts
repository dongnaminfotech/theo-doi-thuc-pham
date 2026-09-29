import { describe, it, expect } from 'vitest';
import { calculateFEFOAllocations, checkStockAvailability, CandidateLot, IngredientDemand } from '@/lib/fefo';

describe('FEFO (First Expired, First Out) Algorithm Engine', () => {
  const mockLots: CandidateLot[] = [
    {
      id: 'lot-3',
      lotNumber: 'LOT-EXP-OCT-10',
      ingredientId: 'ing-meat',
      currentQty: 20,
      unit: 'kg',
      receivedDate: new Date('2026-09-01'),
      expiryDate: new Date('2026-10-10'),
    },
    {
      id: 'lot-1',
      lotNumber: 'LOT-EXP-OCT-01',
      ingredientId: 'ing-meat',
      currentQty: 10,
      unit: 'kg',
      receivedDate: new Date('2026-09-05'),
      expiryDate: new Date('2026-10-01'), // Earliest expiry!
    },
    {
      id: 'lot-2',
      lotNumber: 'LOT-EXP-OCT-05',
      ingredientId: 'ing-meat',
      currentQty: 15,
      unit: 'kg',
      receivedDate: new Date('2026-09-02'),
      expiryDate: new Date('2026-10-05'),
    },
  ];

  it('should allocate lots in order of earliest expiryDate (FEFO)', () => {
    const demands: IngredientDemand[] = [
      {
        dishId: 'dish-1',
        dishName: 'Thịt kho trứng',
        ingredientId: 'ing-meat',
        ingredientName: 'Thịt heo nạc',
        unit: 'kg',
        requiredQty: 15, // Needs 15kg -> should take 10kg from lot-1, then 5kg from lot-2
      },
    ];

    const result = calculateFEFOAllocations(demands, mockLots);

    expect(result.shortages).toHaveLength(0);
    expect(result.allocations).toHaveLength(2);

    expect(result.allocations[0]).toEqual({
      dishId: 'dish-1',
      dishName: 'Thịt kho trứng',
      ingredientId: 'ing-meat',
      lotId: 'lot-1',
      lotNumber: 'LOT-EXP-OCT-01',
      allocatedQty: 10,
      unit: 'kg',
    });

    expect(result.allocations[1]).toEqual({
      dishId: 'dish-1',
      dishName: 'Thịt kho trứng',
      ingredientId: 'ing-meat',
      lotId: 'lot-2',
      lotNumber: 'LOT-EXP-OCT-05',
      allocatedQty: 5,
      unit: 'kg',
    });

    expect(result.remainingLots.get('lot-1')).toBe(0);
    expect(result.remainingLots.get('lot-2')).toBe(10);
    expect(result.remainingLots.get('lot-3')).toBe(20);
  });

  it('should allocate multiple dishes requiring the same ingredient seamlessly', () => {
    const demands: IngredientDemand[] = [
      {
        dishId: 'dish-1',
        dishName: 'Thịt kho',
        ingredientId: 'ing-meat',
        ingredientName: 'Thịt heo',
        unit: 'kg',
        requiredQty: 12, // takes 10kg lot-1, 2kg lot-2
      },
      {
        dishId: 'dish-2',
        dishName: 'Canh bí đỏ thịt',
        ingredientId: 'ing-meat',
        ingredientName: 'Thịt heo',
        unit: 'kg',
        requiredQty: 5, // takes 5kg lot-2
      },
    ];

    const result = calculateFEFOAllocations(demands, mockLots);
    expect(result.shortages).toHaveLength(0);
    expect(result.allocations).toHaveLength(3);

    // dish 1 allocations
    expect(result.allocations[0].dishId).toBe('dish-1');
    expect(result.allocations[0].lotId).toBe('lot-1');
    expect(result.allocations[0].allocatedQty).toBe(10);

    expect(result.allocations[1].dishId).toBe('dish-1');
    expect(result.allocations[1].lotId).toBe('lot-2');
    expect(result.allocations[1].allocatedQty).toBe(2);

    // dish 2 allocation
    expect(result.allocations[2].dishId).toBe('dish-2');
    expect(result.allocations[2].lotId).toBe('lot-2');
    expect(result.allocations[2].allocatedQty).toBe(5);

    expect(result.remainingLots.get('lot-1')).toBe(0);
    expect(result.remainingLots.get('lot-2')).toBe(8); // 15 - 2 - 5 = 8
  });

  it('should detect shortage accurately when demand exceeds total lot quantities', () => {
    const demands: IngredientDemand[] = [
      {
        dishId: 'dish-1',
        dishName: 'Tiệc buffet thịt',
        ingredientId: 'ing-meat',
        ingredientName: 'Thịt heo',
        unit: 'kg',
        requiredQty: 50, // Total available is 10 + 15 + 20 = 45 -> Shortage of 5kg
      },
    ];

    const result = calculateFEFOAllocations(demands, mockLots);
    expect(result.shortages).toHaveLength(1);
    expect(result.shortages[0]).toEqual({
      ingredientId: 'ing-meat',
      ingredientName: 'Thịt heo',
      requiredQty: 50,
      availableQty: 45,
      shortageQty: 5,
      unit: 'kg',
    });
  });

  it('should check stock availability and return hasSufficientStock boolean and summary', () => {
    const demands: IngredientDemand[] = [
      {
        dishId: 'dish-1',
        dishName: 'Món 1',
        ingredientId: 'ing-meat',
        ingredientName: 'Thịt heo',
        unit: 'kg',
        requiredQty: 40,
      },
    ];

    const check1 = checkStockAvailability(demands, mockLots);
    expect(check1.hasSufficientStock).toBe(true);
    expect(check1.shortages).toHaveLength(0);

    const check2 = checkStockAvailability(
      [{ dishId: 'd1', dishName: 'm1', ingredientId: 'ing-meat', ingredientName: 'Thịt', requiredQty: 60, unit: 'kg' }],
      mockLots
    );
    expect(check2.hasSufficientStock).toBe(false);
    expect(check2.shortages[0].shortageQty).toBe(15);
  });
});
