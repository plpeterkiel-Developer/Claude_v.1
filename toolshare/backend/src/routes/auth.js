'use strict';

const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcrypt');
const passport = require('passport');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { setAuthCookies, clearAuthCookies, verifyRefreshToken, signAccessToken } = require('../services/tokens');
const { sendEmail } = require('../services/email');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
    body('email').isEmail().withMessage('A valid email address is required.').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter.')
      .matches(/\d/)
      .withMessage('Password must contain at least one number.'),
    body('preferredLanguage').optional().isIn(['da', 'en']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, preferredLanguage = 'da' } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw createError(409, 'An account with that email address already exists.', 'EMAIL_TAKEN');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          authProvider: 'local',
          emailVerified: false,
          verificationToken,
          preferredLanguage,
        },
      });

      const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await sendEmail({
        to: email,
        lang: preferredLanguage,
        templateKey: 'verifyEmail',
        templateArgs: [name, verifyLink],
      });

      return res.status(201).json({
        message: 'Account created. Please check your email to verify your address.',
        userId: user.id,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// ─── POST /auth/verify-email ──────────────────────────────────────────────────
router.post(
  '/verify-email',
  [body('token').notEmpty().withMessage('Verification token is required.')],
  validate,
  async (req, res, next) => {
    try {
      const { token } = req.body;

      const user = await prisma.user.findUnique({ where: { verificationToken: token } });
      if (!user) {
        throw createError(400, 'Invalid or expired verification token.', 'INVALID_TOKEN');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verificationToken: null },
      });

      return res.json({ message: 'Email address verified successfully.' });
    } catch (err) {
      return next(err);
    }
  }
);

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
          error: true,
          message: info?.message || 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        });
      }

      setAuthCookies(res, user.id);

      return res.json({
        message: 'Logged in successfully.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          preferredLanguage: user.preferredLanguage,
          avatarUrl: user.avatarUrl,
        },
      });
    })(req, res, next);
  }
);

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/logout', requireAuth, (req, res) => {
  clearAuthCookies(res);
  return res.json({ message: 'Logged out successfully.' });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) throw createError(401, 'No refresh token.', 'UNAUTHORISED');

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isSuspended) throw createError(401, 'Unauthorised.', 'UNAUTHORISED');

    const newAccessToken = signAccessToken(user.id);
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ message: 'Token refreshed.' });
  } catch (err) {
    return next(err);
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const { id, name, email, emailVerified, preferredLanguage, avatarUrl, averageRating, warningCount, isSuspended } =
    req.user;
  return res.json({ id, name, email, emailVerified, preferredLanguage, avatarUrl, averageRating, warningCount, isSuspended });
});

// ─── GET /auth/google ─────────────────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth` }),
  (req, res) => {
    setAuthCookies(res, req.user.id);
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// ─── GET /auth/facebook ───────────────────────────────────────────────────────
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth` }),
  (req, res) => {
    setAuthCookies(res, req.user.id);
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

module.exports = router;
