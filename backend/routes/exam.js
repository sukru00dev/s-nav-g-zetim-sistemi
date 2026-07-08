const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, examController.getAllExams);
router.get('/session/:sessionId', authMiddleware, sessionController.getSessionById);
router.put('/session/:sessionId/frame', authMiddleware, sessionController.updateSessionFrame);
router.get('/:id', authMiddleware, examController.getExamById);
router.post('/', authMiddleware, requireRole('Akademisyen', 'Yönetici'), examController.createExam);
router.delete('/:id', authMiddleware, requireRole('Akademisyen', 'Yönetici'), examController.deleteExam);

module.exports = router;

