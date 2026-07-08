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

        // SOAP callback'i Promise'e sar — async/await ile uyumlu, hata yönetimi güvenli
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

        const newUser = await prisma.user.create({
            data: {
                username,
                tc_kimlik,
                email,
                password: hashedPassword,
                roleId: parseInt(roleId),
                forename,
                surname,
                yearOfBirth: yearOfBirth ? parseInt(yearOfBirth) : null,
                mac_address: mac_address || null,
                photo: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
            }
        });

        res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu', userId: newUser.id });
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
