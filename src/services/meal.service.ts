import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { MealStatus, MealType } from '@prisma/client';
import { UserContext } from '@/lib/rbac';
import { calculateRequiredQty, planFEFOAllocations, DishRequirement, LotCandidate } from '@/lib/fefo';
import { generatePublicToken, getMealTypeName, PublicMealSnapshot } from '@/lib/snapshot';
import { getFileUrl } from '@/lib/storage';

export class MealService {
  static async getMealsByDate(schoolId: string, mealDate: string) {
    return prisma.mealPlan.findMany({
      where: { schoolId, mealDate },
      orderBy: [{ mealType: 'asc' }, { slotCode: 'asc' }],
      include: {
        mealDishes: {
          orderBy: { sortOrder: 'asc' },
          include: {
            dish: {
              include: {
                category: true,
                recipes: { include: { ingredient: true } },
              },
            },
            allocations: {
              include: {
                ingredient: true,
                lot: { include: { supplier: true } },
              },
            },
          },
        },
        traceSnapshots: {
          where: { isRevoked: false },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
  }

  static async getMealById(id: string) {
    return prisma.mealPlan.findUnique({
      where: { id },
      include: {
        school: true,
        mealDishes: {
          orderBy: { sortOrder: 'asc' },
          include: {
            dish: {
              include: {
                category: true,
                recipes: { include: { ingredient: true } },
              },
            },
            allocations: {
              include: {
                ingredient: true,
                lot: { include: { supplier: true } },
              },
            },
          },
        },
        traceSnapshots: {
          orderBy: { version: 'desc' },
        },
      },
    });
  }

  static async createMeal(
    data: {
      schoolId: string;
      mealDate: string;
      mealType: MealType;
      slotCode?: string;
      servingsCount: number;
      notes?: string | null;
      dishes: Array<{ dishId: string; sortOrder?: number; notes?: string | null }>;
    },
    actor?: UserContext | null
  ) {
    return prisma.$transaction(async (tx) => {
      const meal = await tx.mealPlan.create({
        data: {
          schoolId: data.schoolId,
          mealDate: data.mealDate,
          mealType: data.mealType,
          slotCode: data.slotCode || 'DEFAULT',
          servingsCount: data.servingsCount,
          status: 'DRAFT',
          notes: data.notes?.trim(),
          createdById: actor?.id || null,
          updatedById: actor?.id || null,
        },
      });

      for (let i = 0; i < data.dishes.length; i++) {
        const d = data.dishes[i];
        await tx.mealDish.create({
          data: {
            mealPlanId: meal.id,
            dishId: d.dishId,
            sortOrder: d.sortOrder ?? i,
            notes: d.notes?.trim(),
          },
        });
      }

      return meal;
    });
  }

  static async updateDraft(
    id: string,
    data: {
      servingsCount?: number;
      notes?: string | null;
      dishes?: Array<{ dishId: string; sortOrder?: number; notes?: string | null }>;
    },
    actor?: UserContext | null
  ) {
    const meal = await prisma.mealPlan.findUnique({ where: { id } });
    if (!meal) throw new Error('Bữa ăn không tồn tại');
    if (meal.status !== 'DRAFT' && meal.status !== 'READY') {
      throw new Error(`Không thể sửa bữa ăn đang ở trạng thái ${meal.status}. Sau khi xuất kho, phải dùng nghiệp vụ điều chỉnh.`);
    }

    return prisma.$transaction(async (tx) => {
      if (data.dishes) {
        await tx.mealDish.deleteMany({ where: { mealPlanId: id } });
        for (let i = 0; i < data.dishes.length; i++) {
          const d = data.dishes[i];
          await tx.mealDish.create({
            data: {
              mealPlanId: id,
              dishId: d.dishId,
              sortOrder: d.sortOrder ?? i,
              notes: d.notes?.trim(),
            },
          });
        }
      }

      return tx.mealPlan.update({
        where: { id },
        data: {
          servingsCount: data.servingsCount !== undefined ? data.servingsCount : undefined,
          notes: data.notes !== undefined ? data.notes?.trim() : undefined,
          status: 'DRAFT', // Reset to DRAFT upon edits
          updatedById: actor?.id || null,
        },
      });
    });
  }

  static async setReady(id: string, actor?: UserContext | null) {
    const meal = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        mealDishes: {
          include: {
            dish: {
              include: { recipes: { where: { isActive: true } } },
            },
          },
        },
      },
    });

    if (!meal) throw new Error('Bữa ăn không tồn tại');
    if (meal.status !== 'DRAFT') throw new Error(`Không thể chuyển READY từ trạng thái ${meal.status}`);
    if (meal.mealDishes.length === 0) throw new Error('Bữa ăn phải có ít nhất 1 món để chuyển READY');
    if (meal.servingsCount <= 0) throw new Error('Số suất ăn phải lớn hơn 0');

    // Check each dish has at least one active recipe
    for (const md of meal.mealDishes) {
      if (md.dish.recipes.length === 0) {
        throw new Error(`Món "${md.dish.name}" chưa có công thức định lượng hợp lệ.`);
      }
    }

    return prisma.mealPlan.update({
      where: { id },
      data: {
        status: 'READY',
        updatedById: actor?.id || null,
      },
    });
  }

  static async setDraft(id: string, actor?: UserContext | null) {
    const meal = await prisma.mealPlan.findUnique({ where: { id } });
    if (!meal) throw new Error('Bữa ăn không tồn tại');
    if (meal.status !== 'READY') throw new Error(`Chỉ có thể đưa về DRAFT từ trạng thái READY (hiện tại: ${meal.status})`);

    return prisma.mealPlan.update({
      where: { id },
      data: {
        status: 'DRAFT',
        updatedById: actor?.id || null,
      },
    });
  }

  static async issueMeal(id: string, idempotencyKey?: string, actor?: UserContext | null) {
    return prisma.$transaction(async (tx) => {
      // 1. Check idempotency if key provided
      if (idempotencyKey) {
        const existingTx = await tx.inventoryTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existingTx) {
          const meal = await tx.mealPlan.findUnique({ where: { id } });
          return meal;
        }
      }

      // 2. Fetch meal and related dish recipes
      const meal = await tx.mealPlan.findUnique({
        where: { id },
        include: {
          mealDishes: {
            include: {
              dish: {
                include: {
                  recipes: {
                    where: { isActive: true },
                    include: { ingredient: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!meal) throw new Error('Bữa ăn không tồn tại');
      if (meal.status !== 'READY') {
        throw new Error(`Chỉ có thể xuất kho cho bữa ăn ở trạng thái READY (hiện tại: ${meal.status})`);
      }

      // 3. Build dish requirements
      const requirements: DishRequirement[] = [];
      const requiredIngredientIds = new Set<string>();

      for (const md of meal.mealDishes) {
        for (const recipe of md.dish.recipes) {
          const requiredQty = calculateRequiredQty(
            recipe.qtyPerServing,
            meal.servingsCount,
            recipe.wastePercent,
            recipe.conversionFactor
          );

          requirements.push({
            mealDishId: md.id,
            dishId: md.dishId,
            dishName: md.dish.name,
            ingredientId: recipe.ingredientId,
            ingredientName: recipe.ingredient.name,
            requiredQty,
            baseUnit: recipe.ingredient.baseUnit,
          });

          requiredIngredientIds.add(recipe.ingredientId);
        }
      }

      // 4. Fetch candidate lots
      const candidateLots = await tx.lot.findMany({
        where: {
          schoolId: meal.schoolId,
          ingredientId: { in: Array.from(requiredIngredientIds) },
          currentStock: { gt: 0 },
        },
      });

      // 5. Run FEFO allocation plan
      const plan = planFEFOAllocations(requirements, candidateLots as LotCandidate[], meal.mealDate);

      if (!plan.isSufficient) {
        const shortageDetails = plan.missingIngredients
          .map((m) => `${m.ingredientName}: Cần ${m.required.toFixed(4)} ${m.baseUnit}, chỉ có ${m.available.toFixed(4)} ${m.baseUnit} (thiếu ${m.shortage.toFixed(4)})`)
          .join('; ');
        throw new Error(`Không đủ tồn kho hợp lệ theo quy tắc FEFO để xuất bữa: ${shortageDetails}`);
      }

      // 6. Deduct lot stocks
      for (const deduction of plan.lotDeductions) {
        await tx.lot.update({
          where: { id: deduction.lotId },
          data: { currentStock: deduction.newStock },
        });
      }

      // 7. Record inventory transactions and meal allocations
      for (let i = 0; i < plan.allocations.length; i++) {
        const alloc = plan.allocations[i];
        const txKey = idempotencyKey ? `${idempotencyKey}_${alloc.mealDishId}_${alloc.lotId}_${i}` : undefined;

        await tx.inventoryTransaction.create({
          data: {
            schoolId: meal.schoolId,
            lotId: alloc.lotId,
            ingredientId: alloc.ingredientId,
            txType: 'OUT',
            quantity: alloc.allocatedQty,
            referenceType: 'MEAL_OUT',
            referenceId: meal.id,
            idempotencyKey: txKey,
            notes: `Xuất kho phục vụ bữa ăn ${meal.mealDate} (${meal.mealType})`,
            actorId: actor?.id || null,
          },
        });

        await tx.mealAllocation.create({
          data: {
            mealPlanId: meal.id,
            mealDishId: alloc.mealDishId,
            ingredientId: alloc.ingredientId,
            lotId: alloc.lotId,
            allocatedQty: alloc.allocatedQty,
            baseUnit: alloc.baseUnit,
          },
        });
      }

      // 8. Update meal status to ISSUED
      return tx.mealPlan.update({
        where: { id: meal.id },
        data: {
          status: 'ISSUED',
          updatedById: actor?.id || null,
        },
      });
    });
  }


  static async completeMeal(
    id: string,
    data: { photoUrl: string; photoStorageKey?: string | null },
    actor?: UserContext | null
  ) {
    const meal = await prisma.mealPlan.findUnique({ where: { id } });
    if (!meal) throw new Error('Bữa ăn không tồn tại');
    if (meal.status !== 'ISSUED' && meal.status !== 'COMPLETED') {
      throw new Error(`Chỉ có thể hoàn thành bữa sau khi đã xuất kho ISSUED (hiện tại: ${meal.status})`);
    }

    return prisma.mealPlan.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        photoUrl: data.photoUrl,
        photoStorageKey: data.photoStorageKey || null,
        updatedById: actor?.id || null,
      },
    });
  }

  static async revokeMeal(id: string, reason: string, actor?: UserContext | null) {
    const meal = await prisma.mealPlan.findUnique({
      where: { id },
    });

    if (!meal) throw new Error('Bữa ăn không tồn tại');
    if (meal.status !== 'PUBLISHED') throw new Error('Chỉ có thể thu hồi bữa ăn đang ở trạng thái PUBLISHED');

    return prisma.$transaction(async (tx) => {
      await tx.traceSnapshot.updateMany({
        where: { mealPlanId: id, isRevoked: false },
        data: {
          isRevoked: true,
          revokedReason: reason.trim(),
        },
      });

      return tx.mealPlan.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          updatedById: actor?.id || null,
        },
      });
    });
  }


  static async publishMeal(id: string, actor?: UserContext | null) {
    const meal = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        school: true,
        mealDishes: {
          orderBy: { sortOrder: 'asc' },
          include: {
            dish: { include: { category: true } },
            allocations: {
              include: {
                ingredient: true,
                lot: {
                  include: {
                    supplier: {
                      include: {
                        documents: {
                          where: { verificationStatus: 'APPROVED', isPublic: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        traceSnapshots: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!meal) throw new Error('Bữa ăn không tồn tại');
    if (meal.status !== 'COMPLETED' && meal.status !== 'PUBLISHED') {
      throw new Error(`Chỉ có thể công bố bữa ăn đã COMPLETED (hiện tại: ${meal.status})`);
    }

    const latestSnapshot = meal.traceSnapshots[0];
    const newVersion = latestSnapshot ? latestSnapshot.version + 1 : 1;
    const token = latestSnapshot?.publicToken || generatePublicToken();

    const snapshotObj: PublicMealSnapshot = {
      mealId: meal.id,
      school: {
        id: meal.school.id,
        code: meal.school.code,
        name: meal.school.name,
        slug: meal.school.slug,
        address: meal.school.address || undefined,
      },
      mealDate: meal.mealDate,
      mealType: meal.mealType,
      mealTypeName: getMealTypeName(meal.mealType),
      servingsCount: meal.servingsCount,
      photoUrl: meal.photoUrl,
      version: newVersion,
      publishedAt: new Date().toISOString(),
      dishes: meal.mealDishes.map((md) => {
        const ingMap = new Map<string, {
          ingredientId: string;
          ingredientName: string;
          baseUnit: string;
          totalAllocated: Decimal;
          lots: Map<string, { lotCode: string; mfgDate: string; expiryDate: string; supplier: any }>;
        }>();

        for (const alloc of md.allocations) {
          const ingId = alloc.ingredientId;
          const existing = ingMap.get(ingId) || {
            ingredientId: ingId,
            ingredientName: alloc.ingredient.name,
            baseUnit: alloc.baseUnit,
            totalAllocated: new Decimal(0),
            lots: new Map(),
          };

          existing.totalAllocated = existing.totalAllocated.plus(new Decimal(alloc.allocatedQty));
          if (!existing.lots.has(alloc.lot.id)) {
            existing.lots.set(alloc.lot.id, {
              lotCode: alloc.lot.lotCode,
              mfgDate: alloc.lot.mfgDate.toISOString().split('T')[0],
              expiryDate: alloc.lot.expiryDate.toISOString().split('T')[0],
              supplier: {
                id: alloc.lot.supplier.id,
                name: alloc.lot.supplier.name,
                code: alloc.lot.supplier.code,
                address: alloc.lot.supplier.address || undefined,
                documents: alloc.lot.supplier.documents.map((doc) => ({
                  id: doc.id,
                  docType: doc.docType,
                  docNumber: doc.docNumber,
                  issueDate: doc.issueDate.toISOString().split('T')[0],
                  expiryDate: doc.expiryDate.toISOString().split('T')[0],
                  fileName: doc.fileName,
                  fileUrl: getFileUrl(doc.storageKey),
                })),
              },
            });
          }
          ingMap.set(ingId, existing);
        }

        return {
          dishId: md.dishId,
          dishName: md.dish.name,
          categoryName: md.dish.category?.name,
          ingredients: Array.from(ingMap.values()).map((ing) => ({
            ingredientId: ing.ingredientId,
            ingredientName: ing.ingredientName,
            baseUnit: ing.baseUnit,
            allocatedQty: ing.totalAllocated.toFixed(4),
            lots: Array.from(ing.lots.values()),
          })),
        };
      }),
    };

    return prisma.$transaction(async (tx) => {
      const snapshot = await tx.traceSnapshot.create({
        data: {
          mealPlanId: meal.id,
          publicToken: token,
          version: newVersion,
          snapshotData: JSON.stringify(snapshotObj),
          publishedById: actor?.id || null,
        },
      });

      const updatedMeal = await tx.mealPlan.update({
        where: { id: meal.id },
        data: {
          status: 'PUBLISHED',
          version: newVersion,
          publishedAt: new Date(),
          updatedById: actor?.id || null,
        },
      });

      return { meal: updatedMeal, snapshot, publicToken: token };
    });
  }


}
