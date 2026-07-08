const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  console.log("Seeding database with full hierarchy (Corrected)...");

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

  // Hiyerarşi (Find or Create)
  let galaxy = await prisma.galaxy.findFirst({ where: { name: 'Samanyolu' } });
  if (!galaxy) galaxy = await prisma.galaxy.create({ data: { name: 'Samanyolu' } });

  let system = await prisma.system.findFirst({ where: { name: 'Güneş Sistemi' } });
  if (!system) system = await prisma.system.create({ data: { name: 'Güneş Sistemi', galaxyId: galaxy.id } });

  let world = await prisma.world.findFirst({ where: { name: 'Dünya' } });
  if (!world) world = await prisma.world.create({ data: { name: 'Dünya', systemId: system.id } });

  let country = await prisma.country.findFirst({ where: { name: 'Türkiye' } });
  if (!country) country = await prisma.country.create({ data: { name: 'Türkiye', worldId: world.id } });

  let city = await prisma.city.findFirst({ where: { name: 'Şanlıurfa' } });
  if (!city) city = await prisma.city.create({ data: { name: 'Şanlıurfa', countryId: country.id } });

  let university = await prisma.university.findFirst({ where: { name: 'Harran Üniversitesi' } });
  if (!university) university = await prisma.university.create({ data: { name: 'Harran Üniversitesi', cityId: city.id } });

  let unity = await prisma.unity.findFirst({ where: { name: 'Mühendislik Fakültesi' } });
  if (!unity) unity = await prisma.unity.create({ data: { name: 'Mühendislik Fakültesi', universityId: university.id } });

  let department = await prisma.department.findFirst({ where: { name: 'Bilgisayar Mühendisliği' } });
  if (!department) department = await prisma.department.create({ data: { name: 'Bilgisayar Mühendisliği', unityId: unity.id } });

  let program = await prisma.program.findFirst({ where: { name: 'Lisans Programı' } });
  if (!program) program = await prisma.program.create({ data: { name: 'Lisans Programı', departmentId: department.id } });

  let course = await prisma.course.findFirst({ where: { code: 'CENG301' } });
  if (!course) course = await prisma.course.create({ data: { name: 'Yazılım Mühendisliği', code: 'CENG301', programId: program.id } });

  let branch = await prisma.branch.findFirst({ where: { name: 'A Şubesi', courseId: course.id } });
  if (!branch) branch = await prisma.branch.create({ data: { name: 'A Şubesi', courseId: course.id } });

  // Kullanıcılar (Find or Create)
  const adminPwd = await bcrypt.hash('123456', 10);
  
  let admin = await prisma.user.findFirst({ where: { tc_kimlik: '11111111111' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: { tc_kimlik: '11111111111', username: 'admin', email: 'admin@leukolion.com', password: adminPwd, forename: 'Sistem', surname: 'Yöneticisi', roleId: roleAdmin.id }
    });
  }

  let protocol = await prisma.user.findFirst({ where: { tc_kimlik: '22222222222' } });
  if (!protocol) {
    protocol = await prisma.user.create({
      data: { tc_kimlik: '22222222222', username: 'rektor', email: 'rektor@harran.edu.tr', password: adminPwd, forename: 'Sayın', surname: 'Rektör', roleId: roleProtokol.id }
    });
  }

  let teacher = await prisma.user.findFirst({ where: { tc_kimlik: '33333333333' } });
  if (!teacher) {
    teacher = await prisma.user.create({
      data: { tc_kimlik: '33333333333', username: 'dursun', email: 'dursun@harran.edu.tr', password: adminPwd, forename: 'Dursun', surname: 'Akaslan', roleId: roleAcademic.id }
    });
  }

  // Öğrenciyi şubeye bağla (branches: { connect: { id: branch.id } })
  let student = await prisma.user.findFirst({ where: { tc_kimlik: '44444444444' } });
  if (!student) {
    student = await prisma.user.create({
      data: { 
        tc_kimlik: '44444444444', 
        username: 'ogrenci1', 
        email: 'ogrenci@harran.edu.tr', 
        password: adminPwd, 
        forename: 'Örnek', 
        surname: 'Öğrenci', 
        roleId: roleStudent.id,
        branches: {
          connect: { id: branch.id }
        }
      }
    });
  } else {
    // Şubeye kayıtlı değilse bağla
    const isEnrolled = await prisma.user.findFirst({
      where: { id: student.id, branches: { some: { id: branch.id } } }
    });
    if (!isEnrolled) {
      await prisma.user.update({
        where: { id: student.id },
        data: { branches: { connect: { id: branch.id } } }
      });
    }
  }

  // Sınav
  let exam = await prisma.exam.findFirst({ where: { title: 'Yazılım Tasarımı ve Mimarisi Vize Sınavı' } });
  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        title: 'Yazılım Tasarımı ve Mimarisi Vize Sınavı',
        description: 'Yazılım tasarımı şablonları ve mimari tarzları üzerine ara sınav.',
        startTime: new Date(Date.now() - 3600000), // 1 saat önce başladı
        endTime: new Date(Date.now() + 3600000), // 1 saat sonra bitecek
        durationMin: 60,
        isSupervised: true, // Gözetimli sınav testi için true yapalım!
        branchId: branch.id,
        teacherId: teacher.id
      }
    });
  }

  // Çoktan Seçmeli Soru
  let q1 = await prisma.question.findFirst({ where: { text: 'Aşağıdakilerden hangisi bir tasarım şablonu (design pattern) grubu değildir?' } });
  if (!q1) {
    q1 = await prisma.question.create({
      data: {
        text: 'Aşağıdakilerden hangisi bir tasarım şablonu (design pattern) grubu değildir?',
        type: 'MULTIPLE_CHOICE',
        examId: exam.id
      }
    });

    // Seçenekler
    await prisma.option.createMany({
      data: [
        { text: 'Yaratımsal (Creational)', isCorrect: false, questionId: q1.id },
        { text: 'Davranışsal (Behavioral)', isCorrect: false, questionId: q1.id },
        { text: 'Yapısal (Structural)', isCorrect: false, questionId: q1.id },
        { text: 'Derlemeli (Compiler)', isCorrect: true, questionId: q1.id }
      ]
    });
  }

  // Açık Uçlu Soru
  let q2 = await prisma.question.findFirst({ where: { text: 'SOLID yazılım tasarım prensiplerinin amaçlarını ve önemini kısaca açıklayınız.' } });
  if (!q2) {
    q2 = await prisma.question.create({
      data: {
        text: 'SOLID yazılım tasarım prensiplerinin amaçlarını ve önemini kısaca açıklayınız.',
        type: 'OPEN_ENDED',
        examId: exam.id
      }
    });
  }

  console.log("Corrected seeding completed.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
