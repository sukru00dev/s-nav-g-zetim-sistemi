const prisma = require('../prismaClient');

exports.startSession = async (req, res) => {
    try {
        const examId = parseInt(req.params.examId);
        const userId = req.user.id;

        // Tamamlanmış oturumu kontrol et — öğrenci sınavı bitirdiyse tekrar giremez
        const completedSession = await prisma.examSession.findFirst({
            where: { examId, userId, status: 'COMPLETED' }
        });

        if (completedSession) {
            return res.status(400).json({ message: 'Bu sınavı zaten tamamladınız. Tekrar giriş yapılamaz.' });
        }

        // Devam eden veya askıya alınmış oturum kontrolü
        const existingSession = await prisma.examSession.findFirst({
            where: { examId, userId, status: { in: ['ONGOING', 'SUSPENDED'] } }
        });

        if (existingSession) {
            return res.json({ 
                message: existingSession.status === 'SUSPENDED' ? 'Sınav oturumunuz askıya alınmıştır' : 'Oturum zaten devam ediyor', 
                session: existingSession 
            });
        }

        const session = await prisma.examSession.create({
            data: {
                examId,
                userId,
                status: 'ONGOING'
            }
        });

        res.status(201).json({ message: 'Sınav oturumu başlatıldı', session });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Oturum başlatılırken hata oluştu' });
    }
};

exports.submitAnswer = async (req, res) => {
    try {
        const examId = parseInt(req.params.examId);
        const { questionId, optionId, textAnswer } = req.body;
        const userId = req.user.id;

        const parsedQuestionId = parseInt(questionId);
        const parsedOptionId = optionId ? parseInt(optionId) : null;

        if (isNaN(parsedQuestionId)) {
            return res.status(400).json({ message: 'Geçersiz soru ID\'si' });
        }

        const session = await prisma.examSession.findFirst({
            where: { examId, userId, status: 'ONGOING' }
        });

        if (!session) {
            return res.status(404).json({ message: 'Aktif sınav oturumu bulunamadı' });
        }

        const existingAnswer = await prisma.answer.findFirst({
            where: { sessionId: session.id, questionId: parsedQuestionId }
        });

        if (existingAnswer) {
            const updated = await prisma.answer.update({
                where: { id: existingAnswer.id },
                data: { optionId: parsedOptionId, textAnswer }
            });
            return res.json({ message: 'Yanıt güncellendi', answer: updated });
        }

        const answer = await prisma.answer.create({
            data: {
                sessionId: session.id,
                questionId: parsedQuestionId,
                optionId: parsedOptionId,
                textAnswer
            }
        });

        res.status(201).json({ message: 'Yanıt kaydedildi', answer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Yanıt kaydedilirken hata oluştu' });
    }
};

exports.endSession = async (req, res) => {
    try {
        const examId = parseInt(req.params.examId);
        const userId = req.user.id;

        const session = await prisma.examSession.findFirst({
            where: { examId, userId, status: 'ONGOING' }
        });

        if (!session) {
            return res.status(404).json({ message: 'Aktif oturum bulunamadı' });
        }

        const updatedSession = await prisma.examSession.update({
            where: { id: session.id },
            data: { status: 'COMPLETED', endTime: new Date() }
        });

        res.json({ message: 'Sınav başarıyla tamamlandı', session: updatedSession });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sınav sonlandırılırken hata oluştu' });
    }
};

exports.getSessionById = async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        
        // Gözetim Canlı Takip: Öğrencinin aktifliğini hafızada güncelle
        if (!global.lastActiveSessionPings) {
            global.lastActiveSessionPings = {};
        }
        global.lastActiveSessionPings[sessionId] = Date.now();

        const session = await prisma.examSession.findUnique({
            where: { id: sessionId },
            select: { 
                id: true, 
                examId: true, 
                status: true, 
                startTime: true,
                logs: {
                    where: { type: 'WARNING_SENT' },
                    orderBy: { timestamp: 'desc' }
                }
            }
        });

        if (!session) {
            return res.status(404).json({ message: 'Oturum bulunamadı' });
        }

        res.json(session);
    } catch (error) {
        console.error('getSessionById error:', error);
        res.status(500).json({ message: 'Oturum getirilirken hata oluştu' });
    }
};

exports.updateSessionFrame = async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const { photo } = req.body;

        if (!photo) {
            return res.status(400).json({ message: 'Fotoğraf bilgisi eksik' });
        }

        const session = await prisma.examSession.findUnique({
            where: { id: sessionId },
            select: { userId: true }
        });

        if (!session) {
            return res.status(404).json({ message: 'Oturum bulunamadı' });
        }

        // Güvenlik: Sadece oturum sahibi öğrenci veya yetkili eğitmen/yönetici işlem yapabilir
        if (session.userId !== req.user.id && req.user.role !== 'Akademisyen' && req.user.role !== 'Yönetici') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır.' });
        }

        // ÖNEMLİ MANTIK DÜZELTMESİ: user.photo alanı kullanıcının kalıcı profil resmidir, 
        // sınav içi anlık video kareleri ile ezilmemelidir. Kalıcı veriyi korumak için güncelleme devre dışı bırakıldı.
        // await prisma.user.update({
        //     where: { id: session.userId },
        //     data: { photo }
        // });

        res.json({ message: 'Kamera karesi alındı (Profil resmi ezilmesi engellendi)' });
    } catch (error) {
        console.error('updateSessionFrame error:', error);
        res.status(500).json({ message: 'Hata oluştu' });
    }
};

