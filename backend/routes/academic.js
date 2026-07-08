const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/dashboard', authMiddleware, requireRole('Akademisyen', 'Yönetici'), academicController.getDashboardStats);
router.get('/monitor', authMiddleware, requireRole('Akademisyen', 'Yönetici'), academicController.getLiveMonitorData);
// ExamBuilder için şube listesi — tüm authenticate edilmiş kullanıcılar erişebilir
router.get('/branches', authMiddleware, academicController.getBranches);
// Akademisyen için sınav sonuçları
router.get('/results', authMiddleware, requireRole('Akademisyen', 'Yönetici'), academicController.getAcademicResults);

// Ders & Şube Yönetimi
router.get('/courses', authMiddleware, requireRole('Akademisyen', 'Yönetici'), academicController.getCourses);
router.post('/courses', authMiddleware, requireRole('Akademisyen', 'Yönetici'), academicController.createCourse);
router.post('/branches', authMiddleware, requireRole('Akademisyen', 'Yönetici'), academicController.createBranch);
router.post('/branches/:branchId/enroll', authMiddleware, requireRole('Akademisyen', 'Yönetici'), academicController.enrollStudents);
router.get('/students', authMiddleware, requireRole('Akademisyen', 'Yönetici'), academicController.getStudentsList);

// Canlı Gözetim Oturum Kontrolleri
router.put('/sessions/:sessionId/status', authMiddleware, requireRole('Akademisyen', 'Yönetici'), academicController.updateSessionStatus);
router.post('/sessions/:sessionId/warn', authMiddleware, requireRole('Akademisyen', 'Yönetici'), academicController.warnSession);

module.exports = router;


