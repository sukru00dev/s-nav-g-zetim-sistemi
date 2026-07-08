const prisma = require('../prismaClient');

// GET /api/admin/stats
exports.getDatabaseStats = async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        const examCount = await prisma.exam.count();
        const sessionCount = await prisma.examSession.count();
        const logCount = await prisma.examLog.count();
        const universityCount = await prisma.university.count();
        
        res.json({
            userCount,
            examCount,
            sessionCount,
            logCount,
            universityCount
        });
    } catch (error) {
        console.error("Error in getDatabaseStats:", error);
        res.status(500).json({ message: 'İstatistikler getirilirken hata oluştu' });
    }
};

// GET /api/admin/logs
exports.getSystemLogs = async (req, res) => {
    try {
        // En son 50 sistem logunu getir (ExamLog tablosunu kullanıyoruz)
        const logs = await prisma.examLog.findMany({
            take: 50,
            orderBy: { timestamp: 'desc' },
            include: {
                session: {
                    include: {
                        user: { select: { forename: true, surname: true, tc_kimlik: true } },
                        exam: { select: { title: true } }
                    }
                }
            }
        });
        res.json(logs);
    } catch (error) {
        console.error("Error in getSystemLogs:", error);
        res.status(500).json({ message: 'Loglar getirilirken hata oluştu' });
    }
};
