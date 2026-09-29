import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class CatalogService {
  // --- Dish Categories ---
  static async getCategories() {
    return prisma.dishCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { dishes: true } },
      },
    });
  }

  static async createCategory(data: { code: string; name: string; sortOrder?: number; isActive?: boolean }) {
    return prisma.dishCategory.create({
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async updateCategory(id: string, data: { name?: string; sortOrder?: number; isActive?: boolean }) {
    return prisma.dishCategory.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
  }

  // --- Ingredients ---
  static async getIngredients() {
    return prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { recipes: true, lots: true } },
      },
    });
  }

  static async createIngredient(data: { code: string; name: string; baseUnit: string; isActive?: boolean }) {
    return prisma.ingredient.create({
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        baseUnit: data.baseUnit.trim(),
        isActive: data.isActive ?? true,
      },
    });
  }

  static async updateIngredient(id: string, data: { name?: string; baseUnit?: string; isActive?: boolean }) {
    return prisma.ingredient.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        baseUnit: data.baseUnit?.trim(),
        isActive: data.isActive,
      },
    });
  }

  // --- Dishes ---
  static async getDishes(categoryId?: string) {
    return prisma.dish.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        category: true,
        recipes: {
          include: { ingredient: true },
        },
      },
    });
  }

  static async getDishById(id: string) {
    return prisma.dish.findUnique({
      where: { id },
      include: {
        category: true,
        recipes: {
          include: { ingredient: true },
        },
      },
    });
  }

  static async createDish(data: { categoryId: string; code: string; name: string; description?: string | null; isActive?: boolean }) {
    return prisma.dish.create({
      data: {
        categoryId: data.categoryId,
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        description: data.description?.trim(),
        isActive: data.isActive ?? true,
      },
      include: { category: true },
    });
  }

  static async updateDish(id: string, data: { categoryId?: string; name?: string; description?: string | null; isActive?: boolean }) {
    return prisma.dish.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        name: data.name?.trim(),
        description: data.description !== undefined ? data.description?.trim() : undefined,
        isActive: data.isActive,
      },
      include: { category: true },
    });
  }

  // --- Recipes ---
  static async upsertRecipe(data: {
    dishId: string;
    ingredientId: string;
    qtyPerServing: number;
    wastePercent?: number;
    unit: string;
    conversionFactor?: number;
    isActive?: boolean;
  }) {
    return prisma.recipe.upsert({
      where: {
        dishId_ingredientId: {
          dishId: data.dishId,
          ingredientId: data.ingredientId,
        },
      },
      create: {
        dishId: data.dishId,
        ingredientId: data.ingredientId,
        qtyPerServing: new Decimal(data.qtyPerServing),
        wastePercent: new Decimal(data.wastePercent ?? 0),
        unit: data.unit.trim(),
        conversionFactor: new Decimal(data.conversionFactor ?? 1),
        isActive: data.isActive ?? true,
      },
      update: {
        qtyPerServing: new Decimal(data.qtyPerServing),
        wastePercent: new Decimal(data.wastePercent ?? 0),
        unit: data.unit.trim(),
        conversionFactor: new Decimal(data.conversionFactor ?? 1),
        isActive: data.isActive ?? true,
      },
      include: { ingredient: true },
    });
  }

  static async deleteRecipe(dishId: string, ingredientId: string) {
    return prisma.recipe.delete({
      where: {
        dishId_ingredientId: { dishId, ingredientId },
      },
    });
  }
}
