import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LegacyMealRecord {
  legacyId: string;
  schoolCode: string;
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER';
  portions: number;
  dishCodes: string[];
}

/**
 * Validates whether legacy records can be cleanly imported into PostgreSQL
 * without violating any constraints or missing dependencies.
 */
export async function dryRunMigration(records: LegacyMealRecord[]) {
  console.log(`🚀 Starting Dry Run migration for ${records.length} legacy records...`);
  const report = {
    total: records.length,
    valid: 0,
    invalid: 0,
    errors: [] as string[],
  };

  const schools = await prisma.school.findMany();
  const schoolMap = new Map(schools.map((s) => [s.code, s.id]));

  const dishes = await prisma.dish.findMany();
  const dishMap = new Map(dishes.map((d) => [d.code, d.id]));

  for (const record of records) {
    const schoolId = schoolMap.get(record.schoolCode);
    if (!schoolId) {
      report.invalid++;
      report.errors.push(`Record ${record.legacyId}: Unknown schoolCode '${record.schoolCode}'`);
      continue;
    }

    const missingDishes = record.dishCodes.filter((code) => !dishMap.has(code));
    if (missingDishes.length > 0) {
      report.invalid++;
      report.errors.push(`Record ${record.legacyId}: Missing dish codes [${missingDishes.join(', ')}]`);
      continue;
    }

    report.valid++;
  }

  console.log('--- DRY RUN REPORT ---');
  console.log(`Total: ${report.total}`);
  console.log(`Valid: ${report.valid}`);
  console.log(`Invalid: ${report.invalid}`);
  if (report.errors.length > 0) {
    console.log('Errors:\n' + report.errors.slice(0, 10).join('\n'));
    if (report.errors.length > 10) {
      console.log(`... and ${report.errors.length - 10} more errors.`);
    }
  }

  return report;
}

if (require.main === module) {
  // Sample test run
  const sampleData: LegacyMealRecord[] = [
    {
      legacyId: 'LEGACY-001',
      schoolCode: 'TH-BM',
      date: '2026-09-30',
      mealType: 'LUNCH',
      portions: 300,
      dishCodes: ['DISH-COM-TRANG', 'DISH-THIT-KHO-TRUNG'],
    },
    {
      legacyId: 'LEGACY-002',
      schoolCode: 'UNKNOWN_SCHOOL',
      date: '2026-09-30',
      mealType: 'LUNCH',
      portions: 200,
      dishCodes: ['DISH-COM-TRANG'],
    },
  ];

  dryRunMigration(sampleData)
    .catch((e) => console.error(e))
    .finally(async () => {
      await prisma.$disconnect();
    });
}
