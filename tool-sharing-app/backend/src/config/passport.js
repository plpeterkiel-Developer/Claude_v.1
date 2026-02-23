/**
 * passport.js — authentication strategies
 *
 * Two strategies are configured:
 *   1. local  — email + bcrypt password (always available)
 *   2. google — OAuth 2.0 via Google (only if credentials are in .env)
 *
 * serializeUser / deserializeUser store just the user ID in the session cookie
 * and reload the full user row on each request.
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db');

// ---------- session plumbing ----------

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  done(null, user ?? false);
});

// ---------- local strategy (email + password) ----------

passport.use(
  new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return done(null, false, { message: 'No account found with that email.' });
    }
    if (!user.password_hash) {
      return done(null, false, { message: 'Please log in with your social account.' });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    return done(null, user);
  })
);

// ---------- Google OAuth strategy (optional) ----------

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
      },
      (accessToken, refreshToken, profile, done) => {
        const email = profile.emails[0].value;

        // Find or create the user
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
          const result = db
            .prepare(
              'INSERT INTO users (name, email, auth_provider, provider_id, avatar_url) VALUES (?, ?, ?, ?, ?)'
            )
            .run(
              profile.displayName,
              email,
              'google',
              profile.id,
              profile.photos?.[0]?.value ?? null
            );
          user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
        }

        return done(null, user);
      }
    )
  );
}
