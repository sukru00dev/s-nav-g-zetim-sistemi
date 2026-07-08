const prisma = require('../prismaClient');

exports.createQuestion = async (req, res) => {
    try {
        const examId = parseInt(req.params.examId);
        const { text, type, options } = req.body;

        if (!text || !type) {
            return res.status(400).json({ message: 'Soru metni ve tipi zorunludur.' });
        }

        const question = await prisma.question.create({
            data: {
                text,
                type,
                examId,
                options: options ? {
                    create: options.map(opt => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect || false
                    }))
                } : undefined
            },
            include: {
                options: true
            }
        });

        res.status(201).json({ message: 'Soru başarıyla oluşturuldu', question });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Soru oluşturulurken hata meydana geldi' });
    }
};

exports.getQuestionsByExam = async (req, res) => {
    try {
        const examId = parseInt(req.params.examId);
        
        // Güvenlik gereği öğrenciye isCorrect dönülmez, sadece Akademisyen/Yöneticiler görebilir
        const showCorrect = req.user && req.user.role !== 'Öğrenci';

        const questions = await prisma.question.findMany({
            where: { examId },
            include: {
                options: {
                    select: {
                        id: true,
                        text: true,
                        isCorrect: showCorrect
                    }
                }
            }
        });

        res.json(questions);
    } catch (error) {
        console.error('getQuestionsByExam error:', error);
        res.status(500).json({ message: 'Sorular getirilirken hata oluştu' });
    }
};
