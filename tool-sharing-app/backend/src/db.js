/**
 * db.js — SQLite database setup using better-sqlite3
 *
 * better-sqlite3 is synchronous: every query returns its result directly.
 * No callbacks, no Promises — easy to follow.
 *
 * The exported object is a Proxy that forwards every method call to the
 * currently active database instance.  This means:
 *
 *   const db = require('./db');
 *   db.prepare('SELECT ...');   // always uses the current instance
 *
 * Tests can swap the instance with db._setDb(newDb) to get full isolation
 * without reloading any modules.
 */

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

// ---------- schema ----------
// Written as plain SQL so it is easy to read and version.

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT,
    auth_provider TEXT    NOT NULL DEFAULT 'local',
    provider_id   TEXT,
    avatar_url    TEXT,
    created_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tools (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    category    TEXT    NOT NULL DEFAULT 'general',
    condition   TEXT    NOT NULL DEFAULT 'good',
    available   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tool_requests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id      INTEGER NOT NULL REFERENCES tools(id)  ON DELETE CASCADE,
    requester_id INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    status       TEXT    NOT NULL DEFAULT 'pending',
    message      TEXT    NOT NULL DEFAULT '',
    created_at   TEXT    DEFAULT (datetime('now')),
    updated_at   TEXT    DEFAULT (datetime('now'))
  );
`;

/**
 * Open (or create) a SQLite database and apply the schema.
 * Pass ':memory:' for a temporary in-memory database — used by tests.
 */
function createDb(dbPath) {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

// ---------- singleton ----------

const defaultPath = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.join(__dirname, '..', 'data', 'app.db');

let _activeDb = createDb(defaultPath);

// ---------- proxy ----------
// Routes import this module and call db.prepare(...) etc.
// The Proxy ensures every call is forwarded to whatever _activeDb currently is.
// This is how tests can inject an isolated in-memory database at runtime.

const dbProxy = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === '_setDb')   return (newDb) => { _activeDb = newDb; };
      if (prop === 'createDb') return createDb;
      if (prop === 'SCHEMA')   return SCHEMA;

      const value = _activeDb[prop];
      return typeof value === 'function' ? value.bind(_activeDb) : value;
    },
  }
);

module.exports = dbProxy;
