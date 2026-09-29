import { prisma } from '@/lib/prisma';
import { DocStatus, SupplierStatus } from '@prisma/client';

export class SupplierService {
  static async getSuppliers() {
    return prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        documents: true,
        _count: { select: { receipts: true, lots: true } },
      },
    });
  }

  static async getSupplierById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { issueDate: 'desc' },
        },
      },
    });
  }

  static async createSupplier(data: {
    code: string;
    name: string;
    taxCode?: string | null;
    address?: string | null;
    phone?: string | null;
    contactPerson?: string | null;
    status?: SupplierStatus;
  }) {
    return prisma.supplier.create({
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        taxCode: data.taxCode?.trim(),
        address: data.address?.trim(),
        phone: data.phone?.trim(),
        contactPerson: data.contactPerson?.trim(),
        status: data.status || 'ACTIVE',
      },
    });
  }

  static async updateSupplier(
    id: string,
    data: {
      name?: string;
      taxCode?: string | null;
      address?: string | null;
      phone?: string | null;
      contactPerson?: string | null;
      status?: SupplierStatus;
    }
  ) {
    return prisma.supplier.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        taxCode: data.taxCode !== undefined ? data.taxCode?.trim() : undefined,
        address: data.address !== undefined ? data.address?.trim() : undefined,
        phone: data.phone !== undefined ? data.phone?.trim() : undefined,
        contactPerson: data.contactPerson !== undefined ? data.contactPerson?.trim() : undefined,
        status: data.status,
      },
    });
  }

  // --- Supplier Documents ---
  static async addDocument(data: {
    supplierId: string;
    docType: string;
    docNumber: string;
    issueDate: string;
    expiryDate: string;
    storageKey: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    verificationStatus?: DocStatus;
    isPublic?: boolean;
  }) {
    return prisma.supplierDocument.create({
      data: {
        supplierId: data.supplierId,
        docType: data.docType.trim(),
        docNumber: data.docNumber.trim(),
        issueDate: new Date(data.issueDate),
        expiryDate: new Date(data.expiryDate),
        storageKey: data.storageKey,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        verificationStatus: data.verificationStatus || 'PENDING',
        isPublic: data.isPublic ?? false,
      },
    });
  }

  static async updateDocumentStatus(
    id: string,
    data: {
      verificationStatus?: DocStatus;
      isPublic?: boolean;
    }
  ) {
    return prisma.supplierDocument.update({
      where: { id },
      data: {
        verificationStatus: data.verificationStatus,
        isPublic: data.isPublic,
      },
    });
  }

  static async deleteDocument(id: string) {
    return prisma.supplierDocument.delete({
      where: { id },
    });
  }
}
