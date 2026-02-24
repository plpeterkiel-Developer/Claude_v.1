'use strict';

const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// ─── POST /reviews ────────────────────────────────────────────────────────────
// Submit a review after a completed loan.
router.post(
  '/',
  requireAuth,
  [
    body('requestId').notEmpty().withMessage('Request ID is required.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
    body('comment').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { requestId, rating, comment } = req.body;

      const request = await prisma.request.findUniqueOrThrow({
        where: { id: requestId },
        include: { tool: true, borrower: true },
      });

      if (request.status !== 'returned') {
        throw createError(400, 'Reviews can only be submitted after a loan is marked as returned.', 'INVALID_STATE');
      }

      const isOwner = request.tool.ownerId === req.user.id;
      const isBorrower = request.borrowerId === req.user.id;

      if (!isOwner && !isBorrower) {
        throw createError(403, 'You were not part of this loan.', 'FORBIDDEN');
      }

      // The reviewer reviews the OTHER party
      const revieweeId = isOwner ? request.borrowerId : request.tool.ownerId;

      // Prevent duplicate reviews
      const existing = await prisma.review.findUnique({
        where: { reviewerId_requestId: { reviewerId: req.user.id, requestId } },
      });
      if (existing) {
        throw createError(409, 'You have already submitted a review for this loan.', 'DUPLICATE_REVIEW');
      }

      const review = await prisma.review.create({
        data: {
          reviewerId: req.user.id,
          revieweeId,
          requestId,
          rating,
          comment: comment || null,
        },
      });

      // Recalculate average rating for the reviewee
      const allRatings = await prisma.review.findMany({
        where: { revieweeId, isRemoved: false },
        select: { rating: true },
      });
      const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      await prisma.user.update({
        where: { id: revieweeId },
        data: { averageRating: Math.round(avg * 10) / 10 },
      });

      return res.status(201).json(review);
    } catch (err) {
      return next(err);
    }
  }
);

// ─── GET /reviews/user/:userId ────────────────────────────────────────────────
// Get all reviews for a specific user (public profile).
router.get('/user/:userId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: req.params.userId, isRemoved: false },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Anonymise reviews from deleted accounts
    const sanitised = reviews.map((r) => {
      if (r.reviewerDeleted) {
        return { ...r, reviewer: { id: null, name: 'Account deleted', avatarUrl: null } };
      }
      return r;
    });

    return res.json(sanitised);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
