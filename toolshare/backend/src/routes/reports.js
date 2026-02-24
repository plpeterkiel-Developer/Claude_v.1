'use strict';

const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sendEmail } = require('../services/email');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// ─── POST /reports ────────────────────────────────────────────────────────────
// Any logged-in user can report a listing or review.
router.post(
  '/',
  requireAuth,
  [
    body('targetType').isIn(['listing', 'review']).withMessage('Target type must be listing or review.'),
    body('targetId').notEmpty().withMessage('Target ID is required.'),
    body('reason').trim().notEmpty().withMessage('Reason is required.').isLength({ max: 1000 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { targetType, targetId, reason } = req.body;

      // Verify the target exists
      if (targetType === 'listing') {
        await prisma.tool.findUniqueOrThrow({ where: { id: targetId } });
      } else {
        await prisma.review.findUniqueOrThrow({ where: { id: targetId } });
      }

      const report = await prisma.report.create({
        data: {
          reporterId: req.user.id,
          targetType,
          targetId,
          reason,
          status: 'pending',
        },
      });

      return res.status(201).json(report);
    } catch (err) {
      return next(err);
    }
  }
);

// ─── GET /reports ─────────────────────────────────────────────────────────────
// Admin-only: list all pending reports.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    // Basic admin check — in production, extend with a proper role field
    // For v1, we check for a designated admin email from env
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || req.user.email !== adminEmail) {
      throw createError(403, 'Admin access required.', 'FORBIDDEN');
    }

    const { status } = req.query;
    const where = status ? { status } : {};

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        resolver: { select: { id: true, name: true } },
      },
    });

    return res.json(reports);
  } catch (err) {
    return next(err);
  }
});

// ─── PATCH /reports/:id ───────────────────────────────────────────────────────
// Admin resolves a report: warn | remove | dismiss | suspend
router.patch(
  '/:id',
  requireAuth,
  [
    body('action')
      .isIn(['warn', 'remove', 'dismiss', 'suspend'])
      .withMessage('Action must be warn, remove, dismiss, or suspend.'),
    body('reason').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail || req.user.email !== adminEmail) {
        throw createError(403, 'Admin access required.', 'FORBIDDEN');
      }

      const { action, reason } = req.body;

      const report = await prisma.report.findUniqueOrThrow({ where: { id: req.params.id } });

      if (report.status !== 'pending') {
        throw createError(400, 'This report has already been resolved.', 'ALREADY_RESOLVED');
      }

      let newStatus;
      let targetUser = null;

      if (action === 'warn') {
        newStatus = 'warned';

        // Find the user who owns the target content
        if (report.targetType === 'listing') {
          const tool = await prisma.tool.findUnique({ where: { id: report.targetId }, include: { owner: true } });
          targetUser = tool?.owner;
          if (targetUser) {
            await prisma.user.update({
              where: { id: targetUser.id },
              data: { warningCount: { increment: 1 } },
            });
          }
        } else {
          const review = await prisma.review.findUnique({ where: { id: report.targetId }, include: { reviewer: true } });
          targetUser = review?.reviewer;
          if (targetUser) {
            await prisma.user.update({
              where: { id: targetUser.id },
              data: { warningCount: { increment: 1 } },
            });
          }
        }

        if (targetUser) {
          await sendEmail({
            to: targetUser.email,
            lang: targetUser.preferredLanguage,
            templateKey: 'warning',
            templateArgs: [targetUser.name, reason || 'Violation of community guidelines.'],
          });
        }
      } else if (action === 'remove') {
        newStatus = 'removed';

        if (report.targetType === 'listing') {
          await prisma.tool.delete({ where: { id: report.targetId } });
        } else {
          await prisma.review.update({
            where: { id: report.targetId },
            data: { isRemoved: true },
          });
        }
      } else if (action === 'suspend') {
        newStatus = 'removed';

        if (report.targetType === 'listing') {
          const tool = await prisma.tool.findUnique({ where: { id: report.targetId }, include: { owner: true } });
          targetUser = tool?.owner;
        } else {
          const review = await prisma.review.findUnique({ where: { id: report.targetId }, include: { reviewer: true } });
          targetUser = review?.reviewer;
        }

        if (targetUser) {
          await prisma.user.update({
            where: { id: targetUser.id },
            data: { isSuspended: true },
          });

          await sendEmail({
            to: targetUser.email,
            lang: targetUser.preferredLanguage,
            templateKey: 'suspended',
            templateArgs: [targetUser.name, reason || 'Major violation of community guidelines.'],
          });
        }
      } else {
        // dismiss
        newStatus = 'dismissed';
      }

      const updated = await prisma.report.update({
        where: { id: report.id },
        data: { status: newStatus, resolvedBy: req.user.id },
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
