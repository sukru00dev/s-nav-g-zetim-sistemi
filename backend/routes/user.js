const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/',          authMiddleware, requireRole('Yönetici', 'Akademisyen'), userController.getAllUsers);
router.get('/me/exams',  authMiddleware, userController.getMyExams);
router.get('/me/sessions', authMiddleware, userController.getMySessions);
router.get('/:id',       authMiddleware, userController.getUserById);
router.put('/me',        authMiddleware, userController.updateMe);
router.delete('/:id',    authMiddleware, requireRole('Yönetici'), userController.deleteUser);

module.exports = router;

