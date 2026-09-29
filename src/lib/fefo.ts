import { Decimal } from '@prisma/client/runtime/library';

export interface LotCandidate {
  id: string;
  lotCode: string;
  ingredientId: string;
  expiryDate: Date;
  createdAt: Date;
  currentStock: Decimal | number | string;
  baseUnit: string;
  supplierId: string;
}

export interface DishRequirement {
  mealDishId: string;
  dishId: string;
  dishName: string;
  ingredientId: string;
  ingredientName: string;
  requiredQty: Decimal; // in base unit (qtyPerServing * servingsCount * (1 + wastePercent/100))
  baseUnit: string;
}

export interface LotAllocationResult {
  mealDishId: string;
  dishId: string;
  ingredientId: string;
  lotId: string;
  lotCode: string;
  allocatedQty: Decimal;
  baseUnit: string;
}

export interface FEFOPlanResult {
  isSufficient: boolean;
  allocations: LotAllocationResult[];
  lotDeductions: Array<{
    lotId: string;
    deductQty: Decimal;
    newStock: Decimal;
  }>;
  missingIngredients: Array<{
    ingredientId: string;
    ingredientName: string;
    required: Decimal;
    available: Decimal;
    shortage: Decimal;
    baseUnit: string;
  }>;
}

/**
 * Calculates required base quantity for a recipe and servings
 */
export function calculateRequiredQty(
  qtyPerServing: Decimal | number | string,
  servingsCount: number,
  wastePercent: Decimal | number | string = 0,
  conversionFactor: Decimal | number | string = 1
): Decimal {
  const qty = new Decimal(qtyPerServing);
  const servings = new Decimal(servingsCount);
  const waste = new Decimal(wastePercent);
  const factor = new Decimal(conversionFactor);

  // baseQty = qtyPerServing * conversionFactor * servings * (1 + wastePercent/100)
  const wasteMultiplier = new Decimal(1).plus(waste.dividedBy(100));
  return qty.times(factor).times(servings).times(wasteMultiplier);
}

/**
 * Calculates FEFO allocation across all dishes and lots for a given meal date
 */
export function planFEFOAllocations(
  dishRequirements: DishRequirement[],
  availableLots: LotCandidate[],
  mealDateStr: string
): FEFOPlanResult {
  const mealDate = new Date(mealDateStr + 'T00:00:00Z');

  // Filter lots valid on mealDate (expiryDate >= mealDate) and currentStock > 0
  const validLots = availableLots.filter((lot) => {
    const expDate = new Date(lot.expiryDate);
    const stock = new Decimal(lot.currentStock);
    return expDate >= mealDate && stock.greaterThan(0);
  });

  // Sort valid lots by FEFO: expiryDate ASC, createdAt ASC, id ASC
  validLots.sort((a, b) => {
    const expA = new Date(a.expiryDate).getTime();
    const expB = new Date(b.expiryDate).getTime();
    if (expA !== expB) return expA - expB;

    const createA = new Date(a.createdAt).getTime();
    const createB = new Date(b.createdAt).getTime();
    if (createA !== createB) return createA - createB;

    return a.id.localeCompare(b.id);
  });

  // Virtual stock tracker for each lot
  const virtualLotStock = new Map<string, Decimal>();
  validLots.forEach((lot) => {
    virtualLotStock.set(lot.id, new Decimal(lot.currentStock));
  });

  // Aggregate total demand per ingredient
  const ingredientTotalDemand = new Map<string, { total: Decimal; name: string; unit: string }>();
  for (const req of dishRequirements) {
    const existing = ingredientTotalDemand.get(req.ingredientId) || {
      total: new Decimal(0),
      name: req.ingredientName,
      unit: req.baseUnit,
    };
    existing.total = existing.total.plus(req.requiredQty);
    ingredientTotalDemand.set(req.ingredientId, existing);
  }

  // Check sufficiency for each ingredient
  const missingIngredients: FEFOPlanResult['missingIngredients'] = [];
  let isSufficient = true;

  for (const [ingredientId, demand] of ingredientTotalDemand.entries()) {
    const ingredientLots = validLots.filter((l) => l.ingredientId === ingredientId);
    const totalAvailable = ingredientLots.reduce(
      (sum, l) => sum.plus(new Decimal(l.currentStock)),
      new Decimal(0)
    );

    if (totalAvailable.lessThan(demand.total)) {
      isSufficient = false;
      missingIngredients.push({
        ingredientId,
        ingredientName: demand.name,
        required: demand.total,
        available: totalAvailable,
        shortage: demand.total.minus(totalAvailable),
        baseUnit: demand.unit,
      });
    }
  }

  if (!isSufficient) {
    return {
      isSufficient: false,
      allocations: [],
      lotDeductions: [],
      missingIngredients,
    };
  }

  // Allocate lots per dish requirement
  const allocations: LotAllocationResult[] = [];

  for (const req of dishRequirements) {
    let needed = new Decimal(req.requiredQty);
    const candidateLots = validLots.filter((l) => l.ingredientId === req.ingredientId);

    for (const lot of candidateLots) {
      if (needed.isZero()) break;

      const currentStock = virtualLotStock.get(lot.id) || new Decimal(0);
      if (currentStock.isZero()) continue;

      const takeQty = Decimal.min(needed, currentStock);
      allocations.push({
        mealDishId: req.mealDishId,
        dishId: req.dishId,
        ingredientId: req.ingredientId,
        lotId: lot.id,
        lotCode: lot.lotCode,
        allocatedQty: takeQty,
        baseUnit: req.baseUnit,
      });

      virtualLotStock.set(lot.id, currentStock.minus(takeQty));
      needed = needed.minus(takeQty);
    }
  }

  // Calculate lot deductions
  const lotDeductions: FEFOPlanResult['lotDeductions'] = [];
  for (const lot of validLots) {
    const initial = new Decimal(lot.currentStock);
    const remaining = virtualLotStock.get(lot.id) || new Decimal(0);
    const deduct = initial.minus(remaining);
    if (deduct.greaterThan(0)) {
      lotDeductions.push({
        lotId: lot.id,
        deductQty: deduct,
        newStock: remaining,
      });
    }
  }

  return {
    isSufficient: true,
    allocations,
    lotDeductions,
    missingIngredients: [],
  };
}

export interface CandidateLot {
  id: string;
  lotNumber: string;
  ingredientId: string;
  currentQty: number | Decimal;
  unit: string;
  receivedDate: Date;
  expiryDate: Date;
}

export interface IngredientDemand {
  dishId: string;
  dishName: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  requiredQty: number | Decimal;
}

export interface FEFOAllocationOutput {
  dishId: string;
  dishName: string;
  ingredientId: string;
  lotId: string;
  lotNumber: string;
  allocatedQty: number;
  unit: string;
}

export interface FEFOShortage {
  ingredientId: string;
  ingredientName: string;
  requiredQty: number;
  availableQty: number;
  shortageQty: number;
  unit: string;
}

export interface CalculateFEFOResult {
  allocations: FEFOAllocationOutput[];
  shortages: FEFOShortage[];
  remainingLots: Map<string, number>;
}

export function calculateFEFOAllocations(
  demands: IngredientDemand[],
  candidateLots: CandidateLot[]
): CalculateFEFOResult {
  // Sort lots by earliest expiry date ASC, then receivedDate ASC, then id ASC
  const sortedLots = [...candidateLots].sort((a, b) => {
    const expA = new Date(a.expiryDate).getTime();
    const expB = new Date(b.expiryDate).getTime();
    if (expA !== expB) return expA - expB;

    const recA = new Date(a.receivedDate).getTime();
    const recB = new Date(b.receivedDate).getTime();
    if (recA !== recB) return recA - recB;

    return a.id.localeCompare(b.id);
  });

  const remainingLots = new Map<string, number>();
  for (const lot of sortedLots) {
    remainingLots.set(lot.id, Number(lot.currentQty));
  }

  // Calculate total required vs total available per ingredient
  const totalRequired = new Map<string, { total: number; name: string; unit: string }>();
  for (const d of demands) {
    const existing = totalRequired.get(d.ingredientId) || {
      total: 0,
      name: d.ingredientName,
      unit: d.unit,
    };
    existing.total += Number(d.requiredQty);
    totalRequired.set(d.ingredientId, existing);
  }

  const shortages: FEFOShortage[] = [];
  for (const [ingredientId, info] of totalRequired.entries()) {
    const totalAvail = sortedLots
      .filter((l) => l.ingredientId === ingredientId)
      .reduce((sum, l) => sum + Number(l.currentQty), 0);

    if (totalAvail < info.total) {
      shortages.push({
        ingredientId,
        ingredientName: info.name,
        requiredQty: info.total,
        availableQty: totalAvail,
        shortageQty: info.total - totalAvail,
        unit: info.unit,
      });
    }
  }

  if (shortages.length > 0) {
    return {
      allocations: [],
      shortages,
      remainingLots,
    };
  }

  const allocations: FEFOAllocationOutput[] = [];

  for (const demand of demands) {
    let needed = Number(demand.requiredQty);
    const matchingLots = sortedLots.filter((l) => l.ingredientId === demand.ingredientId);

    for (const lot of matchingLots) {
      if (needed <= 0) break;

      const currentAvailable = remainingLots.get(lot.id) || 0;
      if (currentAvailable <= 0) continue;

      const take = Math.min(needed, currentAvailable);
      allocations.push({
        dishId: demand.dishId,
        dishName: demand.dishName,
        ingredientId: demand.ingredientId,
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        allocatedQty: take,
        unit: demand.unit,
      });

      remainingLots.set(lot.id, currentAvailable - take);
      needed -= take;
    }
  }

  return {
    allocations,
    shortages: [],
    remainingLots,
  };
}

export function checkStockAvailability(
  demands: IngredientDemand[],
  candidateLots: CandidateLot[]
): { hasSufficientStock: boolean; shortages: FEFOShortage[] } {
  const result = calculateFEFOAllocations(demands, candidateLots);
  return {
    hasSufficientStock: result.shortages.length === 0,
    shortages: result.shortages,
  };
}

