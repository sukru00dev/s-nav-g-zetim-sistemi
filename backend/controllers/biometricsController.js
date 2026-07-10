const prisma = require('../prismaClient');

// Ağırlıklı risk skorları
const RISK_WEIGHTS = {
    'NO_FACE': 15,
    'MULTIPLE_FACES': 40,
    'TAB_SWITCH': 10,
    'LOCKDOWN_VIOLATION': 15,
    'VOICE_DETECTED': 20,
    'LOOKING_AWAY': 15
};

exports.logBiometrics = async (req, res) => {
    try {
        const { sessionId, questionId, type, status, photoUrl, screenshotUrl, audioUrl } = req.body;
        const userId = req.user.id;
        
        if (!sessionId || !questionId || !type || !status) {
            return res.status(400).json({ message: 'Eksik parametre' });
        }

        const parsedSessionId = parseInt(sessionId);
        const parsedQuestionId = parseInt(questionId);

        if (isNaN(parsedSessionId) || isNaN(parsedQuestionId)) {
            return res.status(400).json({ message: 'Geçersiz oturum veya soru ID\'si' });
        }

        // Oturumun istek atan kullanıcıya ait olduğunu doğrula (Hedef 2: Güvenlik)
        const session = await prisma.examSession.findUnique({
            where: { id: parsedSessionId }
        });

        if (!session || session.userId !== userId) {
            return res.status(403).json({ message: 'Bu oturum üzerinde işlem yapma yetkiniz bulunmamaktadır.' });
        }

        // Biyometrik kaydı oluştur
        switch (type) {
            case 'FACE':
                await prisma.face.create({
                    data: { sessionId: parsedSessionId, questionId: parsedQuestionId, status, photoUrl }
                });
                break;
            case 'EYE':
                await prisma.eye.create({
                    data: { sessionId: parsedSessionId, questionId: parsedQuestionId, status }
                });
                break;
            case 'SCREEN':
                await prisma.screen.create({
                    data: { sessionId: parsedSessionId, questionId: parsedQuestionId, status, screenshotUrl }
                });
                break;
            case 'VOICE':
                await prisma.voice.create({
                    data: { sessionId: parsedSessionId, questionId: parsedQuestionId, status, audioUrl }
                });
                break;
            default:
                return res.status(400).json({ message: 'Geçersiz tip' });
        }

        // Eğer risk teşkil eden bir durumsa ExamLog'a ekle ve riskScore'u güncelle
        const addedRisk = RISK_WEIGHTS[status] || 0;
        if (addedRisk > 0) {
            // ExamLog oluştur
            await prisma.examLog.create({
                data: {
                    sessionId: parsedSessionId,
                    type: status,
                    description: `Sistem Tespiti: Biyometrik ihlal (${type} - ${status})`,
                    photoUrl: photoUrl || screenshotUrl || null
                }
            });

            // ExamSession riskScore'unu güncelle (Atomic Increment ile yarış durumunu engelle)
            const updatedSession = await prisma.examSession.update({
                where: { id: parsedSessionId },
                data: {
                    riskScore: {
                        increment: addedRisk
                    }
                }
            });

            if (updatedSession.riskScore > 100) {
                await prisma.examSession.update({
                    where: { id: parsedSessionId },
                    data: { riskScore: 100 }
                });
            }
        }

        res.status(201).json({ message: 'Biyometrik log eklendi ve risk hesaplandı' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

