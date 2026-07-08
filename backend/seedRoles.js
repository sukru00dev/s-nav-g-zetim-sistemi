const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = [
    { id: 1, name_tr: 'Yönetici' },
    { id: 2, name_tr: 'Protokol' },
    { id: 3, name_tr: 'Akademisyen' },
    { id: 4, name_tr: 'Öğrenci' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name_tr: role.name_tr },
      create: {
        id: role.id,
        name_tr: role.name_tr,
      },
    });
  }
  console.log('Roles seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
