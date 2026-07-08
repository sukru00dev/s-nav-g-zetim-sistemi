const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Üniversite
  const uni = await prisma.university.upsert({
    where: { name: 'Harran Üniversitesi' },
    update: {},
    create: { name: 'Harran Üniversitesi' }
  });

  // 2. Fakülte (Unity)
  let unity = await prisma.unity.findFirst({ where: { name: 'Mühendislik Fakültesi' } });
  if (!unity) {
    unity = await prisma.unity.create({
      data: { name: 'Mühendislik Fakültesi', universityId: uni.id }
    });
  }

  // 3. Bölüm (Department)
  let dept = await prisma.department.findFirst({ where: { name: 'Bilgisayar Mühendisliği' } });
  if (!dept) {
    dept = await prisma.department.create({
      data: { name: 'Bilgisayar Mühendisliği', unityId: unity.id }
    });
  }

  // 4. Program
  let prog = await prisma.program.findFirst({ where: { name: 'Lisans Programı' } });
  if (!prog) {
    prog = await prisma.program.create({
      data: { name: 'Lisans Programı', departmentId: dept.id }
    });
  }

  // 4. Ders (Course)
  let course = await prisma.course.findFirst({ where: { code: 'CENG201' } });
  if (!course) {
    course = await prisma.course.create({
      data: { name: 'Veri Yapıları ve Algoritmalar', code: 'CENG201', programId: prog.id }
    });
  }

  // 5. Şube A ve B yerine sadece 1 Kurs var. Onu da id = 1 yapmaya çalışmayacağız, otomatik ID alıyor.
  // Frontend'de courseId'yi dinamik çekebiliriz ama şimdilik veritabanını temizlemesi de gerekiyor.
  
  // Let's clear any bad test exams that failed midway or are junk
  await prisma.exam.deleteMany({});
  
  console.log('Real data seeded successfully. Course ID:', course.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
