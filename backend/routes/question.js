const express = require('express');
const router = express.Router({ mergeParams: true }); // examId'yi alabilmek için
const questionController = require('../controllers/questionController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, questionController.createQuestion);
router.get('/', authMiddleware, questionController.getQuestionsByExam);

module.exports = router;
