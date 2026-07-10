const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 dakika
  max: 50, // Test ve normal kullanımda tıkanmayı önlemek için 50'ye çıkarıldı
  keyGenerator: (req) => {
    // Ortak proxy/VPN arkasındaki kullanıcıların birbirini engellemesini önlemek için IP + E-posta kombinasyonu kullanılır
    return `${req.ip}_${req.body?.email || ''}`;
  },
  validate: { keygenerator: false },
  message: { message: "Çok fazla giriş denemesi yaptınız. Lütfen 10 dakika sonra tekrar deneyin." }
});


router.post('/login', loginLimiter, authController.login);
router.post('/register', authController.register);
router.post('/verify-tc', authController.verifyTc);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-code', authController.verifyCode);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
