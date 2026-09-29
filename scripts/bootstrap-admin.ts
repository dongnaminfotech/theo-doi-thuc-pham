import { PrismaClient, Role, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function bootstrap() {
  const email = process.env.ADMIN_EMAIL || 'admin@newgreen.edu.vn';
  const name = process.env.ADMIN_NAME || 'Quản trị viên Hệ thống (Bootstrap)';

  console.log(`Checking if admin user exists with email: ${email}...`);

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`Admin user already exists with ID: ${existing.id} (${existing.role})`);
    if (existing.role !== Role.SUPER_ADMIN || existing.status !== UserStatus.ACTIVE) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: Role.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });
      console.log(`Updated user ${email} to SUPER_ADMIN & ACTIVE.`);
    }
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`Successfully created SUPER_ADMIN: ${newUser.email} (ID: ${newUser.id})`);
  }
}

bootstrap()
  .catch((e) => {
    console.error('Error bootstrapping admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
