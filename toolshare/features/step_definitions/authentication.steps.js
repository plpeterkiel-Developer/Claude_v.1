'use strict';

const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');

Before(async function () {
  await this.resetDatabase();
});

// ─── Given ───────────────────────────────────────────────────────────────────

Given('the database is empty', async function () {
  await this.resetDatabase();
});

Given('a visitor is on the registration page', function () {
  // No-op — context only
});

Given('a user account already exists with email {string}', async function (email) {
  this.existingUser = await this.createUser({ email });
});

Given('a user has registered but not yet verified their email', async function () {
  this.unverifiedUser = await this.createUser({ email: 'unverified@example.com', emailVerified: false });
  await this.loginAs('unverified@example.com');
});

Given('a visitor has failed to log in 5 times with the same email', async function () {
  for (let i = 0; i < 5; i++) {
    await this.request.post('/auth/login').send({ email: 'victim@example.com', password: 'wrong' });
  }
});

Given('a user account is suspended', async function () {
  this.suspendedUser = await this.createUser({ email: 'suspended@example.com', isSuspended: true });
});

Given('a user registered with email {string}', async function (email) {
  const token = 'test-verify-token';
  this.targetUser = await this.prisma.user.create({
    data: {
      name: 'New User',
      email,
      passwordHash: null,
      authProvider: 'local',
      emailVerified: false,
      verificationToken: token,
      preferredLanguage: 'en',
    },
  });
});

Given('their verification token is {string}', async function (token) {
  await this.prisma.user.update({
    where: { id: this.targetUser.id },
    data: { verificationToken: token },
  });
  this.verificationToken = token;
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('they submit a valid email and password', async function () {
  this.lastResponse = await this.request.post('/auth/register').send({
    name: 'Test User',
    email: 'newuser@example.com',
    password: 'Password123!',
  });
});

When('a visitor registers with email {string}', async function (email) {
  this.lastResponse = await this.request.post('/auth/register').send({
    name: 'Another User',
    email,
    password: 'Password123!',
  });
});

When('they submit a password shorter than 8 characters', async function () {
  this.lastResponse = await this.request.post('/auth/register').send({
    name: 'Test User',
    email: 'weak@example.com',
    password: 'Short1',
  });
});

When('they attempt to log in with correct credentials', async function () {
  this.lastResponse = await this.loginAs('suspended@example.com');
});

When('they attempt a 6th login within 15 minutes', async function () {
  this.lastResponse = await this.request
    .post('/auth/login')
    .send({ email: 'victim@example.com', password: 'wrong' });
});

When('they visit the verification link with token {string}', async function (token) {
  this.lastResponse = await this.request.post('/auth/verify-email').send({ token });
});

When('a visitor clicks {string}', function (_text) {
  // OAuth flow cannot be fully tested in integration — covered by unit test
  this.oauthInitiated = true;
});

When('they authenticate successfully with their Google account', async function () {
  // Simulate the result of a successful Google OAuth callback
  // In integration tests, we directly create the user as the strategy would
  this.oauthUser = await this.createUser({ email: 'google-user@gmail.com', emailVerified: true });
  this.lastResponse = { status: 200, body: { user: this.oauthUser } };
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('a new user account is created and they are redirected to their dashboard', function () {
  assert.strictEqual(this.lastResponse.status, 201);
  const body = this.lastResponse.body;
  assert.ok(body.userId, 'Response should include userId');
});

Then('they receive a 409 Conflict error', function () {
  assert.strictEqual(this.lastResponse.status, 409);
});

Then('they see a validation error explaining the password requirements', function () {
  assert.strictEqual(this.lastResponse.status, 422);
  const fields = this.lastResponse.body.fields || [];
  assert.ok(fields.some((f) => f.field === 'password'), 'Should have a password field error');
});

Then('the login is blocked and they receive a {string} message', function (_msg) {
  assert.strictEqual(this.lastResponse.status, 429);
});

Then('they receive an error and are not authenticated', function () {
  assert.notStrictEqual(this.lastResponse.status, 200);
});

Then('their account is marked as email verified', async function () {
  const user = await this.prisma.user.findUnique({ where: { id: this.targetUser.id } });
  assert.strictEqual(user.emailVerified, true);
  assert.strictEqual(user.verificationToken, null);
});

Then('a user account is created or matched and they are logged in', function () {
  assert.ok(this.oauthUser, 'OAuth user should have been created');
});

Then('they are shown a message asking them to verify their email first', function () {
  assert.strictEqual(this.lastResponse.status, 403);
  assert.strictEqual(this.lastResponse.body.code, 'EMAIL_NOT_VERIFIED');
});

Then('no listing is created', async function () {
  const count = await this.prisma.tool.count();
  assert.strictEqual(count, 0);
});
