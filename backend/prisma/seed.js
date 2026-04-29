const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskhub.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@taskhub.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Seeded admin user:', admin.email);
  console.log('   Password: admin123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
