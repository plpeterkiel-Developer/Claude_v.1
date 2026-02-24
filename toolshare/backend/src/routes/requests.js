'use strict';

const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const { requireAuth, requireVerified } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sendEmail } = require('../services/email');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// ─── POST /requests ───────────────────────────────────────────────────────────
// Send a borrow request. Verified account required.
router.post(
  '/',
  requireVerified,
  [
    body('toolId').notEmpty().withMessage('Tool ID is required.'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date.'),
    body('endDate')
      .isISO8601()
      .withMessage('End date must be a valid date.')
      .custom((endDate, { req }) => {
        if (new Date(endDate) <= new Date(req.body.startDate)) {
          throw new Error('End date must be after start date.');
        }
        return true;
      }),
    body('message').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { toolId, startDate, endDate, message } = req.body;

      const tool = await prisma.tool.findUniqueOrThrow({
        where: { id: toolId },
        include: { owner: true },
      });

      if (tool.ownerId === req.user.id) {
        throw createError(400, 'You cannot borrow your own tool.', 'OWN_TOOL');
      }

      if (tool.status !== 'available') {
        throw createError(409, 'This tool is not currently available.', 'TOOL_UNAVAILABLE');
      }

      // Check if user already has a pending request for this tool
      const existing = await prisma.request.findFirst({
        where: { toolId, borrowerId: req.user.id, status: 'pending' },
      });
      if (existing) {
        throw createError(409, 'You already have a pending request for this tool.', 'DUPLICATE_REQUEST');
      }

      const request = await prisma.request.create({
        data: {
          toolId,
          borrowerId: req.user.id,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          message: message || null,
          status: 'pending',
        },
      });

      const lang = tool.owner.preferredLanguage;
      const fmt = (d) =>
        new Date(d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'da-DK');
      const actionLink = `${process.env.FRONTEND_URL}/dashboard/requests/${request.id}`;

      await sendEmail({
        to: tool.owner.email,
        lang,
        templateKey: 'borrowRequestReceived',
        templateArgs: [
          tool.owner.name,
          req.user.name,
          tool.name,
          fmt(startDate),
          fmt(endDate),
          message || '',
          actionLink,
        ],
      });

      return res.status(201).json(request);
    } catch (err) {
      return next(err);
    }
  }
);

// ─── GET /requests ────────────────────────────────────────────────────────────
// Returns requests relevant to the current user (as borrower or as tool owner)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { role } = req.query; // 'borrower' | 'owner'

    let where;
    if (role === 'borrower') {
      where = { borrowerId: req.user.id };
    } else if (role === 'owner') {
      where = { tool: { ownerId: req.user.id } };
    } else {
      where = {
        OR: [{ borrowerId: req.user.id }, { tool: { ownerId: req.user.id } }],
      };
    }

    const requests = await prisma.request.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
            ownerId: true,
            owner: { select: { id: true, name: true } },
          },
        },
        borrower: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Only reveal full pickup address on accepted requests
    const enriched = requests.map((r) => {
      const isOwner = r.tool.ownerId === req.user.id;
      const isBorrower = r.borrowerId === req.user.id;
      const reveal = (isOwner || isBorrower) && r.status === 'accepted';
      if (!reveal) {
        return { ...r, tool: { ...r.tool, pickupPointAddress: undefined } };
      }
      return r;
    });

    return res.json(enriched);
  } catch (err) {
    return next(err);
  }
});

// ─── PATCH /requests/:id ──────────────────────────────────────────────────────
// Update request status: accept | decline | cancel | return
router.patch(
  '/:id',
  requireAuth,
  [
    body('action')
      .isIn(['accept', 'decline', 'cancel', 'return'])
      .withMessage('Action must be accept, decline, cancel, or return.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { action } = req.body;

      const request = await prisma.request.findUniqueOrThrow({
        where: { id: req.params.id },
        include: {
          tool: { include: { owner: true } },
          borrower: true,
        },
      });

      const isOwner = request.tool.ownerId === req.user.id;
      const isBorrower = request.borrowerId === req.user.id;

      // ── Accept ──────────────────────────────────────────────────────────────
      if (action === 'accept') {
        if (!isOwner) throw createError(403, 'Only the tool owner can accept a request.', 'FORBIDDEN');
        if (request.status !== 'pending') {
          throw createError(400, 'Only pending requests can be accepted.', 'INVALID_STATE');
        }

        await prisma.$transaction([
          prisma.request.update({ where: { id: request.id }, data: { status: 'accepted' } }),
          prisma.tool.update({ where: { id: request.toolId }, data: { status: 'on_loan' } }),
        ]);

        const lang = request.borrower.preferredLanguage;
        const fmt = (d) => new Date(d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'da-DK');

        await sendEmail({
          to: request.borrower.email,
          lang,
          templateKey: 'requestAccepted',
          templateArgs: [
            request.borrower.name,
            request.tool.name,
            fmt(request.startDate),
            fmt(request.endDate),
            request.tool.pickupPointAddress,
            request.tool.pickupPointNote,
          ],
        });
      }

      // ── Decline ─────────────────────────────────────────────────────────────
      else if (action === 'decline') {
        if (!isOwner) throw createError(403, 'Only the tool owner can decline a request.', 'FORBIDDEN');
        if (request.status !== 'pending') {
          throw createError(400, 'Only pending requests can be declined.', 'INVALID_STATE');
        }

        await prisma.request.update({ where: { id: request.id }, data: { status: 'declined' } });

        await sendEmail({
          to: request.borrower.email,
          lang: request.borrower.preferredLanguage,
          templateKey: 'requestDeclined',
          templateArgs: [request.borrower.name, request.tool.name],
        });
      }

      // ── Cancel ──────────────────────────────────────────────────────────────
      else if (action === 'cancel') {
        if (!isBorrower) throw createError(403, 'Only the borrower can cancel a request.', 'FORBIDDEN');
        if (request.status !== 'pending') {
          throw createError(400, 'Only pending requests can be cancelled by the borrower.', 'INVALID_STATE');
        }

        await prisma.request.update({ where: { id: request.id }, data: { status: 'cancelled' } });

        await sendEmail({
          to: request.tool.owner.email,
          lang: request.tool.owner.preferredLanguage,
          templateKey: 'requestCancelledByBorrower',
          templateArgs: [request.tool.owner.name, request.borrower.name, request.tool.name],
        });
      }

      // ── Return ──────────────────────────────────────────────────────────────
      else if (action === 'return') {
        if (!isOwner && !isBorrower) {
          throw createError(403, 'Only the owner or borrower can mark a loan as returned.', 'FORBIDDEN');
        }
        if (!['accepted', 'overdue'].includes(request.status)) {
          throw createError(400, 'Only active or overdue loans can be marked as returned.', 'INVALID_STATE');
        }

        await prisma.$transaction([
          prisma.request.update({ where: { id: request.id }, data: { status: 'returned' } }),
          prisma.tool.update({ where: { id: request.toolId }, data: { status: 'available' } }),
        ]);

        const reviewLink = `${process.env.FRONTEND_URL}/reviews/new/${request.id}`;
        const fmt = (lang) => (d) => new Date(d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'da-DK');

        await Promise.all([
          sendEmail({
            to: request.tool.owner.email,
            lang: request.tool.owner.preferredLanguage,
            templateKey: 'loanReturned',
            templateArgs: [request.tool.owner.name, request.tool.name, reviewLink],
          }),
          sendEmail({
            to: request.borrower.email,
            lang: request.borrower.preferredLanguage,
            templateKey: 'loanReturned',
            templateArgs: [request.borrower.name, request.tool.name, reviewLink],
          }),
        ]);

        void fmt; // suppress lint warning — fmt defined for clarity but emails use template
      }

      const updated = await prisma.request.findUnique({ where: { id: request.id } });
      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
