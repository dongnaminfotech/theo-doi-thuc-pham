import { PrismaClient, Role, UserStatus, SchoolStatus, SupplierStatus, DocStatus, MealType, MealStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { generatePublicToken, getMealTypeName, PublicMealSnapshot } from '../src/lib/snapshot';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting New Green database seeding...');

  // 1. Super Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@newgreen.edu.vn' },
    update: {},
    create: {
      email: 'admin@newgreen.edu.vn',
      name: 'Quản trị viên Hệ thống',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'quanly@banmai.edu.vn' },
    update: {},
    create: {
      email: 'quanly@banmai.edu.vn',
      name: 'Nguyễn Văn Quản Lý (Ban Mai)',
      role: Role.SCHOOL_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const kitchenUser = await prisma.user.upsert({
    where: { email: 'bep@banmai.edu.vn' },
    update: {},
    create: {
      email: 'bep@banmai.edu.vn',
      name: 'Trần Thị Bếp Trưởng',
      role: Role.KITCHEN,
      status: UserStatus.ACTIVE,
    },
  });

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'kho@banmai.edu.vn' },
    update: {},
    create: {
      email: 'kho@banmai.edu.vn',
      name: 'Lê Văn Thủ Kho',
      role: Role.WAREHOUSE,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('✅ Users seeded');

  // 2. Schools (5 schools)
  const schoolsData = [
    {
      code: 'TH-BM',
      name: 'Trường Tiểu học Ban Mai',
      slug: 'tieu-hoc-ban-mai',
      address: 'Khu đô thị Văn Quán, Hà Đông, Hà Nội',
      phone: '024 3354 4444',
      contactPerson: 'Cô Mai - Hiệu trưởng',
    },
    {
      code: 'MN-NG',
      name: 'Trường Mầm non New Green Eco',
      slug: 'mam-non-new-green-eco',
      address: 'Số 18 Đường Hoàng Đạo Thúy, Cầu Giấy, Hà Nội',
      phone: '024 3888 9999',
      contactPerson: 'Cô Lan - Phó hiệu trưởng',
    },
    {
      code: 'THCS-TD',
      name: 'Trường THCS Tuệ Đức Xanh',
      slug: 'thcs-tue-duc-xanh',
      address: 'Khu đô thị Thanh Hà, Thanh Oai, Hà Nội',
      phone: '024 3999 1234',
      contactPerson: 'Thầy Hưng - Quản trị',
    },
    {
      code: 'MN-HH',
      name: 'Trường Mầm non Hướng Dương',
      slug: 'mam-non-huong-duong',
      address: 'Số 55 Nguyễn Du, Hai Bà Trưng, Hà Nội',
      phone: '024 3777 5555',
      contactPerson: 'Cô Hương - Bếp trưởng',
    },
    {
      code: 'TH-VS',
      name: 'Trường Tiểu học Thực Nghiệm Sao Mai',
      slug: 'tieu-hoc-sao-mai',
      address: 'Liễu Giai, Ba Đình, Hà Nội',
      phone: '024 3666 8888',
      contactPerson: 'Cô Thu - Quản lý dinh dưỡng',
    },
  ];

  const schools: any[] = [];
  for (const s of schoolsData) {
    const school = await prisma.school.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    schools.push(school);
  }

  // Assign school to school users
  const banMaiSchool = schools[0];
  await prisma.userSchool.upsert({
    where: { userId_schoolId: { userId: schoolAdmin.id, schoolId: banMaiSchool.id } },
    update: {},
    create: { userId: schoolAdmin.id, schoolId: banMaiSchool.id },
  });
  await prisma.userSchool.upsert({
    where: { userId_schoolId: { userId: kitchenUser.id, schoolId: banMaiSchool.id } },
    update: {},
    create: { userId: kitchenUser.id, schoolId: banMaiSchool.id },
  });
  await prisma.userSchool.upsert({
    where: { userId_schoolId: { userId: warehouseUser.id, schoolId: banMaiSchool.id } },
    update: {},
    create: { userId: warehouseUser.id, schoolId: banMaiSchool.id },
  });

  console.log('✅ Schools seeded');

  // 3. 10 Dish Categories
  const categoriesData = [
    { code: 'CAT-COM', name: 'Cơm & Tinh bột', sortOrder: 1 },
    { code: 'CAT-MAN-HEO', name: 'Món mặn - Thịt heo', sortOrder: 2 },
    { code: 'CAT-MAN-BO-GA', name: 'Món mặn - Thịt bò & Gà', sortOrder: 3 },
    { code: 'CAT-MAN-THUY-SAN', name: 'Món mặn - Thủy hải sản', sortOrder: 4 },
    { code: 'CAT-TRUNG-DAU', name: 'Món phụ - Trứng & Đậu phụ', sortOrder: 5 },
    { code: 'CAT-CANH-SUP', name: 'Canh & Súp dinh dưỡng', sortOrder: 6 },
    { code: 'CAT-RAU-CU', name: 'Rau củ luộc & Xào', sortOrder: 7 },
    { code: 'CAT-TRANG-MIENG', name: 'Trái cây & Tráng miệng', sortOrder: 8 },
    { code: 'CAT-BUA-PHU', name: 'Bữa xế - Sữa & Sữa chua', sortOrder: 9 },
    { code: 'CAT-BANH-CHE', name: 'Bữa xế - Bánh tươi & Chè', sortOrder: 10 },
  ];

  const categories = new Map<string, any>();
  for (const c of categoriesData) {
    const cat = await prisma.dishCategory.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
    categories.set(c.code, cat);
  }

  console.log('✅ 10 Dish Categories seeded');

  // 4. Ingredients
  const ingredientsData = [
    { code: 'ING-GAO', name: 'Gạo Tám Điện Biên', baseUnit: 'kg' },
    { code: 'ING-THIT-HEO-XAY', name: 'Thịt nạc vai heo xay', baseUnit: 'kg' },
    { code: 'ING-THIT-BO', name: 'Thịt bò thăn loại 1', baseUnit: 'kg' },
    { code: 'ING-THIT-GA', name: 'Đùi gà rút xương', baseUnit: 'kg' },
    { code: 'ING-TOM-SU', name: 'Tôm sú tươi lột vỏ', baseUnit: 'kg' },
    { code: 'ING-TRUNG-GA', name: 'Trứng gà tươi Ba Huân', baseUnit: 'quả' },
    { code: 'ING-DAU-HU', name: 'Đậu hũ non sạch', baseUnit: 'bìa' },
    { code: 'ING-CA-CHUA', name: 'Cà chua VietGAP', baseUnit: 'kg' },
    { code: 'ING-BI-DO', name: 'Bí đỏ hồ lô', baseUnit: 'kg' },
    { code: 'ING-CA-ROT', name: 'Cà rốt Đà Lạt', baseUnit: 'kg' },
    { code: 'ING-RAU-NGOT', name: 'Rau ngót VietGAP', baseUnit: 'kg' },
    { code: 'ING-BAP-CAI', name: 'Bắp cải trắng sạch', baseUnit: 'kg' },
    { code: 'ING-CHUOI', name: 'Chuối tiêu chín tự nhiên', baseUnit: 'quả' },
    { code: 'ING-SUA-CHUA', name: 'Sữa chua men sống Probi', baseUnit: 'hộp' },
    { code: 'ING-DAU-AN', name: 'Dầu thực vật Simply', baseUnit: 'lít' },
    { code: 'ING-GIA-VI', name: 'Gia vị hạt nêm I-ốt', baseUnit: 'kg' },
  ];

  const ingredients = new Map<string, any>();
  for (const ing of ingredientsData) {
    const item = await prisma.ingredient.upsert({
      where: { code: ing.code },
      update: {},
      create: ing,
    });
    ingredients.set(ing.code, item);
  }
  console.log('✅ Ingredients seeded');

  // 5. Dishes & Recipes
  const dishesData = [
    {
      code: 'DISH-COM-TRANG',
      name: 'Cơm trắng gạo tám thơm',
      categoryCode: 'CAT-COM',
      recipes: [
        { ingredientCode: 'ING-GAO', qty: 0.08, unit: 'kg' },
      ],
    },
    {
      code: 'DISH-THIT-KHO-TRUNG',
      name: 'Thịt heo nạc kho trứng cút/gà',
      categoryCode: 'CAT-MAN-HEO',
      recipes: [
        { ingredientCode: 'ING-THIT-HEO-XAY', qty: 0.05, unit: 'kg' },
        { ingredientCode: 'ING-TRUNG-GA', qty: 1, unit: 'quả' },
        { ingredientCode: 'ING-GIA-VI', qty: 0.005, unit: 'kg' },
      ],
    },
    {
      code: 'DISH-THIT-HEO-SOT-CA',
      name: 'Thịt heo viên sốt cà chua',
      categoryCode: 'CAT-MAN-HEO',
      recipes: [
        { ingredientCode: 'ING-THIT-HEO-XAY', qty: 0.04, unit: 'kg' },
        { ingredientCode: 'ING-CA-CHUA', qty: 0.02, unit: 'kg' },
        { ingredientCode: 'ING-DAU-AN', qty: 0.005, unit: 'lít' },
      ],
    },
    {
      code: 'DISH-BO-XAO-CA-ROT',
      name: 'Thịt bò thăn xào cà rốt',
      categoryCode: 'CAT-MAN-BO-GA',
      recipes: [
        { ingredientCode: 'ING-THIT-BO', qty: 0.04, unit: 'kg' },
        { ingredientCode: 'ING-CA-ROT', qty: 0.03, unit: 'kg' },
        { ingredientCode: 'ING-DAU-AN', qty: 0.005, unit: 'lít' },
      ],
    },
    {
      code: 'DISH-CANH-THIT-RAU-NGOT',
      name: 'Canh thịt băm rau ngót',
      categoryCode: 'CAT-CANH-SUP',
      recipes: [
        { ingredientCode: 'ING-THIT-HEO-XAY', qty: 0.02, unit: 'kg' },
        { ingredientCode: 'ING-RAU-NGOT', qty: 0.04, unit: 'kg' },
      ],
    },
    {
      code: 'DISH-CANH-BI-DO-THIT',
      name: 'Canh bí đỏ nấu thịt bằm',
      categoryCode: 'CAT-CANH-SUP',
      recipes: [
        { ingredientCode: 'ING-THIT-HEO-XAY', qty: 0.02, unit: 'kg' },
        { ingredientCode: 'ING-BI-DO', qty: 0.05, unit: 'kg' },
      ],
    },
    {
      code: 'DISH-BAP-CAI-LUOC',
      name: 'Bắp cải luộc chấm trứng',
      categoryCode: 'CAT-RAU-CU',
      recipes: [
        { ingredientCode: 'ING-BAP-CAI', qty: 0.06, unit: 'kg' },
      ],
    },
    {
      code: 'DISH-CHUOI-TIANG-MIENG',
      name: 'Chuối tiêu tráng miệng',
      categoryCode: 'CAT-TRANG-MIENG',
      recipes: [
        { ingredientCode: 'ING-CHUOI', qty: 1, unit: 'quả' },
      ],
    },
    {
      code: 'DISH-SUA-CHUA-PHU',
      name: 'Sữa chua uống Probi bữa xế',
      categoryCode: 'CAT-BUA-PHU',
      recipes: [
        { ingredientCode: 'ING-SUA-CHUA', qty: 1, unit: 'hộp' },
      ],
    },
  ];

  const dishes = new Map<string, any>();
  for (const d of dishesData) {
    const cat = categories.get(d.categoryCode);
    const dish = await prisma.dish.upsert({
      where: { code: d.code },
      update: {},
      create: {
        code: d.code,
        name: d.name,
        categoryId: cat.id,
      },
    });
    dishes.set(d.code, dish);

    for (const r of d.recipes) {
      const ing = ingredients.get(r.ingredientCode);
      await prisma.recipe.upsert({
        where: { dishId_ingredientId: { dishId: dish.id, ingredientId: ing.id } },
        update: {},
        create: {
          dishId: dish.id,
          ingredientId: ing.id,
          qtyPerServing: new Decimal(r.qty),
          unit: r.unit,
          conversionFactor: new Decimal(1),
        },
      });
    }
  }
  console.log('✅ Dishes and Recipes seeded');
  // 6. Suppliers & Verified Documents
  const suppliersData = [
    {
      code: 'NCC-DAP-HOA',
      name: 'Công ty CP Thực phẩm Sạch Đất Việt',
      taxCode: '0108998877',
      address: 'Xã Tiền Lệ, Huyện Hoài Đức, TP Hà Nội',
      phone: '024 3888 1234',
      docs: [
        {
          docType: 'ChungNhan_VietGAP',
          docNumber: 'VG-HN-2025-089',
          issueDate: new Date('2025-01-10'),
          expiryDate: new Date('2027-01-10'),
          fileName: 'vietgap-datviet.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          storageKey: 'docs/vietgap-datviet.pdf',
        },
        {
          docType: 'ChungNhan_CoSoDuDieuKien_ATTP',
          docNumber: 'ATTP-HN-2024-555',
          issueDate: new Date('2024-05-15'),
          expiryDate: new Date('2027-05-15'),
          fileName: 'attp-datviet.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          storageKey: 'docs/attp-datviet.pdf',
        },
      ],
    },
    {
      code: 'NCC-CP-MEAT',
      name: 'Công ty Cổ phần Chăn nuôi C.P. Việt Nam',
      taxCode: '3600224523',
      address: 'KCN Biên Hòa II, Đồng Nai (Chi nhánh Hà Nội)',
      phone: '024 3999 8888',
      docs: [
        {
          docType: 'KiemDich_ThuY',
          docNumber: 'KD-TY-2026-00129',
          issueDate: new Date('2026-01-05'),
          expiryDate: new Date('2026-12-31'),
          fileName: 'kiemdich-cp.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          storageKey: 'docs/kiemdich-cp.pdf',
        },
        {
          docType: 'ISO_HACCP',
          docNumber: 'HACCP-22000-2024',
          issueDate: new Date('2024-06-01'),
          expiryDate: new Date('2027-06-01'),
          fileName: 'haccp-cp.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          storageKey: 'docs/haccp-cp.pdf',
        },
      ],
    },
    {
      code: 'NCC-BA-HUAN',
      name: 'Công ty TNHH Ba Huân Miền Bắc',
      taxCode: '0106655443',
      address: 'Cụm CN Phúc Thọ, Huyện Phúc Thọ, Hà Nội',
      phone: '024 3765 4321',
      docs: [
        {
          docType: 'ChungNhan_CoSoDuDieuKien_ATTP',
          docNumber: 'ATTP-BH-2025-01',
          issueDate: new Date('2025-03-01'),
          expiryDate: new Date('2028-03-01'),
          fileName: 'attp-bahuan.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          storageKey: 'docs/attp-bahuan.pdf',
        },
      ],
    },
  ];

  const suppliers = new Map<string, any>();
  for (const s of suppliersData) {
    const supplier = await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: {
        code: s.code,
        name: s.name,
        taxCode: s.taxCode,
        address: s.address,
        phone: s.phone,
        status: SupplierStatus.ACTIVE,
      },
    });
    suppliers.set(s.code, supplier);

    for (const d of s.docs) {
      await prisma.supplierDocument.create({
        data: {
          supplierId: supplier.id,
          docType: d.docType,
          docNumber: d.docNumber,
          issueDate: d.issueDate,
          expiryDate: d.expiryDate,
          storageKey: d.storageKey,
          fileName: d.fileName,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          verificationStatus: DocStatus.APPROVED,
          isPublic: true,
        },
      });
    }
  }
  console.log('✅ Suppliers and Documents seeded');

  // 7. Receipts and Lots for Ban Mai School
  const receiptCP = await prisma.receipt.create({
    data: {
      receiptNumber: 'PNK-2026-0001',
      schoolId: banMaiSchool.id,
      supplierId: suppliers.get('NCC-CP-MEAT').id,
      receiptDate: new Date('2026-09-25T06:30:00.000Z'),
      notes: 'Nhập thịt heo và thịt bò tươi buổi sáng',
      createdById: warehouseUser.id,
      items: {
        create: [
          {
            ingredientId: ingredients.get('ING-THIT-HEO-XAY').id,
            unit: 'kg',
            quantity: new Decimal(50),
            unitPrice: new Decimal(115000),
            totalAmount: new Decimal(5750000),
            baseQuantity: new Decimal(50),
          },
          {
            ingredientId: ingredients.get('ING-THIT-BO').id,
            unit: 'kg',
            quantity: new Decimal(30),
            unitPrice: new Decimal(280000),
            totalAmount: new Decimal(8400000),
            baseQuantity: new Decimal(30),
          },
        ],
      },
    },
    include: { items: true },
  });

  const lotThitHeo = await prisma.lot.create({
    data: {
      receiptItemId: receiptCP.items[0].id,
      lotCode: 'LOT-HEO-20260925-01',
      schoolId: banMaiSchool.id,
      ingredientId: ingredients.get('ING-THIT-HEO-XAY').id,
      supplierId: suppliers.get('NCC-CP-MEAT').id,
      initialQuantity: new Decimal(50),
      currentStock: new Decimal(50),
      baseUnit: 'kg',
      mfgDate: new Date('2026-09-25T06:30:00.000Z'),
      expiryDate: new Date('2026-10-05T00:00:00.000Z'),
    },
  });

  const lotThitBo = await prisma.lot.create({
    data: {
      receiptItemId: receiptCP.items[1].id,
      lotCode: 'LOT-BO-20260925-01',
      schoolId: banMaiSchool.id,
      ingredientId: ingredients.get('ING-THIT-BO').id,
      supplierId: suppliers.get('NCC-CP-MEAT').id,
      initialQuantity: new Decimal(30),
      currentStock: new Decimal(30),
      baseUnit: 'kg',
      mfgDate: new Date('2026-09-25T06:30:00.000Z'),
      expiryDate: new Date('2026-10-02T00:00:00.000Z'),
    },
  });

  const receiptDatViet = await prisma.receipt.create({
    data: {
      receiptNumber: 'PNK-2026-0002',
      schoolId: banMaiSchool.id,
      supplierId: suppliers.get('NCC-DAP-HOA').id,
      receiptDate: new Date('2026-09-25T06:00:00.000Z'),
      notes: 'Nhập rau củ gạo VietGAP',
      createdById: warehouseUser.id,
      items: {
        create: [
          {
            ingredientId: ingredients.get('ING-GAO').id,
            unit: 'kg',
            quantity: new Decimal(200),
            unitPrice: new Decimal(22000),
            totalAmount: new Decimal(4400000),
            baseQuantity: new Decimal(200),
          },
          {
            ingredientId: ingredients.get('ING-RAU-NGOT').id,
            unit: 'kg',
            quantity: new Decimal(40),
            unitPrice: new Decimal(35000),
            totalAmount: new Decimal(1400000),
            baseQuantity: new Decimal(40),
          },
          {
            ingredientId: ingredients.get('ING-CHUOI').id,
            unit: 'quả',
            quantity: new Decimal(500),
            unitPrice: new Decimal(3000),
            totalAmount: new Decimal(1500000),
            baseQuantity: new Decimal(500),
          },
        ],
      },
    },
    include: { items: true },
  });

  const lotGao = await prisma.lot.create({
    data: {
      receiptItemId: receiptDatViet.items[0].id,
      lotCode: 'LOT-GAO-20260925-01',
      schoolId: banMaiSchool.id,
      ingredientId: ingredients.get('ING-GAO').id,
      supplierId: suppliers.get('NCC-DAP-HOA').id,
      initialQuantity: new Decimal(200),
      currentStock: new Decimal(200),
      baseUnit: 'kg',
      mfgDate: new Date('2026-09-25T06:00:00.000Z'),
      expiryDate: new Date('2027-03-25T00:00:00.000Z'),
    },
  });

  const lotRauNgot = await prisma.lot.create({
    data: {
      receiptItemId: receiptDatViet.items[1].id,
      lotCode: 'LOT-RAU-20260925-01',
      schoolId: banMaiSchool.id,
      ingredientId: ingredients.get('ING-RAU-NGOT').id,
      supplierId: suppliers.get('NCC-DAP-HOA').id,
      initialQuantity: new Decimal(40),
      currentStock: new Decimal(40),
      baseUnit: 'kg',
      mfgDate: new Date('2026-09-25T06:00:00.000Z'),
      expiryDate: new Date('2026-09-30T00:00:00.000Z'),
    },
  });

  const lotChuoi = await prisma.lot.create({
    data: {
      receiptItemId: receiptDatViet.items[2].id,
      lotCode: 'LOT-CHUOI-20260925-01',
      schoolId: banMaiSchool.id,
      ingredientId: ingredients.get('ING-CHUOI').id,
      supplierId: suppliers.get('NCC-DAP-HOA').id,
      initialQuantity: new Decimal(500),
      currentStock: new Decimal(500),
      baseUnit: 'quả',
      mfgDate: new Date('2026-09-25T06:00:00.000Z'),
      expiryDate: new Date('2026-10-01T00:00:00.000Z'),
    },
  });

  const receiptBaHuan = await prisma.receipt.create({
    data: {
      receiptNumber: 'PNK-2026-0003',
      schoolId: banMaiSchool.id,
      supplierId: suppliers.get('NCC-BA-HUAN').id,
      receiptDate: new Date('2026-09-25T06:15:00.000Z'),
      createdById: warehouseUser.id,
      items: {
        create: [
          {
            ingredientId: ingredients.get('ING-TRUNG-GA').id,
            unit: 'quả',
            quantity: new Decimal(600),
            unitPrice: new Decimal(3200),
            totalAmount: new Decimal(1920000),
            baseQuantity: new Decimal(600),
          },
        ],
      },
    },
    include: { items: true },
  });

  const lotTrung = await prisma.lot.create({
    data: {
      receiptItemId: receiptBaHuan.items[0].id,
      lotCode: 'LOT-TRUNG-20260925-01',
      schoolId: banMaiSchool.id,
      ingredientId: ingredients.get('ING-TRUNG-GA').id,
      supplierId: suppliers.get('NCC-BA-HUAN').id,
      initialQuantity: new Decimal(600),
      currentStock: new Decimal(600),
      baseUnit: 'quả',
      mfgDate: new Date('2026-09-25T06:15:00.000Z'),
      expiryDate: new Date('2026-10-25T00:00:00.000Z'),
    },
  });

  console.log('✅ Receipts and Lots seeded');

  // 8. Sample Published Meal Plan (Lunch for Ban Mai School on 2026-09-29)
  const mealPlan = await prisma.mealPlan.create({
    data: {
      schoolId: banMaiSchool.id,
      mealDate: '2026-09-29',
      mealType: MealType.LUNCH,
      slotCode: 'DEFAULT',
      status: MealStatus.PUBLISHED,
      servingsCount: 350,
      publishedAt: new Date('2026-09-29T04:30:00.000Z'),
      createdById: schoolAdmin.id,
      mealDishes: {
        create: [
          { dishId: dishes.get('DISH-COM-TRANG').id, sortOrder: 1 },
          { dishId: dishes.get('DISH-THIT-KHO-TRUNG').id, sortOrder: 2 },
          { dishId: dishes.get('DISH-CANH-THIT-RAU-NGOT').id, sortOrder: 3 },
          { dishId: dishes.get('DISH-CHUOI-TIANG-MIENG').id, sortOrder: 4 },
        ],
      },
    },
    include: {
      mealDishes: {
        include: { dish: true },
      },
    },
  });

  const dishMap = new Map<string, string>();
  mealPlan.mealDishes.forEach((md) => dishMap.set(md.dishId, md.id));

  // Deduct stock and create allocations
  await prisma.mealAllocation.create({
    data: {
      mealPlanId: mealPlan.id,
      mealDishId: dishMap.get(dishes.get('DISH-THIT-KHO-TRUNG').id),
      ingredientId: ingredients.get('ING-THIT-HEO-XAY').id,
      lotId: lotThitHeo.id,
      allocatedQty: new Decimal(17.5),
      baseUnit: 'kg',
    },
  });
  await prisma.lot.update({
    where: { id: lotThitHeo.id },
    data: { currentStock: { decrement: 17.5 } },
  });

  await prisma.mealAllocation.create({
    data: {
      mealPlanId: mealPlan.id,
      mealDishId: dishMap.get(dishes.get('DISH-THIT-KHO-TRUNG').id),
      ingredientId: ingredients.get('ING-TRUNG-GA').id,
      lotId: lotTrung.id,
      allocatedQty: new Decimal(350),
      baseUnit: 'quả',
    },
  });
  await prisma.lot.update({
    where: { id: lotTrung.id },
    data: { currentStock: { decrement: 350 } },
  });

  await prisma.mealAllocation.create({
    data: {
      mealPlanId: mealPlan.id,
      mealDishId: dishMap.get(dishes.get('DISH-COM-TRANG').id),
      ingredientId: ingredients.get('ING-GAO').id,
      lotId: lotGao.id,
      allocatedQty: new Decimal(28),
      baseUnit: 'kg',
    },
  });
  await prisma.lot.update({
    where: { id: lotGao.id },
    data: { currentStock: { decrement: 28 } },
  });

  await prisma.mealAllocation.create({
    data: {
      mealPlanId: mealPlan.id,
      mealDishId: dishMap.get(dishes.get('DISH-CANH-THIT-RAU-NGOT').id),
      ingredientId: ingredients.get('ING-RAU-NGOT').id,
      lotId: lotRauNgot.id,
      allocatedQty: new Decimal(14),
      baseUnit: 'kg',
    },
  });
  await prisma.lot.update({
    where: { id: lotRauNgot.id },
    data: { currentStock: { decrement: 14 } },
  });

  await prisma.mealAllocation.create({
    data: {
      mealPlanId: mealPlan.id,
      mealDishId: dishMap.get(dishes.get('DISH-CHUOI-TIANG-MIENG').id),
      ingredientId: ingredients.get('ING-CHUOI').id,
      lotId: lotChuoi.id,
      allocatedQty: new Decimal(350),
      baseUnit: 'quả',
    },
  });
  await prisma.lot.update({
    where: { id: lotChuoi.id },
    data: { currentStock: { decrement: 350 } },
  });

  // 9. Immutable TraceSnapshot for the published meal
  const publicToken = generatePublicToken();
  const snapshotJson: PublicMealSnapshot = {
    mealPlanId: mealPlan.id,
    school: {
      name: banMaiSchool.name,
      code: banMaiSchool.code,
      slug: banMaiSchool.slug,
      address: banMaiSchool.address,
      phone: banMaiSchool.phone,
    },
    mealDate: '2026-09-29',
    mealType: mealPlan.mealType,
    mealTypeName: getMealTypeName(mealPlan.mealType),
    portions: 350,
    dishes: [
      {
        dishName: 'Cơm trắng gạo tám thơm',
        categoryName: 'Cơm & Tinh bột',
        ingredients: [
          {
            ingredientName: 'Gạo Tám Điện Biên',
            lotNumber: 'LOT-GAO-20260925-01',
            supplier: {
              name: 'Công ty CP Thực phẩm Sạch Đất Việt',
              taxCode: '0108998877',
              address: 'Xã Tiền Lệ, Huyện Hoài Đức, TP Hà Nội',
              documents: [
                {
                  id: 'doc-1',
                  docType: 'ChungNhan_VietGAP',
                  docNumber: 'VG-HN-2025-089',
                  issueDate: '2025-01-10',
                  expiryDate: '2027-01-10',
                  issuedBy: 'Sở Nông Nghiệp & PTNT Hà Nội',
                  fileUrl: '/uploads/docs/vietgap-datviet.pdf',
                  status: 'APPROVED',
                },
              ],
            },
          },
        ],
      },
      {
        dishName: 'Thịt heo nạc kho trứng cút/gà',
        categoryName: 'Món mặn - Thịt heo',
        ingredients: [
          {
            ingredientName: 'Thịt nạc vai heo xay',
            lotNumber: 'LOT-HEO-20260925-01',
            supplier: {
              name: 'Công ty Cổ phần Chăn nuôi C.P. Việt Nam',
              taxCode: '3600224523',
              address: 'KCN Biên Hòa II, Đồng Nai (Chi nhánh Hà Nội)',
              documents: [
                {
                  id: 'doc-2',
                  docType: 'KiemDich_ThuY',
                  docNumber: 'KD-TY-2026-00129',
                  issueDate: '2026-01-05',
                  expiryDate: '2026-12-31',
                  issuedBy: 'Chi Cục Chăn Nuôi & Thú Y',
                  fileUrl: '/uploads/docs/kiemdich-cp.pdf',
                  status: 'APPROVED',
                },
              ],
            },
          },
          {
            ingredientName: 'Trứng gà tươi Ba Huân',
            lotNumber: 'LOT-TRUNG-20260925-01',
            supplier: {
              name: 'Công ty TNHH Ba Huân Miền Bắc',
              taxCode: '0106655443',
              address: 'Cụm CN Phúc Thọ, Huyện Phúc Thọ, Hà Nội',
              documents: [
                {
                  id: 'doc-3',
                  docType: 'ChungNhan_CoSoDuDieuKien_ATTP',
                  docNumber: 'ATTP-BH-2025-01',
                  issueDate: '2025-03-01',
                  expiryDate: '2028-03-01',
                  issuedBy: 'Chi Cục QLCL Nông Lâm Thủy Sản Hà Nội',
                  fileUrl: '/uploads/docs/attp-bahuan.pdf',
                  status: 'APPROVED',
                },
              ],
            },
          },
        ],
      },
      {
        dishName: 'Canh thịt băm rau ngót',
        categoryName: 'Canh & Súp dinh dưỡng',
        ingredients: [
          {
            ingredientName: 'Rau ngót VietGAP',
            lotNumber: 'LOT-RAU-20260925-01',
            supplier: {
              name: 'Công ty CP Thực phẩm Sạch Đất Việt',
              taxCode: '0108998877',
              address: 'Xã Tiền Lệ, Huyện Hoài Đức, TP Hà Nội',
              documents: [
                {
                  id: 'doc-4',
                  docType: 'ChungNhan_VietGAP',
                  docNumber: 'VG-HN-2025-089',
                  issueDate: '2025-01-10',
                  expiryDate: '2027-01-10',
                  issuedBy: 'Sở Nông Nghiệp & PTNT Hà Nội',
                  fileUrl: '/uploads/docs/vietgap-datviet.pdf',
                  status: 'APPROVED',
                },
              ],
            },
          },
        ],
      },
      {
        dishName: 'Chuối tiêu tráng miệng',
        categoryName: 'Trái cây & Tráng miệng',
        ingredients: [
          {
            ingredientName: 'Chuối tiêu chín tự nhiên',
            lotNumber: 'LOT-CHUOI-20260925-01',
            supplier: {
              name: 'Công ty CP Thực phẩm Sạch Đất Việt',
              taxCode: '0108998877',
              address: 'Xã Tiền Lệ, Huyện Hoài Đức, TP Hà Nội',
              documents: [],
            },
          },
        ],
      },
    ],
    publishedAt: '2026-09-29T04:30:00.000Z',
    version: 1,
  };

  await prisma.traceSnapshot.create({
    data: {
      mealPlanId: mealPlan.id,
      publicToken,
      version: 1,
      snapshotData: JSON.stringify(snapshotJson),
      publishedAt: new Date('2026-09-29T04:30:00.000Z'),
      publishedById: schoolAdmin.id,
    },
  });

  console.log(`✅ Sample published meal created with Public Trace Token: ${publicToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
