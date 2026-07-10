const express = require('express');
const router = express.Router({ mergeParams: true }); // examId'yi alabilmek için
const questionController = require('../controllers/questionController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, requireRole('Akademisyen', 'Yönetici'), questionController.createQuestion);
router.get('/', authMiddleware, questionController.getQuestionsByExam);

module.exports = router;
