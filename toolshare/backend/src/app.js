'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

const authRoutes = require('./routes/auth');
const toolsRoutes = require('./routes/tools');
const requestsRoutes = require('./routes/requests');
const reviewsRoutes = require('./routes/reviews');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const { errorHandler } = require('./middleware/errorHandler');
const { startScheduler } = require('./services/scheduler');

require('./config/passport');

const app = express();

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ─── Body parsing ────────────────────────────────────────────────────────────
// Cap request bodies at 10kb (excluding file uploads handled separately)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Passport ────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ─── Rate limiting ───────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: true, message: 'Too many login attempts. Please try again later.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ─── Static uploads ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(process.env.UPLOAD_DIR || 'uploads'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/auth', loginLimiter, authRoutes);
app.use('/tools', toolsRoutes);
app.use('/requests', requestsRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/reports', reportsRoutes);
app.use('/users', usersRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: true, message: 'Not found', code: 'NOT_FOUND' });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.warn(`ToolShare API running on port ${PORT}`);
    startScheduler();
  });
}

module.exports = app;
