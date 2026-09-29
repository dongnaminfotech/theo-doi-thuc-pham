import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { TxType } from '@prisma/client';
import { UserContext } from '@/lib/rbac';

export interface CreateReceiptDTO {
  schoolId: string;
  supplierId: string;
  receiptNumber: string;
  receiptDate: string;
  notes?: string | null;
  items: Array<{
    ingredientId: string;
    unit: string;
    quantity: number;
    unitPrice?: number;
    baseQuantity: number;
    lotCode: string;
    mfgDate: string;
    expiryDate: string;
  }>;
}

export class InventoryService {
  /**
   * Creates a Goods Receipt with Items, Lots, and IN Transactions atomically
   */
  static async createReceipt(data: CreateReceiptDTO, actor?: UserContext | null) {
    const receiptDate = new Date(data.receiptDate);

    for (const item of data.items) {
      const exp = new Date(item.expiryDate);
      if (exp < receiptDate) {
        throw new Error(`Lô ${item.lotCode} có hạn sử dụng (${item.expiryDate}) trước ngày nhập (${data.receiptDate})`);
      }
    }

    return prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          schoolId: data.schoolId,
          supplierId: data.supplierId,
          receiptNumber: data.receiptNumber.trim(),
          receiptDate,
          notes: data.notes?.trim(),
          createdById: actor?.id || null,
        },
      });

      for (const item of data.items) {
        const itemQty = new Decimal(item.quantity);
        const itemPrice = new Decimal(item.unitPrice || 0);
        const totalAmount = itemQty.times(itemPrice);
        const baseQty = new Decimal(item.baseQuantity);

        const receiptItem = await tx.receiptItem.create({
          data: {
            receiptId: receipt.id,
            ingredientId: item.ingredientId,
            unit: item.unit.trim(),
            quantity: itemQty,
            unitPrice: itemPrice,
            totalAmount,
            baseQuantity: baseQty,
          },
        });

        const ing = await tx.ingredient.findUnique({
          where: { id: item.ingredientId },
        });

        const lot = await tx.lot.create({
          data: {
            receiptItemId: receiptItem.id,
            schoolId: data.schoolId,
            ingredientId: item.ingredientId,
            supplierId: data.supplierId,
            lotCode: item.lotCode.trim(),
            mfgDate: new Date(item.mfgDate),
            expiryDate: new Date(item.expiryDate),
            initialQuantity: baseQty,
            currentStock: baseQty,
            baseUnit: ing?.baseUnit || item.unit,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            schoolId: data.schoolId,
            lotId: lot.id,
            ingredientId: item.ingredientId,
            txType: 'IN',
            quantity: baseQty,
            referenceType: 'RECEIPT',
            referenceId: receipt.id,
            actorId: actor?.id || null,
            notes: `Nhập kho theo phiếu ${data.receiptNumber}`,
          },
        });
      }

      return receipt;
    });
  }

  static async getReceipts(schoolId: string) {
    return prisma.receipt.findMany({
      where: { schoolId },
      orderBy: { receiptDate: 'desc' },
      include: {
        supplier: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            ingredient: true,
            lots: true,
          },
        },
      },
    });
  }

  static async getLots(schoolId: string, ingredientId?: string) {
    return prisma.lot.findMany({
      where: {
        schoolId,
        ingredientId: ingredientId || undefined,
        currentStock: { gt: 0 },
      },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        ingredient: true,
        supplier: true,
      },
    });
  }

  static async getStockSummary(schoolId: string) {
    const lots = await prisma.lot.findMany({
      where: { schoolId },
      include: {
        ingredient: true,
      },
    });

    const summaryMap = new Map<string, {
      ingredientId: string;
      ingredientCode: string;
      ingredientName: string;
      baseUnit: string;
      totalStock: Decimal;
      activeLotsCount: number;
      expiringLotsCount: number;
    }>();

    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);

    for (const lot of lots) {
      const stock = new Decimal(lot.currentStock);
      const existing = summaryMap.get(lot.ingredientId) || {
        ingredientId: lot.ingredientId,
        ingredientCode: lot.ingredient.code,
        ingredientName: lot.ingredient.name,
        baseUnit: lot.ingredient.baseUnit,
        totalStock: new Decimal(0),
        activeLotsCount: 0,
        expiringLotsCount: 0,
      };

      existing.totalStock = existing.totalStock.plus(stock);
      if (stock.greaterThan(0)) {
        existing.activeLotsCount += 1;
        if (new Date(lot.expiryDate) <= sevenDaysLater) {
          existing.expiringLotsCount += 1;
        }
      }

      summaryMap.set(lot.ingredientId, existing);
    }

    return Array.from(summaryMap.values());
  }

  static async adjustStock(
    data: {
      schoolId: string;
      lotId: string;
      txType: 'ADJUST_IN' | 'ADJUST_OUT' | 'RETURN';
      quantity: number;
      reason: string;
    },
    actor?: UserContext | null
  ) {
    const qty = new Decimal(data.quantity);
    if (qty.lessThanOrEqualTo(0)) throw new Error('Số lượng điều chỉnh phải lớn hơn 0');

    return prisma.$transaction(async (tx) => {
      const lot = await tx.lot.findUnique({
        where: { id: data.lotId },
      });

      if (!lot || lot.schoolId !== data.schoolId) {
        throw new Error('Lô hàng không tồn tại hoặc không thuộc trường');
      }

      const currentStock = new Decimal(lot.currentStock);
      let newStock: Decimal;

      if (data.txType === 'ADJUST_IN') {
        newStock = currentStock.plus(qty);
      } else {
        if (currentStock.lessThan(qty)) {
          throw new Error(`Tồn kho hiện tại (${currentStock}) không đủ để giảm ${qty}`);
        }
        newStock = currentStock.minus(qty);
      }

      await tx.lot.update({
        where: { id: lot.id },
        data: { currentStock: newStock },
      });

      return tx.inventoryTransaction.create({
        data: {
          schoolId: data.schoolId,
          lotId: lot.id,
          ingredientId: lot.ingredientId,
          txType: data.txType,
          quantity: qty,
          referenceType: 'ADJUSTMENT',
          referenceId: null,
          notes: data.reason.trim(),
          actorId: actor?.id || null,
        },
      });
    });
  }

}
