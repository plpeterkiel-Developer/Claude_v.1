/**
 * routes/tools.js — CRUD for gardening tools
 *
 * GET    /tools        — list all available tools (public)
 * GET    /tools/mine   — list my tools (auth required)
 * GET    /tools/:id    — get one tool (public)
 * POST   /tools        — add a tool (auth required)
 * PUT    /tools/:id    — update my tool (auth required, owner only)
 * DELETE /tools/:id    — delete my tool (auth required, owner only)
 */

const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// ---------- list available tools ----------

router.get('/', (req, res) => {
  const tools = db
    .prepare(
      `SELECT t.*, u.name AS owner_name
       FROM tools t
       JOIN users u ON u.id = t.owner_id
       WHERE t.available = 1
       ORDER BY t.created_at DESC`
    )
    .all();
  res.json(tools);
});

// ---------- my tools ----------
// NOTE: /mine must come before /:id so Express doesn't treat "mine" as an id

router.get('/mine', requireAuth, (req, res) => {
  const tools = db
    .prepare('SELECT * FROM tools WHERE owner_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(tools);
});

// ---------- single tool ----------

router.get('/:id', (req, res) => {
  const tool = db
    .prepare(
      `SELECT t.*, u.name AS owner_name
       FROM tools t
       JOIN users u ON u.id = t.owner_id
       WHERE t.id = ?`
    )
    .get(req.params.id);

  if (!tool) return res.status(404).json({ error: 'Tool not found.' });
  res.json(tool);
});

// ---------- add a tool ----------

router.post('/', requireAuth, (req, res) => {
  const { name, description, category, condition } = req.body;

  if (!name) return res.status(400).json({ error: 'Tool name is required.' });

  const result = db
    .prepare(
      'INSERT INTO tools (owner_id, name, description, category, condition) VALUES (?, ?, ?, ?, ?)'
    )
    .run(
      req.user.id,
      name,
      description ?? '',
      category ?? 'general',
      condition ?? 'good'
    );

  const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(tool);
});

// ---------- update a tool ----------

router.put('/:id', requireAuth, (req, res) => {
  const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id);
  if (!tool) return res.status(404).json({ error: 'Tool not found.' });
  if (tool.owner_id !== req.user.id) return res.status(403).json({ error: 'You do not own this tool.' });

  const { name, description, category, condition, available } = req.body;

  db.prepare(
    `UPDATE tools
     SET name = ?, description = ?, category = ?, condition = ?, available = ?
     WHERE id = ?`
  ).run(
    name        ?? tool.name,
    description ?? tool.description,
    category    ?? tool.category,
    condition   ?? tool.condition,
    available !== undefined ? (available ? 1 : 0) : tool.available,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ---------- delete a tool ----------

router.delete('/:id', requireAuth, (req, res) => {
  const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id);
  if (!tool) return res.status(404).json({ error: 'Tool not found.' });
  if (tool.owner_id !== req.user.id) return res.status(403).json({ error: 'You do not own this tool.' });

  db.prepare('DELETE FROM tools WHERE id = ?').run(req.params.id);
  res.json({ message: 'Tool deleted.' });
});

module.exports = router;
