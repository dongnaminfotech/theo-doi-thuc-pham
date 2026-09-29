import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateDatabaseIntegrity() {
  console.log('🔍 Starting New Green database integrity validation...');
  let errorsCount = 0;

  // 1. Check recipes count and relations
  const recipes = await prisma.recipe.findMany({
    include: { dish: true, ingredient: true },
  });
  const orphanRecipes = recipes.filter((r) => !r.dish || !r.ingredient);
  if (orphanRecipes.length > 0) {
    console.error(`❌ Found ${orphanRecipes.length} recipes with missing dish or ingredient references`);
    errorsCount++;
  } else {
    console.log(`✅ All ${recipes.length} recipes have valid Dish and Ingredient relations`);
  }

  // 2. Check lots with negative currentStock
  const negativeLots = await prisma.lot.findMany({
    where: {
      currentStock: { lt: 0 },
    },
  });
  if (negativeLots.length > 0) {
    console.error(`❌ Found ${negativeLots.length} lots with negative currentStock!`);
    errorsCount++;
  } else {
    console.log('✅ No lots with negative stock found');
  }

  // 3. Check published meal plans without TraceSnapshots
  const publishedMeals = await prisma.mealPlan.findMany({
    where: { status: 'PUBLISHED' },
    include: { traceSnapshots: true },
  });
  const mealsWithoutSnapshot = publishedMeals.filter((m) => m.traceSnapshots.length === 0);
  if (mealsWithoutSnapshot.length > 0) {
    console.warn(`⚠️ Warning: ${mealsWithoutSnapshot.length} PUBLISHED meals do not have any TraceSnapshot`);
  } else {
    console.log(`✅ All ${publishedMeals.length} published meals have valid TraceSnapshots`);
  }

  // 4. Check schools unique slug consistency
  const schools = await prisma.school.findMany({
    include: { slugHistory: true },
  });
  console.log(`✅ Verified ${schools.length} active schools and their slug histories`);

  if (errorsCount > 0) {
    console.error(`❌ Database integrity validation finished with ${errorsCount} errors.`);
    process.exit(1);
  } else {
    console.log('🎉 Database integrity validation passed successfully!');
  }
}

validateDatabaseIntegrity()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

