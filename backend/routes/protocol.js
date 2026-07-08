const express = require('express');
const router = express.Router();
const protocolController = require('../controllers/protocolController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/stats', authMiddleware, requireRole('Protokol', 'Yönetici'), protocolController.getDashboardStats);
router.get('/analytics', authMiddleware, requireRole('Protokol', 'Yönetici'), protocolController.getAnalytics);
router.get('/live', authMiddleware, requireRole('Protokol', 'Yönetici'), protocolController.getLiveExams);
router.get('/security', authMiddleware, requireRole('Protokol', 'Yönetici'), protocolController.getSecurityReports);

module.exports = router;
