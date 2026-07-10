const prisma = require('../prismaClient');

exports.createLog = async (req, res) => {
    try {
        const examId = parseInt(req.params.examId);
        const userId = req.user.id;
        const { type, description, photoUrl } = req.body;

        // Oturumu bul
        const session = await prisma.examSession.findFirst({
            where: { examId, userId, status: 'ONGOING' }
        });

        if (!session) {
            return res.status(404).json({ message: 'Aktif sınav oturumu bulunamadı' });
        }

        const log = await prisma.examLog.create({
            data: {
                sessionId: session.id,
                type,
                description,
                photoUrl
            }
        });

        res.status(201).json({ message: 'Gözetim logu kaydedildi', log });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Log kaydedilirken hata oluştu' });
    }
};

exports.getLogsByExam = async (req, res) => {
    try {
        const examId = parseInt(req.params.examId);
        
        const exam = await prisma.exam.findUnique({
            where: { id: examId }
        });
        if (!exam) return res.status(404).json({ message: 'Sınav bulunamadı' });

        // Güvenlik: Öğrenciler sınav gözetim loglarını göremez
        if (req.user && req.user.role === 'Öğrenci') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır.' });
        }

        if (req.user && req.user.role === 'Akademisyen' && exam.teacherId !== req.user.id) {
            return res.status(403).json({ message: 'Bu sınavın loglarına erişim yetkiniz bulunmamaktadır.' });
        }

        const sessions = await prisma.examSession.findMany({
            where: { examId },
            include: {
                user: {
                    select: { id: true, username: true, forename: true, surname: true }
                },
                logs: true
            }
        });

        res.json(sessions);
    } catch (error) {
        console.error('getLogsByExam error:', error);
        res.status(500).json({ message: 'Loglar getirilirken hata oluştu' });
    }
};
