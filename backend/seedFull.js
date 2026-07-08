const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  console.log("Seeding database with full hierarchy...");

  // Rolleri oluştur
  const roles = [
    { id: 1, name_tr: 'Yönetici' },
    { id: 2, name_tr: 'Protokol' },
    { id: 3, name_tr: 'Akademisyen' },
    { id: 4, name_tr: 'Öğrenci' }
  ];
  for (let r of roles) {
    await prisma.role.upsert({
      where: { id: r.id },
      update: { name_tr: r.name_tr },
      create: { id: r.id, name_tr: r.name_tr }
    });
  }

  const roleAdmin = await prisma.role.findUnique({ where: { id: 1 }});
  const roleProtokol = await prisma.role.findUnique({ where: { id: 2 }});
  const roleAcademic = await prisma.role.findUnique({ where: { id: 3 }});
  const roleStudent = await prisma.role.findUnique({ where: { id: 4 }});

  // Hiyerarşi
  const galaxy = await prisma.galaxy.create({ data: { name: 'Samanyolu' } });
  const system = await prisma.system.create({ data: { name: 'Güneş Sistemi', galaxyId: galaxy.id } });
  const world = await prisma.world.create({ data: { name: 'Dünya', systemId: system.id } });
  const country = await prisma.country.create({ data: { name: 'Türkiye', worldId: world.id } });
  const city = await prisma.city.create({ data: { name: 'Şanlıurfa', countryId: country.id } });

  const university = await prisma.university.create({
    data: { name: 'Harran Üniversitesi', cityId: city.id }
  });

  const unity = await prisma.unity.create({
    data: { name: 'Mühendislik Fakültesi', universityId: university.id }
  });

  const department = await prisma.department.create({
    data: { name: 'Bilgisayar Mühendisliği', unityId: unity.id }
  });

  const program = await prisma.program.create({
    data: { name: 'Lisans Programı', departmentId: department.id }
  });

  const course = await prisma.course.create({
    data: { name: 'Yazılım Mühendisliği', code: 'CENG301', programId: program.id }
  });

  const branch = await prisma.branch.create({
    data: { name: 'A Şubesi', courseId: course.id }
  });

  // Kullanıcılar
  const adminPwd = await bcrypt.hash('123456', 10);
  const admin = await prisma.user.create({
    data: { tc_kimlik: '11111111111', username: 'admin', email: 'admin@leukolion.com', password: adminPwd, forename: 'Sistem', surname: 'Yöneticisi', roleId: roleAdmin.id }
  });

  const protocol = await prisma.user.create({
    data: { tc_kimlik: '22222222222', username: 'rektor', email: 'rektor@harran.edu.tr', password: adminPwd, forename: 'Sayın', surname: 'Rektör', roleId: roleProtokol.id }
  });

  const teacher = await prisma.user.create({
    data: { tc_kimlik: '33333333333', username: 'dursun', email: 'dursun@harran.edu.tr', password: adminPwd, forename: 'Dursun', surname: 'Akaslan', roleId: roleAcademic.id }
  });

  const student = await prisma.user.create({
    data: { tc_kimlik: '44444444444', username: 'ogrenci1', email: 'ogrenci@harran.edu.tr', password: adminPwd, forename: 'Örnek', surname: 'Öğrenci', roleId: roleStudent.id }
  });

  // Sınav
  const exam = await prisma.exam.create({
    data: {
      title: 'Vize Sınavı',
      startTime: new Date(Date.now() - 3600000), // 1 saat önce başladı
      endTime: new Date(Date.now() + 3600000), // 1 saat sonra bitecek
      durationMin: 60,
      branchId: branch.id,
      teacherId: teacher.id
    }
  });

  // Soru
  const question = await prisma.question.create({
    data: {
      text: 'Aşağıdakilerden hangisi bir işletim sistemidir?',
      type: 'MULTIPLE_CHOICE',
      examId: exam.id
    }
  });

  console.log("Seeding completed.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
