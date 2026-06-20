const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const env = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const interviewRoutes = require('./routes/interviews');
const companyRoutes = require('./routes/companies');
const uploadRoutes = require('./routes/upload');

// Multer config for resume uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  },
});

const app = express();

// ── Security ──────────────────────────────────────────────────────
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting - increase limit to 300 per window and skip for authenticated health checks
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX * 3, // Increase to 300 requests per window
  message: { detail: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/upload', uploadRoutes);

// ── 404 & Error handling ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;