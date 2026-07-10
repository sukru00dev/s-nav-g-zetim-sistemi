const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../prismaClient');
const soap = require('soap');

exports.verifyTc = async (req, res) => {
    try {
        const { tc_kimlik, forename, surname, yearOfBirth } = req.body;
        
        if (!tc_kimlik || !forename || !surname || !yearOfBirth) {
            return res.status(400).json({ message: 'Lütfen T.C. Kimlik, Ad, Soyad ve Doğum Yılı alanlarını doldurun.' });
        }

        if (tc_kimlik.length !== 11) {
            return res.status(400).json({ verified: false, message: 'Kimlik doğrulanamadı, T.C. 11 haneli olmalıdır.' });
        }

        const url = 'https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx?WSDL';
        const args = {
            TCKimlikNo: tc_kimlik,
            Ad: forename.toLocaleUpperCase('tr-TR'),
            Soyad: surname.toLocaleUpperCase('tr-TR'),
            DogumYili: parseInt(yearOfBirth)
        };

        if (process.env.BYPASS_MERNIS === 'true') {
            return res.json({ verified: true, message: 'Kimlik doğrulandı (MERNIS Bypassed)' });
        }

        // SOAP callback'i Promise'e sar — async/await ile uyumlu, hata yönetimi güvenli
        try {
            const result = await new Promise((resolve, reject) => {
                soap.createClient(url, (err, client) => {
                    if (err) {
                        console.error("SOAP Client Error:", err);
                        return reject(new Error('NVİ Servisine bağlanılamadı'));
                    }
                    client.TCKimlikNoDogrula(args, (err, result) => {
                        if (err) {
                            console.error("SOAP Request Error:", err);
                            return reject(new Error('NVİ Servis isteği başarısız'));
                        }
                        resolve(result);
                    });
                });
            });

            if (result.TCKimlikNoDogrulaResult) {
                return res.json({ verified: true, message: 'Kimlik doğrulandı' });
            } else {
                return res.status(400).json({ verified: false, message: 'Kimlik doğrulanamadı, hatalı bilgi.' });
            }
        } catch (mernisErr) {
            console.error('MERNIS connection failed in verifyTc:', mernisErr.message);
            return res.status(503).json({ 
                verified: false, 
                message: 'Şu anda Nüfus ve Vatandaşlık İşleri (NVİ) sistemi yanıt vermiyor. Lütfen daha sonra tekrar deneyin veya sunucuda BYPASS_MERNIS=true ayarını etkinleştirin.' 
            });
        }
    } catch (error) {
        console.error('verifyTc error:', error.message);
        res.status(500).json({ verified: false, message: error.message || 'Servis hatası' });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, email, password, roleId, forename, surname, tc_kimlik, yearOfBirth, mac_address } = req.body;
        
        if (!username || !email || !password || !roleId || !tc_kimlik) {
            return res.status(400).json({ message: 'Lütfen zorunlu alanları (username, tc_kimlik, email, password) doldurun' });
        }

        if (tc_kimlik.length !== 11) {
            return res.status(400).json({ message: 'T.C. Kimlik No tam 11 haneli olmalıdır' });
        }

        // Yetki Yükseltme Güvenlik Kontrolü: Öğrenci (4) dışındaki roller için Yönetici yetkisi aranır.
        let targetRoleId = 4;
        const parsedRoleId = parseInt(roleId);
        if (parsedRoleId !== 4) {
            const token = req.header('Authorization');
            if (!token) {
                return res.status(403).json({ message: 'Yetkisiz rol seçimi. Sadece yöneticiler personel/protokol kaydı yapabilir.' });
            }
            try {
                const tokenPart = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
                const decoded = jwt.verify(tokenPart, process.env.JWT_SECRET);
                if (decoded.user && decoded.user.role === 'Yönetici') {
                    targetRoleId = parsedRoleId;
                } else {
                    return res.status(403).json({ message: 'Bu işlem için gerekli yetkiniz bulunmamaktadır.' });
                }
            } catch (err) {
                return res.status(401).json({ message: 'Geçersiz yetkilendirme anahtarı.' });
            }
        }

        const userExists = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username },
                    { tc_kimlik }
                ]
            }
        });

        if (userExists) {
            return res.status(400).json({ message: 'Kullanıcı Adı, E-Posta veya TC Kimlik zaten sistemde kayıtlı' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Aktivasyon kodu üretimi (6 haneli sayı)
        const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = await prisma.user.create({
            data: {
                username,
                tc_kimlik,
                email,
                password: hashedPassword,
                roleId: targetRoleId,
                forename,
                surname,
                yearOfBirth: yearOfBirth ? parseInt(yearOfBirth) : null,
                mac_address: mac_address || null,
                photo: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
                isActive: false, // E-posta doğrulanana kadar inaktif
                is_email_verified: false,
                activation_token: activationCode
            }
        });

        // Aktivasyon maili gönderimi
        const { sendActivationCodeEmail } = require('../utils/emailService');
        await sendActivationCodeEmail(email, activationCode);

        res.status(201).json({ message: 'Kayıt başarılı! E-posta adresinize gönderilen 6 haneli doğrulama kodunu girerek hesabınızı aktifleştirin.', userId: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, mac_address } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Lütfen email ve şifre girin' });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: email }, 
                    { tc_kimlik: email } 
                ]
            },
            include: { role: true }
        });

        if (!user) {
            return res.status(400).json({ message: 'Geçersiz kimlik bilgileri' });
        }

        // Kullanıcı hesap aktifliği kontrolü
        if (!user.isActive) {
            return res.status(403).json({ message: 'Hesabınız aktif değildir. Lütfen sistem yöneticinizle iletişime geçin.' });
        }

        // E-posta doğrulama kontrolü (Öğrenciler için zorunlu)
        if (user.role.name_tr === 'Öğrenci' && !user.is_email_verified) {
            return res.status(403).json({ message: 'Lütfen e-posta adresinizi doğrulayın. Aktivasyon kodu e-postanıza gönderilmiştir.' });
        }

        // ÖNEMLİ GÜVENLİK DÜZELTMESİ: Önce şifreyi doğrula, SONRA IP/MAC güncelle
        // Hatalı şifre girişlerinde IP/MAC kaydı yapılmamalı
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Geçersiz kimlik bilgileri' });
        }

        // Şifre doğruysa güncel IP ve Fingerprint (MAC) kaydı
        await prisma.user.update({
            where: { id: user.id },
            data: {
                mac_address: mac_address || user.mac_address,
                ip_address: req.ip || req.connection?.remoteAddress || null
            }
        });

        const payload = {
            user: {
                id: user.id,
                username: user.username,
                role: user.role.name_tr
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    token, 
                    user: { 
                        id: user.id, 
                        username: user.username, 
                        email: user.email, 
                        role: user.role.name_tr,
                        forename: user.forename,
                        surname: user.surname,
                        photo: user.photo
                    } 
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: { select: { name_tr: true } },
                forename: true,
                surname: true,
                photo: true
            }
        });

        if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

        const formattedUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role.name_tr,
            forename: user.forename,
            surname: user.surname,
            photo: user.photo
        };

        res.json(formattedUser);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

const { sendResetPasswordEmail } = require('../utils/emailService');

exports.forgotPassword = async (req, res) => {
    try {
        const { tc_kimlik, forename, surname, yearOfBirth, email } = req.body;
        
        if (!tc_kimlik || !forename || !surname || !yearOfBirth || !email) {
            return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
        }

        // 1. MERNİS doğrulama
        const url = 'https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx?WSDL';
        const args = {
            TCKimlikNo: tc_kimlik,
            Ad: forename.toLocaleUpperCase('tr-TR'),
            Soyad: surname.toLocaleUpperCase('tr-TR'),
            DogumYili: parseInt(yearOfBirth)
        };

        let mernisVerified = false;

        if (process.env.BYPASS_MERNIS === 'true') {
            console.log('ℹ️ [MERNIS BYPASS] MERNIS verification bypassed due to BYPASS_MERNIS=true in .env');
            mernisVerified = true;
        } else {
            try {
                const mernisResult = await new Promise((resolve, reject) => {
                    soap.createClient(url, (err, client) => {
                        if (err) {
                            console.error("SOAP Client Error:", err);
                            return reject(new Error('NVİ Servisine bağlanılamadı'));
                        }
                        client.TCKimlikNoDogrula(args, (err, result) => {
                            if (err) {
                                console.error("SOAP Request Error:", err);
                                return reject(new Error('NVİ Servis isteği başarısız'));
                            }
                            resolve(result);
                        });
                    });
                });
                mernisVerified = mernisResult.TCKimlikNoDogrulaResult;
            } catch (mernisErr) {
                console.error('MERNIS connection failed in forgotPassword:', mernisErr.message);
                return res.status(503).json({ 
                    message: 'Şu anda Nüfus ve Vatandaşlık İşleri (NVİ) sistemi yanıt vermiyor. Lütfen daha sonra tekrar deneyin veya testi kolaylaştırmak için sunucu .env dosyasına BYPASS_MERNIS=true ekleyin.' 
                });
            }
        }

        if (!mernisVerified) {
            return res.status(400).json({ message: 'Kimlik doğrulanamadı, girdiğiniz bilgiler MERNİS kayıtları ile uyuşmuyor.' });
        }

        // 2. Kullanıcıyı bul
        const user = await prisma.user.findFirst({
            where: {
                tc_kimlik,
                email
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Girdiğiniz T.C. Kimlik ve E-Posta adresi ile eşleşen bir kullanıcı bulunamadı.' });
        }

        // 3. JWT Şifre Sıfırlama Tokenı oluştur (Secret = JWT_SECRET + user.password)
        const secret = process.env.JWT_SECRET + user.password;
        const token = jwt.sign({ id: user.id }, secret, { expiresIn: '15m' });

        // 4. Bağlantı oluştur
        const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const resetUrl = `${frontendUrl}/reset-password?token=${token}&id=${user.id}`;

        // 5. E-postayı gönder
        const mailResult = await sendResetPasswordEmail(email, resetUrl);

        let responseMsg = 'Kimliğiniz doğrulandı ve şifre sıfırlama bağlantısı e-posta adresinize gönderildi.';
        if (mailResult.messageId === 'dev-mode-logged-to-console') {
            responseMsg = 'MERNİS Kimlik doğrulaması başarılı! (Geliştirici modu: Sıfırlama bağlantısı sunucu loguna yazdırıldı, lütfen oradan kontrol edin)';
        }

        res.json({ message: responseMsg });
    } catch (error) {
        console.error('forgotPassword error:', error);
        res.status(500).json({ message: error.message || 'Şifre sıfırlama işlemi başlatılırken bir hata oluştu.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { id, token, password } = req.body;

        if (!id || !token || !password) {
            return res.status(400).json({ message: 'Geçersiz istek. Eksik parametreler.' });
        }

        const userId = parseInt(id);
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(400).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Token doğrulama
        const secret = process.env.JWT_SECRET + user.password;
        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (err) {
            return res.status(400).json({ message: 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.' });
        }

        if (decoded.id !== user.id) {
            return res.status(400).json({ message: 'Kullanıcı kimliği uyuşmuyor.' });
        }

        // Yeni şifreyi kaydet
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' });
    } catch (error) {
        console.error('resetPassword error:', error);
        res.status(500).json({ message: 'Şifre güncellenirken sunucuda bir hata oluştu.' });
    }
};

exports.verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: 'E-posta ve doğrulama kodu gereklidir.' });
        }

        const user = await prisma.user.findFirst({
            where: { 
                email: email.trim(),
                activation_token: code.trim()
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Geçersiz veya hatalı doğrulama kodu.' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                is_email_verified: true,
                isActive: true,
                activation_token: null
            }
        });

        res.json({ message: 'Hesabınız başarıyla aktifleştirildi. Şimdi giriş yapabilirsiniz.' });
    } catch (error) {
        console.error('verifyCode error:', error);
        res.status(500).json({ message: 'Aktivasyon işlemi sırasında bir hata oluştu.' });
    }
};
