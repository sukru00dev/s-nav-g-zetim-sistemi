const express = require('express');
const router = express.Router({ mergeParams: true });
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, logController.createLog);
router.get('/', authMiddleware, logController.getLogsByExam);

module.exports = router;
