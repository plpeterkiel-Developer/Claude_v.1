'use strict';

/**
 * Cucumber World — provides shared state and helpers for all step definitions.
 * Uses a real in-memory test database (Prisma + SQLite via DATABASE_URL env).
 */

const { setWorldConstructor, setDefaultTimeout } = require('@cucumber/cucumber');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const app = require('../../backend/src/app');

// Cucumber step timeout (ms)
setDefaultTimeout(15000);

class ToolShareWorld {
  constructor() {
    this.request = supertest(app);
    this.prisma = new PrismaClient();

    // Storage for scenario state
    this.lastResponse = null;
    this.currentUser = null;
    this.accessToken = null;
    this.sentEmails = [];
  }

  /**
   * Create a test user and return their record.
   */
  async createUser({ name, email, password = 'Password123!', emailVerified = true, isSuspended = false } = {}) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        name: name || 'Test User',
        email: email || `user-${Date.now()}@example.com`,
        passwordHash,
        authProvider: 'local',
        emailVerified,
        isSuspended,
        preferredLanguage: 'en',
      },
    });
  }

  /**
   * Log in as a user and store the access token for subsequent requests.
   */
  async loginAs(email, password = 'Password123!') {
    const res = await this.request
      .post('/auth/login')
      .send({ email, password });

    this.lastResponse = res;
    if (res.status === 200) {
      // Extract cookie
      const cookie = res.headers['set-cookie'];
      this.authCookie = cookie ? cookie.join('; ') : '';
    }
    return res;
  }

  /**
   * Make an authenticated request using the stored cookie.
   */
  authedRequest(method, path) {
    return this.request[method](path).set('Cookie', this.authCookie || '');
  }

  /**
   * Clear all data between scenarios.
   */
  async resetDatabase() {
    // Order matters due to FK constraints
    await this.prisma.report.deleteMany();
    await this.prisma.review.deleteMany();
    await this.prisma.request.deleteMany();
    await this.prisma.tool.deleteMany();
    await this.prisma.user.deleteMany();
    this.currentUser = null;
    this.accessToken = null;
    this.authCookie = null;
    this.lastResponse = null;
    this.sentEmails = [];
  }
}

setWorldConstructor(ToolShareWorld);
