const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.role.findMany().then(roles => {
  console.log(roles);
}).catch(console.error).finally(() => prisma.$disconnect());
