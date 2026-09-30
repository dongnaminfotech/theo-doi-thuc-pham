import { PrismaClient, Role, UserStatus } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function bootstrap() {
  const email = (process.env.ADMIN_EMAIL || 'admin@newgreen.edu.vn').toLowerCase().trim();
  const name = process.env.ADMIN_NAME || 'Quản trị viên Hệ thống (Bootstrap)';
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('ADMIN_PASSWORD phải có ít nhất 8 ký tự');
  }

  const passwordHash = hashPassword(password);
  console.log(`Checking if admin user exists with email: ${email}...`);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { name, passwordHash, role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE },
    });
    console.log(`Updated ${email} to SUPER_ADMIN & ACTIVE and refreshed its password.`);
    return;
  }

  const newUser = await prisma.user.create({
    data: { email, name, passwordHash, role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE },
  });
  console.log(`Successfully created SUPER_ADMIN: ${newUser.email} (ID: ${newUser.id})`);
}

bootstrap()
  .catch((error) => {
    console.error('Error bootstrapping admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
