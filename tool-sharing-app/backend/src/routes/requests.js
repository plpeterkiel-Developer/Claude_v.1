/**
 * routes/requests.js — borrow / return requests
 *
 * GET  /requests/mine             — requests I have made
 * GET  /requests/received         — requests made on my tools
 * POST /requests/tool/:toolId     — request to borrow a tool
 * PUT  /requests/:id              — owner: approve/reject | borrower: mark returned
 */

const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// ---------- my outgoing requests ----------

router.get('/mine', requireAuth, (req, res) => {
  const requests = db
    .prepare(
      `SELECT tr.*, t.name AS tool_name, u.name AS owner_name
       FROM tool_requests tr
       JOIN tools t ON t.id = tr.tool_id
       JOIN users u ON u.id = t.owner_id
       WHERE tr.requester_id = ?
       ORDER BY tr.created_at DESC`
    )
    .all(req.user.id);
  res.json(requests);
});

// ---------- incoming requests for my tools ----------

router.get('/received', requireAuth, (req, res) => {
  const requests = db
    .prepare(
      `SELECT tr.*, t.name AS tool_name, u.name AS requester_name
       FROM tool_requests tr
       JOIN tools t ON t.id = tr.tool_id
       JOIN users u ON u.id = tr.requester_id
       WHERE t.owner_id = ?
       ORDER BY tr.created_at DESC`
    )
    .all(req.user.id);
  res.json(requests);
});

// ---------- request to borrow ----------

router.post('/tool/:toolId', requireAuth, (req, res) => {
  const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.toolId);

  if (!tool) {
    return res.status(404).json({ error: 'Tool not found.' });
  }
  if (!tool.available) {
    return res.status(409).json({ error: 'This tool is not currently available.' });
  }
  if (tool.owner_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot request your own tool.' });
  }

  const duplicate = db
    .prepare(
      `SELECT id FROM tool_requests
       WHERE tool_id = ? AND requester_id = ? AND status = 'pending'`
    )
    .get(req.params.toolId, req.user.id);

  if (duplicate) {
    return res.status(409).json({ error: 'You already have a pending request for this tool.' });
  }

  const { message } = req.body;
  const result = db
    .prepare('INSERT INTO tool_requests (tool_id, requester_id, message) VALUES (?, ?, ?)')
    .run(req.params.toolId, req.user.id, message ?? '');

  const request = db.prepare('SELECT * FROM tool_requests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(request);
});

// ---------- update request status ----------

router.put('/:id', requireAuth, (req, res) => {
  const request = db
    .prepare(
      `SELECT tr.*, t.owner_id
       FROM tool_requests tr
       JOIN tools t ON t.id = tr.tool_id
       WHERE tr.id = ?`
    )
    .get(req.params.id);

  if (!request) return res.status(404).json({ error: 'Request not found.' });

  const isOwner     = request.owner_id     === req.user.id;
  const isRequester = request.requester_id === req.user.id;

  if (!isOwner && !isRequester) {
    return res.status(403).json({ error: 'This request does not belong to you.' });
  }

  const { status } = req.body;

  // Only certain transitions are allowed depending on role
  const ownerAllowed     = ['approved', 'rejected'];
  const requesterAllowed = ['returned'];

  const allowed = isOwner ? ownerAllowed : requesterAllowed;

  if (!allowed.includes(status)) {
    return res.status(400).json({
      error: `Cannot set status to '${status}'. Allowed values: ${allowed.join(', ')}.`,
    });
  }

  db.prepare(
    `UPDATE tool_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(status, req.params.id);

  // Keep tool availability in sync with request status
  if (status === 'approved') {
    db.prepare('UPDATE tools SET available = 0 WHERE id = ?').run(request.tool_id);
  } else if (status === 'returned' || status === 'rejected') {
    db.prepare('UPDATE tools SET available = 1 WHERE id = ?').run(request.tool_id);
  }

  const updated = db.prepare('SELECT * FROM tool_requests WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
