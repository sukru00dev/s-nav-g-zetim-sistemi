const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Süper Admin (Tekniker) hesabı oluşturuluyor...');

  // 1. Önce Rollerin var olduğundan emin olalım (Rol 1 = Yönetici)
  const superAdminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: { name_tr: 'Yönetici', name_en: 'Admin' },
    create: { id: 1, name_tr: 'Yönetici', name_en: 'Admin' }
  });

  const protokolRole = await prisma.role.upsert({
    where: { id: 2 },
    update: { name_tr: 'Protokol', name_en: 'Protocol' },
    create: { id: 2, name_tr: 'Protokol', name_en: 'Protocol' }
  });

  const akademisyenRole = await prisma.role.upsert({
    where: { id: 3 },
    update: { name_tr: 'Akademisyen', name_en: 'Academician' },
    create: { id: 3, name_tr: 'Akademisyen', name_en: 'Academician' }
  });

  const ogrenciRole = await prisma.role.upsert({
    where: { id: 4 },
    update: { name_tr: 'Öğrenci', name_en: 'Student' },
    create: { id: 4, name_tr: 'Öğrenci', name_en: 'Student' }
  });

  // 2. Süper Admin Kullanıcısını oluştur
  const tcKimlik = '00000000000';
  const password = 'admin123';
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const adminUser = await prisma.user.upsert({
    where: { tc_kimlik: tcKimlik },
    update: {
      password: hashedPassword,
      roleId: superAdminRole.id
    },
    create: {
      tc_kimlik: tcKimlik,
      username: 'superadmin',
      email: 'admin@harran.edu.tr',
      password: hashedPassword,
      forename: 'Sistem',
      surname: 'Yöneticisi',
      roleId: superAdminRole.id,
      photo: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
      isActive: true
    }
  });

  console.log(`✅ Süper Admin başarıyla oluşturuldu!`);
  console.log(`T.C. Kimlik: ${adminUser.tc_kimlik}`);
  console.log(`Şifre: admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
