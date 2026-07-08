require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────

// CORS: Sadece izin verilen origin'e izin ver (production güvenliği)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS politikası: Bu origin izinli değil.'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.set('trust proxy', 1);

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const examRoutes      = require('./routes/exam');
const userRoutes      = require('./routes/user');
const questionRoutes  = require('./routes/question');
const sessionRoutes   = require('./routes/session');
const logRoutes       = require('./routes/log');
const adminRoutes     = require('./routes/admin');
const protocolRoutes  = require('./routes/protocol');
const academicRoutes  = require('./routes/academic');
const biometricsRoutes = require('./routes/biometrics');

// Auth rotaları (login'in kendi rate limiter'i var)
app.use('/api/auth', authRoutes);

app.use('/api/users',      userRoutes);
app.use('/api/exams',      examRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/protocol',   protocolRoutes);
app.use('/api/academic',   academicRoutes);
app.use('/api/biometrics', biometricsRoutes);

// Sınav altındaki iç içe (nested) rotalar
app.use('/api/exams/:examId/questions', questionRoutes);
app.use('/api/exams/:examId/session',   sessionRoutes);
app.use('/api/exams/:examId/logs',      logRoutes);

// Ping endpoint — ExamRoom preflight bağlantı kontrolü için
app.get('/api/ping', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static frontend files (Single-Server deployment)
const path = require('path');
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// API routes are defined above. Any non-API request falls back to serving React SPA index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`\n🚀 LEUKOLION API: http://localhost:${port}`);
});

