/**
 * app.js — Express application setup
 *
 * This file configures the Express app and wires up all middleware and routes.
 * It is kept separate from server.js so that tests can import the app
 * directly without actually binding to a port.
 */

require('dotenv').config();

const express  = require('express');
const session  = require('express-session');
const passport = require('passport');
const cors     = require('cors');
const path     = require('path');

const SQLiteStore = require('connect-sqlite3')(session);

// Load passport strategies (side-effectful, just needs to run once)
require('./config/passport');

const authRoutes     = require('./routes/auth');
const toolsRoutes    = require('./routes/tools');
const requestsRoutes = require('./routes/requests');

const app = express();

// ---------- CORS ----------
// Allow the Vite dev server (and production build) to send credentials (cookies)

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ---------- body parsing ----------

app.use(express.json());

// ---------- sessions ----------
// Sessions are stored in a SQLite file so they survive server restarts.

const sessionStoreDir = path.join(__dirname, '..', 'data');

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: sessionStoreDir }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// ---------- passport ----------

app.use(passport.initialize());
app.use(passport.session());

// ---------- routes ----------

app.use('/auth',     authRoutes);
app.use('/tools',    toolsRoutes);
app.use('/requests', requestsRoutes);

// Health-check — useful for monitoring and integration tests
app.get('/health', (req, res) => {
  res.json({ status: 'ok', loggedIn: req.isAuthenticated() });
});

module.exports = app;
