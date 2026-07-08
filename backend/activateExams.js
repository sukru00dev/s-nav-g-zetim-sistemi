const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Sınavları anında aktif hale getirmek için zamanlar güncelleniyor...");
  
  // Tüm sınavların başlangıç tarihini 10 dakika öncesine çekiyoruz ki aktif olsun
  const now = new Date();
  const startTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 dk önce başladı
  const endTime = new Date(now.getTime() + 50 * 60 * 1000);  // 50 dk sonra bitecek

  const updated = await prisma.exam.updateMany({
    data: {
      startTime,
      endTime
    }
  });

  console.log(`${updated.count} adet sınav başarıyla aktifleştirildi (başlangıç saati geçmişe çekildi).`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
