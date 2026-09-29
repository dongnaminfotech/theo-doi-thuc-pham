import crypto from 'crypto';
import QRCode from 'qrcode';

export interface PublicSupplierDocSnapshot {
  id: string;
  docType: string;
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  fileName?: string;
  fileUrl: string;
  issuedBy?: string;
  status?: string;
}

export interface PublicSupplierSnapshot {
  id?: string;
  name: string;
  code?: string;
  taxCode?: string;
  address?: string;
  documents: PublicSupplierDocSnapshot[];
}

export interface PublicLotSnapshot {
  lotCode: string;
  lotNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
  supplier: PublicSupplierSnapshot;
}

export interface PublicIngredientSnapshot {
  ingredientId?: string;
  ingredientName: string;
  baseUnit?: string;
  allocatedQty?: string;
  lotNumber?: string;
  supplier?: PublicSupplierSnapshot;
  lots?: PublicLotSnapshot[];
}

export interface PublicDishSnapshot {
  dishId?: string;
  dishName: string;
  categoryName?: string;
  ingredients: PublicIngredientSnapshot[];
}

export interface PublicMealSnapshot {
  mealId?: string;
  mealPlanId?: string;
  school: {
    id?: string;
    code: string;
    name: string;
    slug: string;
    address?: string;
    phone?: string;
  };
  mealDate: string;
  mealType: string;
  mealTypeName: string;
  servingsCount?: number;
  portions?: number;
  photoUrl?: string | null;
  dishes: PublicDishSnapshot[];
  version: number;
  publishedAt: string;
}

/**
 * Generates a URL-safe 24-character random token for public QR / link access
 */
export function generatePublicToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = crypto.randomBytes(24);
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}

export function getMealTypeName(mealType: string): string {
  switch (mealType) {
    case 'BREAKFAST':
      return 'Bữa Sáng';
    case 'LUNCH':
      return 'Bữa Trưa';
    case 'AFTERNOON_SNACK':
      return 'Bữa Xế';
    case 'DINNER':
      return 'Bữa Tối';
    default:
      return mealType;
  }
}

/**
 * Deterministically sorts object keys deeply to create canonical JSON string for hashing
 */
function stringifyCanonical(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stringifyCanonical).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stringifyCanonical(obj[k])).join(',') + '}';
}

/**
 * Computes deterministic SHA-256 hash of a snapshot object
 */
export function computeSnapshotHash(snapshot: any): string {
  const canonicalString = stringifyCanonical(snapshot);
  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Builds public meal snapshot from database mealPlan entity
 */
export function buildPublicMealSnapshot(mealPlan: any, version: number = 1): PublicMealSnapshot {
  const mealDateStr =
    typeof mealPlan.mealDate === 'string'
      ? mealPlan.mealDate.slice(0, 10)
      : mealPlan.mealDate.toISOString().slice(0, 10);

  const dishes: PublicDishSnapshot[] = (mealPlan.dishes || []).map((md: any) => {
    const dish = md.dish || {};
    const category = dish.category || {};

    const ingredients: PublicIngredientSnapshot[] = (md.allocations || []).map((alloc: any) => {
      const lot = alloc.lot || {};
      const ing = lot.ingredient || {};
      const supplier = lot.supplier || {};
      const docs = (supplier.documents || []).map((doc: any) => ({
        id: doc.id,
        docType: doc.docType,
        docNumber: doc.docNumber,
        issueDate: doc.issuedDate ? new Date(doc.issuedDate).toISOString().slice(0, 10) : '',
        expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().slice(0, 10) : '',
        fileName: doc.fileName || '',
        fileUrl: doc.fileUrl,
        issuedBy: doc.issuedBy,
        status: doc.status,
      }));

      return {
        ingredientId: ing.id,
        ingredientName: ing.name || 'Nguyên liệu',
        baseUnit: ing.baseUnit || alloc.unit || 'kg',
        allocatedQty: alloc.qtyAllocated?.toString() || alloc.allocatedQty?.toString() || '0',
        lotNumber: lot.lotNumber || lot.lotCode || '',
        supplier: {
          id: supplier.id,
          name: supplier.name || 'Nhà cung cấp',
          code: supplier.code,
          taxCode: supplier.taxCode,
          address: supplier.address,
          documents: docs,
        },
      };
    });

    return {
      dishId: dish.id,
      dishName: dish.name || 'Món ăn',
      categoryName: category.name || '',
      ingredients,
    };
  });

  return {
    mealId: mealPlan.id,
    mealPlanId: mealPlan.id,
    school: {
      id: mealPlan.school?.id,
      code: mealPlan.school?.code || '',
      name: mealPlan.school?.name || '',
      slug: mealPlan.school?.slug || '',
      address: mealPlan.school?.address,
      phone: mealPlan.school?.phone,
    },
    mealDate: mealDateStr,
    mealType: mealPlan.mealType,
    mealTypeName: getMealTypeName(mealPlan.mealType),
    portions: mealPlan.actualPortions || mealPlan.plannedPortions || mealPlan.servingsCount || 0,
    servingsCount: mealPlan.actualPortions || mealPlan.plannedPortions || mealPlan.servingsCount || 0,
    photoUrl: mealPlan.photoUrl || null,
    dishes,
    version,
    publishedAt: new Date().toISOString(),
  };
}

/**
 * Generates QR code as Base64 Data URL
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 300,
    margin: 2,
    color: {
      dark: '#1b4332',
      light: '#ffffff',
    },
  });
}

