import { prisma } from '@/lib/prisma';
import { SchoolStatus } from '@prisma/client';

export interface CreateSchoolDTO {
  code: string;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  status?: SchoolStatus;
}

export interface UpdateSchoolDTO {
  name?: string;
  slug?: string;
  address?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  status?: SchoolStatus;
}

export class SchoolService {
  static async getAll(schoolIds?: string[]) {
    return prisma.school.findMany({
      where: schoolIds ? { id: { in: schoolIds } } : undefined,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { mealPlans: true, lots: true },
        },
      },
    });
  }

  static async getById(id: string) {
    return prisma.school.findUnique({
      where: { id },
      include: {
        slugHistory: true,
        _count: {
          select: { mealPlans: true, lots: true, receipts: true },
        },
      },
    });
  }

  static async getBySlug(slug: string) {
    const school = await prisma.school.findUnique({
      where: { slug },
    });
    if (school) return school;

    // Check slug history
    const history = await prisma.schoolSlugHistory.findUnique({
      where: { oldSlug: slug },
      include: { school: true },
    });
    return history ? history.school : null;
  }

  static async create(data: CreateSchoolDTO) {
    return prisma.school.create({
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        slug: data.slug.toLowerCase().trim(),
        address: data.address?.trim(),
        phone: data.phone?.trim(),
        contactPerson: data.contactPerson?.trim(),
        status: data.status || 'ACTIVE',
      },
    });
  }

  static async update(id: string, data: UpdateSchoolDTO) {
    const current = await prisma.school.findUnique({ where: { id } });
    if (!current) throw new Error('Trường không tồn tại');

    // If slug changes, record old slug in history
    if (data.slug && data.slug.toLowerCase().trim() !== current.slug) {
      const newSlug = data.slug.toLowerCase().trim();
      return prisma.$transaction(async (tx) => {
        await tx.schoolSlugHistory.create({
          data: {
            schoolId: id,
            oldSlug: current.slug,
          },
        });
        return tx.school.update({
          where: { id },
          data: {
            name: data.name ? data.name.trim() : undefined,
            slug: newSlug,
            address: data.address !== undefined ? data.address?.trim() : undefined,
            phone: data.phone !== undefined ? data.phone?.trim() : undefined,
            contactPerson: data.contactPerson !== undefined ? data.contactPerson?.trim() : undefined,
            status: data.status,
          },
        });
      });
    }

    return prisma.school.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : undefined,
        address: data.address !== undefined ? data.address?.trim() : undefined,
        phone: data.phone !== undefined ? data.phone?.trim() : undefined,
        contactPerson: data.contactPerson !== undefined ? data.contactPerson?.trim() : undefined,
        status: data.status,
      },
    });
  }
}
