import { prisma } from '@/lib/prisma';
import { MealType } from '@prisma/client';
import { addDays, parseISO, format } from 'date-fns';
import { UserContext } from '@/lib/rbac';

export class TemplateService {
  static async getTemplates(schoolId?: string | null) {
    return prisma.weeklyMenuTemplate.findMany({
      where: schoolId ? { schoolId } : { schoolId: null },
      orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }, { sortOrder: 'asc' }],
      include: {
        dish: {
          include: { category: true },
        },
      },
    });
  }

  static async createTemplateItem(data: {
    schoolId?: string | null;
    dayOfWeek: number;
    mealType: MealType;
    dishId: string;
    sortOrder?: number;
  }) {
    return prisma.weeklyMenuTemplate.create({
      data: {
        schoolId: data.schoolId || null,
        dayOfWeek: data.dayOfWeek,
        mealType: data.mealType,
        dishId: data.dishId,
        sortOrder: data.sortOrder ?? 0,
      },
      include: { dish: true },
    });
  }

  static async deleteTemplateItem(id: string) {
    return prisma.weeklyMenuTemplate.delete({ where: { id } });
  }

  /**
   * Generates draft meals for a week starting on startDate (Monday)
   */
  static async generateWeeklyMeals(
    data: {
      schoolId: string;
      startDate: string; // Monday YYYY-MM-DD
      servingsCount: number;
      overwriteExisting?: boolean;
    },
    actor?: UserContext | null
  ) {
    const monday = parseISO(data.startDate);

    // Fetch school template or fallback to global template
    let templates = await prisma.weeklyMenuTemplate.findMany({
      where: { schoolId: data.schoolId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }, { sortOrder: 'asc' }],
    });

    if (templates.length === 0) {
      templates = await prisma.weeklyMenuTemplate.findMany({
        where: { schoolId: null, isActive: true },
        orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }, { sortOrder: 'asc' }],
      });
    }

    if (templates.length === 0) {
      throw new Error('Chưa có mẫu thực đơn tuần nào được thiết lập.');
    }

    // Group templates by dayOfWeek (1..7) and mealType
    const grouped = new Map<string, Array<{ dishId: string; sortOrder: number }>>();
    for (const t of templates) {
      const key = `${t.dayOfWeek}_${t.mealType}`;
      const list = grouped.get(key) || [];
      list.push({ dishId: t.dishId, sortOrder: t.sortOrder });
      grouped.set(key, list);
    }

    const createdMeals: any[] = [];
    const skippedDates: string[] = [];

    await prisma.$transaction(async (tx) => {
      // Loop Monday (day 1) to Friday (day 5) or Sunday (day 7)
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = addDays(monday, dayOffset);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayOfWeekNum = dayOffset + 1; // 1 = Monday, 7 = Sunday

        const mealTypes: MealType[] = ['BREAKFAST', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];

        for (const mType of mealTypes) {
          const key = `${dayOfWeekNum}_${mType}`;
          const dishes = grouped.get(key);

          if (!dishes || dishes.length === 0) continue;

          // Check existing meal
          const existing = await tx.mealPlan.findUnique({
            where: {
              schoolId_mealDate_mealType_slotCode: {
                schoolId: data.schoolId,
                mealDate: dateStr,
                mealType: mType,
                slotCode: 'DEFAULT',
              },
            },
          });

          if (existing) {
            if (!data.overwriteExisting) {
              skippedDates.push(`${dateStr} (${mType})`);
              continue;
            }
            if (existing.status !== 'DRAFT') {
              skippedDates.push(`${dateStr} (${mType} - Không thể ghi đè vì đã ${existing.status})`);
              continue;
            }
            await tx.mealDish.deleteMany({ where: { mealPlanId: existing.id } });
            await tx.mealPlan.delete({ where: { id: existing.id } });
          }

          const meal = await tx.mealPlan.create({
            data: {
              schoolId: data.schoolId,
              mealDate: dateStr,
              mealType: mType,
              slotCode: 'DEFAULT',
              servingsCount: data.servingsCount,
              status: 'DRAFT',
              createdById: actor?.id || null,
              updatedById: actor?.id || null,
            },
          });

          for (const d of dishes) {
            await tx.mealDish.create({
              data: {
                mealPlanId: meal.id,
                dishId: d.dishId,
                sortOrder: d.sortOrder,
              },
            });
          }

          createdMeals.push(meal);
        }
      }
    });

    return {
      createdCount: createdMeals.length,
      skippedCount: skippedDates.length,
      skippedDetails: skippedDates,
    };
  }
}
