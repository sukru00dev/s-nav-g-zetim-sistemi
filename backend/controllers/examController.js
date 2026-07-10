const prisma = require('../prismaClient');

exports.getAllExams = async (req, res) => {
    try {
        const whereClause = {};
        // Eğer kullanıcı Akademisyen ise sadece kendi sınavlarını görsün
        if (req.user && req.user.role === 'Akademisyen') {
            whereClause.teacherId = req.user.id;
        }

        const exams = await prisma.exam.findMany({
            where: whereClause,
            include: {
                branch: {
                    include: { 
                        course: true,
                        _count: { select: { users: true } } // Şubedeki öğrenci sayısı (beklenen katılım)
                    }
                },
                // ExamBuilder istatistik hesaplaması için oturumları dahil et
                examSessions: {
                    select: { id: true, status: true, userId: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(exams);
    } catch (error) {
        console.error('getAllExams error:', error);
        res.status(500).json({ message: 'Sınavlar getirilirken hata oluştu' });
    }
};

exports.getExamById = async (req, res) => {
    try {
        const examId = parseInt(req.params.id);
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                branch: {
                    include: { course: true }
                },
                questions: {
                    include: {
                        options: true
                    }
                }
            }
        });

        if (!exam) {
            return res.status(404).json({ message: 'Sınav bulunamadı' });
        }

        // Güvenlik: Öğrenci yetki ve zaman kontrolleri (Sınav sorularına sadece aktif sınav zamanında ve şubeye kayıtlıysa erişebilir)
        if (req.user && req.user.role === 'Öğrenci') {
            const student = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { branches: { select: { id: true } } }
            });
            const enrolledBranchIds = student?.branches.map(b => b.id) || [];
            
            if (enrolledBranchIds.length > 0 && !enrolledBranchIds.includes(exam.branchId)) {
                return res.status(403).json({ message: 'Bu sınavın şubesine kayıtlı değilsiniz.' });
            }

            const now = new Date();
            // 5 dakika tolerans payı verilerek öğrencilerin preflight işlemlerinde sorun yaşamasını önleyelim
            const startTimeWithTolerance = new Date(exam.startTime.getTime() - 5 * 60 * 1000);
            if (now < startTimeWithTolerance) {
                return res.status(403).json({ message: 'Sınav henüz başlamadı. Sınav sorularına erişemezsiniz.' });
            }
            if (now > exam.endTime) {
                return res.status(403).json({ message: 'Sınav süresi tamamlandı. Sorulara erişemezsiniz.' });
            }
        }

        // Güvenlik: Öğrenci rolündeki kullanıcılardan şıkların doğruluk bilgisini (isCorrect) gizle
        if (req.user && req.user.role === 'Öğrenci' && exam.questions) {
            exam.questions.forEach(question => {
                if (question.options) {
                    question.options.forEach(option => {
                        delete option.isCorrect;
                    });
                }
            });
        }

        res.json(exam);
    } catch (error) {
        res.status(500).json({ message: 'Sınav getirilirken hata oluştu' });
    }
};

exports.createExam = async (req, res) => {
    try {
        const { title, description, startTime, endTime, durationMin, isSupervised, branchId } = req.body;
        const teacherId = req.user.id;

        if (!title || !startTime || !branchId) {
            return res.status(400).json({ message: 'Başlık, başlangıç zamanı ve şube seçimi zorunludur' });
        }

        const parsedBranchId = parseInt(branchId);
        if (isNaN(parsedBranchId)) {
            return res.status(400).json({ message: 'Geçersiz şube ID\'si' });
        }

        const parsedDurationMin = parseInt(durationMin) || 60;

        const newExam = await prisma.exam.create({
            data: {
                title,
                description: description || 'Sistem üzerinden oluşturuldu',
                startTime: new Date(startTime),
                endTime: new Date(endTime || new Date(new Date(startTime).getTime() + parsedDurationMin * 60000)),
                durationMin: parsedDurationMin,
                isSupervised: isSupervised || false,
                branchId: parsedBranchId,
                teacherId
            }
        });

        res.status(201).json({ message: 'Sınav başarıyla oluşturuldu', exam: newExam });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sınav oluşturulurken hata oluştu' });
    }
};

// DELETE /api/exams/:id — Sınav ve bağlı tüm verileri sil
exports.deleteExam = async (req, res) => {
    try {
        const examId = parseInt(req.params.id);
        if (isNaN(examId)) {
            return res.status(400).json({ message: 'Geçersiz sınav ID\'si' });
        }

        const exam = await prisma.exam.findUnique({ where: { id: examId } });
        if (!exam) {
            return res.status(404).json({ message: 'Sınav bulunamadı' });
        }

        // Sadece sınavı oluşturan öğretmen silebilir (Akademisyen) veya Yönetici
        if (exam.teacherId !== req.user.id && req.user.role !== 'Yönetici') {
            return res.status(403).json({ message: 'Bu sınavı silme yetkiniz bulunmuyor' });
        }

        await prisma.exam.delete({ where: { id: examId } });
        res.json({ message: 'Sınav başarıyla silindi' });
    } catch (error) {
        console.error('deleteExam error:', error);
        res.status(500).json({ message: 'Sınav silinirken hata oluştu' });
    }
};
