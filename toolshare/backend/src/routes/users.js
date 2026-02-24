'use strict';

const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload, processAndSaveImage } = require('../services/imageUpload');
const { sendEmail } = require('../services/email');
const { createError } = require('../middleware/errorHandler');
const { clearAuthCookies } = require('../services/tokens');

const router = express.Router();
const prisma = new PrismaClient();

// ─── GET /users/:id ───────────────────────────────────────────────────────────
// Public profile
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        averageRating: true,
        createdAt: true,
        tools: {
          where: { status: 'available' },
          select: { id: true, name: true, condition: true, photoUrl: true },
        },
      },
    });

    return res.json(user);
  } catch (err) {
    return next(err);
  }
});

// ─── PATCH /users/me ──────────────────────────────────────────────────────────
// Update own profile
router.patch(
  '/me',
  requireAuth,
  upload.single('avatar'),
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('preferredLanguage').optional().isIn(['da', 'en']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.preferredLanguage) updates.preferredLanguage = req.body.preferredLanguage;
      if (req.file) updates.avatarUrl = await processAndSaveImage(req.file.buffer);

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: updates,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          preferredLanguage: true,
          avatarUrl: true,
          averageRating: true,
        },
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  }
);

// ─── DELETE /users/me ─────────────────────────────────────────────────────────
// Account deletion — GDPR right to erasure
// Cascade: tools deleted, requests cancelled, reviews anonymised
router.delete('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.$transaction(async (tx) => {
      // 1. Find active/pending requests where this user is borrower
      const activeBorrowerRequests = await tx.request.findMany({
        where: {
          borrowerId: userId,
          status: { in: ['pending', 'accepted', 'overdue'] },
        },
        include: { tool: { include: { owner: true } } },
      });

      // 2. Notify tool owners whose pending/active loans this user was part of
      for (const req of activeBorrowerRequests) {
        await sendEmail({
          to: req.tool.owner.email,
          lang: req.tool.owner.preferredLanguage,
          templateKey: 'requestCancelledByBorrower',
          templateArgs: [req.tool.owner.name, 'Account deleted', req.tool.name],
        });
      }

      // 3. Find tools owned by this user — notify borrowers with active requests
      const ownedTools = await tx.tool.findMany({
        where: { ownerId: userId },
        include: {
          requests: {
            where: { status: { in: ['pending', 'accepted', 'overdue'] } },
            include: { borrower: true },
          },
        },
      });

      for (const tool of ownedTools) {
        for (const request of tool.requests) {
          await sendEmail({
            to: request.borrower.email,
            lang: request.borrower.preferredLanguage,
            templateKey: 'lenderAccountDeleted',
            templateArgs: [request.borrower.name, tool.name],
          });
          await tx.request.update({
            where: { id: request.id },
            data: { status: 'cancelled' },
          });
        }
      }

      // 4. Anonymise reviews written by this user (don't delete — preserve community trust)
      await tx.review.updateMany({
        where: { reviewerId: userId },
        data: { reviewerDeleted: true },
      });

      // 5. Delete the user (cascade deletes tools and requests via Prisma schema)
      await tx.user.delete({ where: { id: userId } });
    });

    clearAuthCookies(res);
    return res.json({ message: 'Your account has been deleted.' });
  } catch (err) {
    return next(err);
  }
});

// ─── POST /users/me/download-data ─────────────────────────────────────────────
// GDPR right to access — generate a data export
router.post('/me/download-data', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        tools: true,
        borrowRequests: { include: { tool: { select: { name: true } } } },
        reviewsGiven: true,
        reviewsReceived: true,
        reportsSubmitted: true,
      },
    });

    // Remove sensitive internal fields before exporting
    const { passwordHash, verificationToken, resetToken, ...exportData } = user;
    void passwordHash; void verificationToken; void resetToken;

    // In a production system, write to a temp file and send a download link via email.
    // For v1, we write the JSON to a temp file and send the link.
    const exportDir = path.join(process.env.UPLOAD_DIR || 'uploads', 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const token = crypto.randomBytes(32).toString('hex');
    const filename = `${token}.json`;
    fs.writeFileSync(path.join(exportDir, filename), JSON.stringify(exportData, null, 2));

    const downloadLink = `${process.env.FRONTEND_URL}/data-export/${token}`;

    await sendEmail({
      to: user.email,
      lang: user.preferredLanguage,
      templateKey: 'dataDownloadReady',
      templateArgs: [user.name, downloadLink],
    });

    return res.json({ message: 'Your data export has been prepared. Check your email for the download link.' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
