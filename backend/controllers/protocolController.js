const prisma = require('../prismaClient');

// GET /api/protocol/stats
exports.getDashboardStats = async (req, res) => {
    try {
        const studentCount = await prisma.user.count({ where: { role: { name_tr: 'Öğrenci' } } });
        const teacherCount = await prisma.user.count({ where: { role: { name_tr: 'Akademisyen' } } });
        const activeExams = await prisma.examSession.count({ where: { status: 'ONGOING' } });
        const recentViolations = await prisma.examLog.count({
            where: {
                timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        });

        res.json({
            studentCount,
            teacherCount,
            activeExams,
            recentViolations
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Dashboard istatistikleri getirilemedi' });
    }
};

// GET /api/protocol/analytics
exports.getAnalytics = async (req, res) => {
    try {
        const universities = await prisma.university.findMany({
            include: {
                unities: {
                    include: {
                        departments: {
                            include: { programs: true }
                        }
                    }
                }
            }
        });
        res.json(universities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Analitik verileri getirilemedi' });
    }
};

// GET /api/protocol/live
exports.getLiveExams = async (req, res) => {
    try {
        const liveSessions = await prisma.examSession.findMany({
            where: { status: 'ONGOING' },
            include: {
                user: { select: { forename: true, surname: true, tc_kimlik: true } },
                exam: { select: { title: true, branch: { select: { course: { select: { name: true } } } } } },
                _count: { select: { logs: true } }
            },
            orderBy: { startTime: 'desc' }
        });
        res.json(liveSessions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Canlı sınavlar getirilemedi' });
    }
};

// GET /api/protocol/security
exports.getSecurityReports = async (req, res) => {
    try {
        const violationLogs = await prisma.examLog.findMany({
            where: { type: { not: 'INFO' } }, // INFO hariç ihlalleri getir (eğer böyle bir mantık varsa, şimdilik tüm loglar)
            include: {
                session: {
                    include: {
                        user: { select: { forename: true, surname: true, tc_kimlik: true } },
                        exam: { select: { title: true } }
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 100
        });
        res.json(violationLogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Güvenlik raporları getirilemedi' });
    }
};
