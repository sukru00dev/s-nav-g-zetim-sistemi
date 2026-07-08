const express = require('express');
const router = express.Router({ mergeParams: true });
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/start', authMiddleware, sessionController.startSession);
router.post('/answers', authMiddleware, sessionController.submitAnswer);
router.post('/answer', authMiddleware, sessionController.submitAnswer);
router.post('/submit', authMiddleware, sessionController.endSession);
router.post('/end', authMiddleware, sessionController.endSession);

module.exports = router;
