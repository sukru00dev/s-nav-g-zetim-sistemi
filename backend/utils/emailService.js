const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT || '587');
const secure = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user,
    pass,
  },
  tls: {
    rejectUnauthorized: false
  }
});

exports.sendResetPasswordEmail = async (email, resetUrl) => {
  if (!user || !pass) {
    console.warn('\n⚠️ [EMAIL SERVICE WARNING] SMTP Credentials (SMTP_USER/SMTP_PASS) are not configured in .env. Reset Link logged to console:');
    console.warn(`👉 Reset URL: ${resetUrl}\n`);
    
    return {
      messageId: 'dev-mode-logged-to-console',
      preview: resetUrl
    };
  }

  const mailOptions = {
    from: `"Harran Üniversitesi Sınav Yönetimi" <${user}>`,
    to: email,
    subject: 'Harran Üniversitesi - Şifre Sıfırlama Talebi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;">
        <div style="text-align: center; margin-bottom: 20px; padding: 20px; background-color: #002147; border-radius: 8px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">Harran Üniversitesi</h2>
          <p style="color: #ffe16d; margin: 5px 0 0 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Sınav Yönetim ve Gözetim Sistemi</p>
        </div>
        
        <h3 style="color: #00306e; font-size: 18px; font-weight: bold; margin-bottom: 15px;">Şifre Sıfırlama Talebi</h3>
        <p style="font-size: 14px; line-height: 1.6;">Sayın Kullanıcımız,</p>
        <p style="font-size: 14px; line-height: 1.6;">Hesabınız için şifre sıfırlama talebinde bulunulmuştur. Kimliğiniz MERNİS üzerinden doğrulanmıştır.</p>
        <p style="font-size: 14px; line-height: 1.6;">Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz. Güvenliğiniz için bu bağlantı <strong>15 dakika</strong> geçerlidir:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #00306e; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(0,48,110,0.15);">Yeni Şifre Belirle</a>
        </div>
        
        <p style="font-size: 12px; color: #718096; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; line-height: 1.6;">
          Eğer yukarıdaki butona tıklayamıyorsanız, aşağıdaki bağlantıyı tarayıcınızın adres çubuğuna kopyalayıp yapıştırabilirsiniz:<br>
          <a href="${resetUrl}" style="color: #00306e; text-decoration: underline; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <p style="font-size: 11px; color: #a0aec0; margin-top: 30px; border-top: 1px dashed #e2e8f0; padding-top: 15px;">
          Bu talep sizin tarafınızdan gerçekleştirilmediyse, lütfen bu e-postayı dikkate almayınız. Hesabınız güvendedir.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendActivationCodeEmail = async (email, code) => {
  if (!user || !pass) {
    console.warn('\n⚠️ [EMAIL SERVICE WARNING] SMTP Credentials (SMTP_USER/SMTP_PASS) are not configured in .env. Activation Code logged to console:');
    console.warn(`👉 Activation Code for ${email}: ${code}\n`);
    
    return {
      messageId: 'dev-mode-logged-to-console',
      preview: code
    };
  }

  const mailOptions = {
    from: `"Harran Üniversitesi Sınav Yönetimi" <${user}>`,
    to: email,
    subject: 'Harran Üniversitesi - Hesap Aktivasyon Kodu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;">
        <div style="text-align: center; margin-bottom: 20px; padding: 20px; background-color: #002147; border-radius: 8px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">Harran Üniversitesi</h2>
          <p style="color: #ffe16d; margin: 5px 0 0 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Sınav Yönetim ve Gözetim Sistemi</p>
        </div>
        
        <h3 style="color: #00306e; font-size: 18px; font-weight: bold; margin-bottom: 15px;">Hesap Aktivasyonu</h3>
        <p style="font-size: 14px; line-height: 1.6;">Sayın Kullanıcımız,</p>
        <p style="font-size: 14px; line-height: 1.6;">Harran Üniversitesi Çevrimiçi Sınav ve Gözetim Platformuna yaptığınız kayıt başvurusu alınmıştır.</p>
        <p style="font-size: 14px; line-height: 1.6;">Sisteme giriş yapabilmeniz için öncelikle e-posta adresinizi doğrulamanız gerekmektedir. Aşağıdaki 6 haneli doğrulama kodunu aktivasyon ekranına girerek hesabınızı aktif hale getirebilirsiniz:</p>
        
        <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #f7fafc; border-radius: 8px; border: 1px dashed #cbd5e0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #00306e; font-family: monospace;">${code}</span>
        </div>
        
        <p style="font-size: 12px; color: #718096; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; line-height: 1.6;">
          Bu kod tek kullanımlıktır ve güvenliğiniz için kimseyle paylaşılmamalıdır.
        </p>
        
        <p style="font-size: 11px; color: #a0aec0; margin-top: 30px; border-top: 1px dashed #e2e8f0; padding-top: 15px;">
          Bu kayıt işlemi sizin tarafınızdan gerçekleştirilmediyse lütfen bu e-postayı dikkate almayınız.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
