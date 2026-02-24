'use strict';

const express = require('express');
const { body, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const { requireAuth, requireVerified } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload, processAndSaveImage } = require('../services/imageUpload');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Strip the full pickup address from a tool for public browsing.
 * Only the street name portion is exposed.
 */
function maskAddress(tool) {
  const parts = tool.pickupPointAddress.split(',');
  // Street name is the first comma-separated part, e.g. "14 Elm Street"
  // We expose only the street name without the house number: "Elm Street"
  const streetParts = parts[0].trim().split(' ');
  const streetName = streetParts.slice(1).join(' ') || parts[0].trim();
  return { ...tool, pickupPointAddress: streetName, pickupPointNote: undefined };
}

// ─── GET /tools ───────────────────────────────────────────────────────────────
// Public — any visitor can browse
router.get(
  '/',
  [
    query('status').optional().isIn(['available', 'on_loan']),
    query('q').optional().isString().trim(),
    query('street').optional().isString().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { status, q, street } = req.query;

      const where = {};
      if (status) where.status = status;
      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }
      if (street) {
        where.pickupPointAddress = { contains: street, mode: 'insensitive' };
      }

      const tools = await prisma.tool.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true, averageRating: true } },
        },
      });

      // Mask full address for all results regardless of auth status
      const masked = tools.map(maskAddress);
      return res.json(masked);
    } catch (err) {
      return next(err);
    }
  }
);

// ─── GET /tools/:id ───────────────────────────────────────────────────────────
// Public — but only reveals full address if the requester has an accepted request
router.get('/:id', async (req, res, next) => {
  try {
    const tool = await prisma.tool.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true, averageRating: true } },
      },
    });

    // Check if the authenticated user has an accepted request for this tool
    let revealAddress = false;
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.access_token;

    if (authHeader || cookieToken) {
      const passport = require('passport');
      await new Promise((resolve) => {
        passport.authenticate('jwt', { session: false }, (_err, user) => {
          if (user) {
            req.user = user;
          }
          resolve();
        })(req, res, () => resolve());
      });

      if (req.user) {
        const accepted = await prisma.request.findFirst({
          where: {
            toolId: tool.id,
            borrowerId: req.user.id,
            status: 'accepted',
          },
        });
        revealAddress = !!accepted || req.user.id === tool.ownerId;
      }
    }

    return res.json(revealAddress ? tool : maskAddress(tool));
  } catch (err) {
    return next(err);
  }
});

// ─── POST /tools ──────────────────────────────────────────────────────────────
// Requires verified account
router.post(
  '/',
  requireVerified,
  upload.single('photo'),
  [
    body('name').trim().notEmpty().withMessage('Tool name is required.').isLength({ max: 100 }),
    body('description').trim().notEmpty().withMessage('Description is required.').isLength({ max: 1000 }),
    body('condition').isIn(['good', 'fair', 'worn']).withMessage('Condition must be good, fair, or worn.'),
    body('pickupPointAddress').trim().notEmpty().withMessage('Pick-up address is required.').isLength({ max: 500 }),
    body('pickupPointNote').optional().trim().isLength({ max: 200 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, description, condition, pickupPointAddress, pickupPointNote } = req.body;

      let photoUrl = null;
      if (req.file) {
        photoUrl = await processAndSaveImage(req.file.buffer);
      }

      const tool = await prisma.tool.create({
        data: {
          ownerId: req.user.id,
          name,
          description,
          condition,
          status: 'available',
          pickupPointAddress,
          pickupPointNote: pickupPointNote || null,
          photoUrl,
        },
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      return res.status(201).json(maskAddress(tool));
    } catch (err) {
      return next(err);
    }
  }
);

// ─── PATCH /tools/:id ─────────────────────────────────────────────────────────
router.patch(
  '/:id',
  requireVerified,
  upload.single('photo'),
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().trim().notEmpty().isLength({ max: 1000 }),
    body('condition').optional().isIn(['good', 'fair', 'worn']),
    body('pickupPointAddress').optional().trim().notEmpty().isLength({ max: 500 }),
    body('pickupPointNote').optional().trim().isLength({ max: 200 }),
    body('status').optional().isIn(['available', 'on_loan']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const tool = await prisma.tool.findUniqueOrThrow({ where: { id: req.params.id } });

      if (tool.ownerId !== req.user.id) {
        throw createError(403, 'You do not have permission to edit this listing.', 'FORBIDDEN');
      }

      const updates = {};
      const fields = ['name', 'description', 'condition', 'pickupPointAddress', 'pickupPointNote', 'status'];
      fields.forEach((f) => {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      });

      if (req.file) {
        updates.photoUrl = await processAndSaveImage(req.file.buffer);
      }

      const updated = await prisma.tool.update({
        where: { id: tool.id },
        data: updates,
        include: { owner: { select: { id: true, name: true, avatarUrl: true } } },
      });

      return res.json(maskAddress(updated));
    } catch (err) {
      return next(err);
    }
  }
);

// ─── DELETE /tools/:id ────────────────────────────────────────────────────────
router.delete('/:id', requireVerified, async (req, res, next) => {
  try {
    const tool = await prisma.tool.findUniqueOrThrow({ where: { id: req.params.id } });

    if (tool.ownerId !== req.user.id) {
      throw createError(403, 'You do not have permission to delete this listing.', 'FORBIDDEN');
    }

    await prisma.tool.delete({ where: { id: tool.id } });
    return res.json({ message: 'Listing deleted.' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
