/**
 * routes/auth.js — authentication endpoints
 *
 * POST /auth/register   — create account with email + password
 * POST /auth/login      — log in with email + password
 * POST /auth/logout     — end session
 * GET  /auth/me         — return the current user (or 401)
 * GET  /auth/google     — start Google OAuth flow
 * GET  /auth/google/callback — Google OAuth callback
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const db = require('../db');

const router = express.Router();

// ---------- register ----------

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are all required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, password_hash);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

  // Log the new user in straight away
  req.logIn(user, (err) => {
    if (err) return res.status(500).json({ error: 'Could not create session after registration.' });
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  });
});

// ---------- login ----------

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message ?? 'Login failed.' });

    req.logIn(user, (err) => {
      if (err) return next(err);
      res.json({ id: user.id, name: user.name, email: user.email });
    });
  })(req, res, next);
});

// ---------- logout ----------

router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully.' });
  });
});

// ---------- current user ----------

router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  const { id, name, email, avatar_url } = req.user;
  res.json({ id, name, email, avatar_url });
});

// ---------- Google OAuth ----------

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google` }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }
);

module.exports = router;
