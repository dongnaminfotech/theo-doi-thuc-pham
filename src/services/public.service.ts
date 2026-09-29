import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import { PublicMealSnapshot } from '@/lib/snapshot';

export class PublicService {
  /**
   * Gets published meals for a school on a specific date
   */
  static async getPublishedMealsForDate(
    schoolSlug: string,
    dateStr: string
  ): Promise<{
    school: {
      id: string;
      name: string;
      code: string;
      slug: string;
      address: string | null;
      phone: string | null;
    };
    date: string;
    meals: Array<{
      id: string;
      mealType: string;
      servingsCount: number;
      photoUrl: string | null;
      publicToken: string | null;
      snapshot: PublicMealSnapshot | null;
    }>;
  } | null> {
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
    });

    if (!school || school.status !== 'ACTIVE') {
      // Check slug history
      const history = await prisma.schoolSlugHistory.findUnique({
        where: { oldSlug: schoolSlug },
        include: { school: true },
      });
      if (!history || history.school.status !== 'ACTIVE') {
        return null;
      }
      return this.getPublishedMealsForDate(history.school.slug, dateStr);
    }

    const meals = await prisma.mealPlan.findMany({
      where: {
        schoolId: school.id,
        mealDate: dateStr,
        status: 'PUBLISHED',
      },
      orderBy: [{ mealType: 'asc' }, { slotCode: 'asc' }],
      include: {
        traceSnapshots: {
          where: { isRevoked: false },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    return {
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        slug: school.slug,
        address: school.address,
        phone: school.phone,
      },
      date: dateStr,
      meals: meals.map((m) => {
        const snap = m.traceSnapshots[0];
        let snapshotData: PublicMealSnapshot | null = null;
        if (snap) {
          try {
            snapshotData = JSON.parse(snap.snapshotData);
          } catch {}
        }

        return {
          id: m.id,
          mealType: m.mealType,
          servingsCount: m.servingsCount,
          photoUrl: m.photoUrl,
          publicToken: snap?.publicToken || null,
          snapshot: snapshotData,
        };
      }),
    };
  }

  /**
   * Gets trace snapshot by public token
   */
  static async getTraceSnapshot(token: string, baseUrl = 'http://localhost:3000') {
    const snapshot = await prisma.traceSnapshot.findUnique({
      where: { publicToken: token },
      include: {
        mealPlan: {
          include: { school: true },
        },
      },
    });

    if (!snapshot || snapshot.isRevoked) {
      return null;
    }

    let parsedData: PublicMealSnapshot;
    try {
      parsedData = JSON.parse(snapshot.snapshotData);
    } catch {
      return null;
    }

    const traceUrl = `${baseUrl}/truy-xuat/${token}`;
    const qrDataUrl = await QRCode.toDataURL(traceUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#166534', // Brand dark green
        light: '#ffffff',
      },
    });

    return {
      token,
      version: snapshot.version,
      publishedAt: snapshot.publishedAt,
      qrDataUrl,
      traceUrl,
      data: parsedData,
    };
  }
}
