/**
 * support/world.js — Cucumber World
 *
 * Each scenario gets a completely fresh, isolated in-memory SQLite database.
 * We swap it in via db._setDb() before any step runs, so every route handler
 * automatically uses the test database — no mocking required.
 *
 * supertest.agent() preserves the session cookie across requests within one
 * scenario, mimicking a real browser.
 */

const { World, setWorldConstructor } = require('@cucumber/cucumber');
const supertest = require('supertest');
const bcrypt    = require('bcryptjs');
const db        = require('../src/db');
const app       = require('../src/app');

class CustomWorld extends World {
  constructor(options) {
    super(options);

    // Fresh in-memory DB for this scenario
    this.testDb = db.createDb(':memory:');
    db._setDb(this.testDb);

    // HTTP agent that keeps cookies between requests (= keeps session alive)
    this.agent = supertest.agent(app);

    // Scratch space for inter-step data
    this.response    = null;
    this.lastTool    = null;
    this.lastRequest = null;
    this.otherTool   = null;
  }

  // ---------- fixture helpers ----------

  /**
   * Insert a user directly into the DB (bypasses the API).
   * Using bcrypt cost 1 keeps tests fast.
   */
  createUser({ name = 'Test User', email, password }) {
    const hash   = bcrypt.hashSync(password, 1);
    const result = this.testDb
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name, email, hash);
    return this.testDb.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  /** Insert a tool directly into the DB. */
  createTool({ ownerId, name = 'Test Tool', description = '', category = 'general', condition = 'good', available = 1 }) {
    const result = this.testDb
      .prepare(
        'INSERT INTO tools (owner_id, name, description, category, condition, available) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(ownerId, name, description, category, condition, available);
    return this.testDb.prepare('SELECT * FROM tools WHERE id = ?').get(result.lastInsertRowid);
  }

  /** Insert a tool request directly into the DB. */
  createRequest({ toolId, requesterId, status = 'pending', message = '' }) {
    const result = this.testDb
      .prepare('INSERT INTO tool_requests (tool_id, requester_id, status, message) VALUES (?, ?, ?, ?)')
      .run(toolId, requesterId, status, message);
    return this.testDb.prepare('SELECT * FROM tool_requests WHERE id = ?').get(result.lastInsertRowid);
  }

  /** Log in via the API so the session cookie is set on this.agent. */
  async loginAs(email, password) {
    await this.agent.post('/auth/login').send({ email, password });
  }
}

setWorldConstructor(CustomWorld);
