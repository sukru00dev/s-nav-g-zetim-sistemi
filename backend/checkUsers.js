const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      tc_kimlik: true,
      role: { select: { name_tr: true } }
    }
  });
  console.log("=== VERİTABANINDAKİ KULLANICILAR ===");
  users.forEach(u => {
    console.log(`ID: ${u.id} | Username: ${u.username} | Email: ${u.email} | TC: ${u.tc_kimlik} | Rol: ${u.role.name_tr}`);
  });
  await prisma.$disconnect();
}

checkUsers();
