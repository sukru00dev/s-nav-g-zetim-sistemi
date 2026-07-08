const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/stats', authMiddleware, requireRole('Yönetici'), adminController.getDatabaseStats);
router.get('/logs', authMiddleware, requireRole('Yönetici'), adminController.getSystemLogs);

module.exports = router;
