const express = require('express');
const router = express.Router();
const biometricsController = require('../controllers/biometricsController');
const authMiddleware = require('../middleware/authMiddleware');

// Endpoint: POST /api/biometrics/log
router.post('/log', authMiddleware, biometricsController.logBiometrics);

module.exports = router;
