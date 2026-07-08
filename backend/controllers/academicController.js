const prisma = require('../prismaClient');

// GET /api/academic/monitor
// Öğretmenin (Kendi) sınavlarına ait devam eden oturumları getirir
exports.getLiveMonitorData = async (req, res) => {
    try {
        const teacherId = req.user.id;

        // Önce öğretmene ait sınavları bulalım
        const teacherExams = await prisma.exam.findMany({
            where: { teacherId: teacherId },
            select: { id: true }
        });
        const examIds = teacherExams.map(e => e.id);

        // Sonra bu sınavlara ait ONGOING sessionları ve logları getirelim
        const liveSessions = await prisma.examSession.findMany({
            where: { 
                examId: { in: examIds },
                status: { in: ['ONGOING', 'SUSPENDED'] }
            },
            include: {
                user: { select: { forename: true, surname: true, tc_kimlik: true, photo: true } },
                exam: { select: { title: true } },
                logs: {
                    orderBy: { timestamp: 'desc' },
                    take: 5
                }
            },
            orderBy: { startTime: 'desc' }
        });

        res.json(liveSessions);
    } catch (error) {
        console.error("Error in getLiveMonitorData:", error);
        res.status(500).json({ message: 'Gözetim verileri getirilemedi' });
    }
};

// GET /api/academic/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const teacherId = req.user.id;
        
        const totalExams = await prisma.exam.count({ where: { teacherId } });
        
        const activeSessions = await prisma.examSession.count({
            where: { 
                exam: { teacherId },
                status: 'ONGOING'
            }
        });

        const recentLogs = await prisma.examLog.count({
            where: {
                session: { exam: { teacherId } },
                timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        });

        res.json({
            totalExams,
            activeSessions,
            recentLogs
        });
    } catch (error) {
        console.error("Error in academic getDashboardStats:", error);
        res.status(500).json({ message: 'İstatistikler getirilemedi' });
    }
};

// GET /api/academic/branches
// Öğretmenin şube (grup) listesini getir — ExamBuilder için
exports.getBranches = async (req, res) => {
    try {
        const branches = await prisma.branch.findMany({
            include: {
                course: {
                    select: { id: true, name: true, code: true }
                }
            },
            orderBy: { id: 'asc' }
        });
        res.json(branches);
    } catch (error) {
        console.error("Error in getBranches:", error);
        res.status(500).json({ message: 'Şube listesi getirilemedi' });
    }
};

// GET /api/academic/results
// Öğretmenin sınavlarına ait tüm oturumları ve öğrenci cevaplarını/loglarını getir
exports.getAcademicResults = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const exams = await prisma.exam.findMany({
            where: { teacherId },
            select: { id: true }
        });
        const examIds = exams.map(e => e.id);

        const sessions = await prisma.examSession.findMany({
            where: { examId: { in: examIds } },
            include: {
                user: {
                    select: {
                        id: true,
                        forename: true,
                        surname: true,
                        tc_kimlik: true,
                        photo: true,
                        email: true
                    }
                },
                exam: {
                    select: {
                        id: true,
                        title: true,
                        durationMin: true,
                        isSupervised: true,
                        branch: { select: { name: true } }
                    }
                },
                answers: {
                    include: {
                        question: { select: { text: true, type: true } },
                        option: { select: { text: true, isCorrect: true } }
                    }
                },
                logs: {
                    select: {
                        id: true,
                        type: true,
                        description: true,
                        timestamp: true
                    },
                    orderBy: { timestamp: 'desc' }
                }
            },
            orderBy: { startTime: 'desc' }
        });

        res.json(sessions);
    } catch (error) {
        console.error("Error in getAcademicResults:", error);
        res.status(500).json({ message: 'Öğrenci sonuçları getirilemedi' });
    }
};

// GET /api/academic/courses
exports.getCourses = async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                branches: {
                    include: {
                        _count: { select: { users: true } },
                        users: {
                            select: { id: true, forename: true, surname: true, tc_kimlik: true, email: true }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ders listesi getirilemedi' });
    }
};

// POST /api/academic/courses
exports.createCourse = async (req, res) => {
    try {
        const { name, code } = req.body;
        if (!name || !code) {
            return res.status(400).json({ message: 'Ders adı ve kodu zorunludur' });
        }

        let progId = 1;
        const defaultProgram = await prisma.program.findFirst({ select: { id: true } });
        if (defaultProgram) {
            progId = defaultProgram.id;
        }

        const newCourse = await prisma.course.create({
            data: {
                name,
                code,
                programId: progId
            }
        });
        res.status(201).json({ message: 'Ders başarıyla oluşturuldu', course: newCourse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ders oluşturulurken hata oluştu' });
    }
};

// POST /api/academic/branches
exports.createBranch = async (req, res) => {
    try {
        const { name, courseId } = req.body;
        if (!name || !courseId) {
            return res.status(400).json({ message: 'Şube adı ve Ders seçimi zorunludur' });
        }

        const newBranch = await prisma.branch.create({
            data: {
                name,
                courseId: parseInt(courseId)
            }
        });
        res.status(201).json({ message: 'Şube (Grup) başarıyla oluşturuldu', branch: newBranch });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Şube oluşturulurken hata oluştu' });
    }
};

// POST /api/academic/branches/:branchId/enroll
exports.enrollStudents = async (req, res) => {
    try {
        const branchId = parseInt(req.params.branchId);
        const { studentIds } = req.body; // array of integers

        if (!Array.isArray(studentIds)) {
            return res.status(400).json({ message: 'studentIds liste (array) şeklinde olmalıdır' });
        }

        // Önce şubeyi temizleyelim veya direkt bağlayalım.
        // Prisma connection güncellemesi
        await prisma.branch.update({
            where: { id: branchId },
            data: {
                users: {
                    set: studentIds.map(id => ({ id }))
                }
            }
        });

        res.json({ message: 'Öğrenciler şubeye başarıyla atandı' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Öğrenci ataması yapılırken hata oluştu' });
    }
};

// GET /api/academic/students
exports.getStudentsList = async (req, res) => {
    try {
        const students = await prisma.user.findMany({
            where: {
                role: { name_tr: 'Öğrenci' }
            },
            select: {
                id: true,
                forename: true,
                surname: true,
                tc_kimlik: true,
                email: true
            },
            orderBy: { forename: 'asc' }
        });
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Öğrenci listesi getirilemedi' });
    }
};

// PUT /api/academic/sessions/:sessionId/status
exports.updateSessionStatus = async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Durum bilgisi zorunludur' });
        }

        const session = await prisma.examSession.findUnique({
            where: { id: sessionId },
            include: { exam: true }
        });

        if (!session) {
            return res.status(404).json({ message: 'Oturum bulunamadı' });
        }

        if (session.exam.teacherId !== req.user.id && req.user.role !== 'Yönetici') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır.' });
        }

        const updated = await prisma.examSession.update({
            where: { id: sessionId },
            data: { status }
        });

        await prisma.examLog.create({
            data: {
                sessionId,
                type: 'SESSION_STATUS_CHANGED',
                description: `Akademisyen oturum durumunu güncelledi: ${status}`
            }
        });

        res.json({ message: 'Oturum durumu güncellendi', session: updated });
    } catch (error) {
        console.error("updateSessionStatus error:", error);
        res.status(500).json({ message: 'Oturum durumu güncellenirken hata oluştu' });
    }
};

// POST /api/academic/sessions/:sessionId/warn
exports.warnSession = async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Uyarı mesajı zorunludur' });
        }

        const session = await prisma.examSession.findUnique({
            where: { id: sessionId },
            include: { exam: true }
        });

        if (!session) {
            return res.status(404).json({ message: 'Oturum bulunamadı' });
        }

        if (session.exam.teacherId !== req.user.id && req.user.role !== 'Yönetici') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır.' });
        }

        const log = await prisma.examLog.create({
            data: {
                sessionId,
                type: 'WARNING_SENT',
                description: `Akademisyen uyarısı: "${message}"`
            }
        });

        res.status(201).json({ message: 'Uyarı başarıyla gönderildi', log });
    } catch (error) {
        console.error("warnSession error:", error);
        res.status(500).json({ message: 'Uyarı gönderilirken hata oluştu' });
    }
};


