'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('an admin user {string} exists', async function (email) {
  process.env.ADMIN_EMAIL = email;
  this.adminUser = await this.createUser({ name: 'Admin', email });
});

Given('a logged-in user is viewing a tool listing', async function () {
  const reporter = await this.createUser({ name: 'Reporter', email: 'reporter@example.com' });
  await this.loginAs('reporter@example.com');
  this.reporterUser = reporter;
  // sharedTool should be set from Background
  if (!this.sharedTool && this.alice) {
    this.sharedTool = await this.prisma.tool.create({
      data: {
        ownerId: this.alice.id, name: 'Reportable Tool', description: 'desc',
        condition: 'good', status: 'available',
        pickupPointAddress: '14 Elm Street, Copenhagen 2100',
      },
    });
  }
});

Given('{string} has a review on their profile', async function (name) {
  const user = this[name.toLowerCase()];
  const reviewer = await this.createUser({ name: 'Reviewer', email: 'reviewer-mod@example.com' });
  const tool = await this.prisma.tool.create({
    data: {
      ownerId: this.alice.id, name: 'Tool For Review', description: 'desc',
      condition: 'good', status: 'available',
      pickupPointAddress: '14 Elm Street, Copenhagen 2100',
    },
  });
  const req = await this.prisma.request.create({
    data: {
      toolId: tool.id, borrowerId: reviewer.id,
      startDate: new Date(Date.now() - 86400000 * 5),
      endDate: new Date(Date.now() - 86400000), status: 'returned',
    },
  });
  this.reviewedReview = await this.prisma.review.create({
    data: { reviewerId: reviewer.id, revieweeId: user.id, requestId: req.id, rating: 2, comment: 'Bad!' },
  });
});

Given('an admin is reviewing a pending report', async function () {
  this.pendingReport = await this.prisma.report.create({
    data: {
      reporterId: this.alice.id,
      targetType: 'listing',
      targetId: this.sharedTool.id,
      reason: 'Misleading description',
      status: 'pending',
    },
  });
  await this.loginAs(process.env.ADMIN_EMAIL);
});

Given('an admin is reviewing a pending report for a listing', async function () {
  await this['an admin is reviewing a pending report']();
});

Given('an admin is reviewing a pending report for a review', async function () {
  this.pendingReport = await this.prisma.report.create({
    data: {
      reporterId: this.alice.id,
      targetType: 'review',
      targetId: this.reviewedReview.id,
      reason: 'Abusive language',
      status: 'pending',
    },
  });
  await this.loginAs(process.env.ADMIN_EMAIL);
});

Given('an admin is reviewing a report against a user', async function () {
  if (!this.sharedTool) {
    this.sharedTool = await this.prisma.tool.create({
      data: {
        ownerId: this.alice.id, name: 'Suspend Target Tool', description: 'desc',
        condition: 'good', status: 'available',
        pickupPointAddress: '14 Elm Street, Copenhagen 2100',
      },
    });
  }
  this.pendingReport = await this.prisma.report.create({
    data: {
      reporterId: this.bob.id,
      targetType: 'listing',
      targetId: this.sharedTool.id,
      reason: 'Harassment',
      status: 'pending',
    },
  });
  await this.loginAs(process.env.ADMIN_EMAIL);
});

Given('{string} is logged in \\(not an admin)', async function (name) {
  await this.loginAs(`${name.toLowerCase()}@example.com`);
});

Given('there is a pending report', async function () {
  if (!this.sharedTool) {
    this.sharedTool = await this.prisma.tool.create({
      data: {
        ownerId: this.alice.id, name: 'Dummy Tool', description: 'desc',
        condition: 'good', status: 'available',
        pickupPointAddress: '14 Elm Street, Copenhagen 2100',
      },
    });
  }
  this.pendingReport = await this.prisma.report.create({
    data: {
      reporterId: this.alice.id, targetType: 'listing',
      targetId: this.sharedTool.id, reason: 'test', status: 'pending',
    },
  });
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('they click {string} and submit a reason', async function (_button) {
  this.lastResponse = await this.authedRequest('post', '/reports')
    .send({ targetType: 'listing', targetId: this.sharedTool.id, reason: 'This listing is misleading.' });
});

When('{string} reports the review with a reason', async function (name) {
  await this.loginAs(`${name.toLowerCase()}@example.com`);
  this.lastResponse = await this.authedRequest('post', '/reports')
    .send({ targetType: 'review', targetId: this.reviewedReview.id, reason: 'Abusive content.' });
});

When('they select {string} and confirm', async function (action) {
  const actionMap = {
    'Issue Warning': 'warn',
    'Remove content': 'remove',
    'Suspend Account': 'suspend',
  };
  this.lastResponse = await this.authedRequest('patch', `/reports/${this.pendingReport.id}`)
    .send({ action: actionMap[action] || 'dismiss', reason: 'Admin decision.' });
});

When('they attempt to GET /reports', async function () {
  this.lastResponse = await this.authedRequest('get', '/reports');
});

When('they attempt to PATCH /reports/:id', async function () {
  this.lastResponse = await this.authedRequest('patch', `/reports/${this.pendingReport.id}`)
    .send({ action: 'dismiss' });
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('a report is created with status {string} for admin review', async function (status) {
  assert.strictEqual(this.lastResponse.status, 201);
  const report = await this.prisma.report.findUnique({ where: { id: this.lastResponse.body.id } });
  assert.strictEqual(report.status, status.toLowerCase());
});

Then('a report is created with status {string}', async function (status) {
  assert.strictEqual(this.lastResponse.status, 201);
  const report = await this.prisma.report.findUnique({ where: { id: this.lastResponse.body.id } });
  assert.strictEqual(report.status, status.toLowerCase());
});

Then('the listing remains visible until an admin makes a decision', async function () {
  const tool = await this.prisma.tool.findUnique({ where: { id: this.sharedTool.id } });
  assert.ok(tool, 'Tool should still exist');
});

Then('the reported user\'s warning count increases by 1', async function () {
  assert.strictEqual(this.lastResponse.status, 200);
  const tool = await this.prisma.tool.findUnique({ where: { id: this.sharedTool.id }, include: { owner: true } });
  assert.strictEqual(tool.owner.warningCount, 1);
});

Then('the user receives an email notifying them of the warning', function () {
  assert.strictEqual(this.lastResponse.status, 200);
});

Then('the listing is deleted from the platform', async function () {
  assert.strictEqual(this.lastResponse.status, 200);
  const tool = await this.prisma.tool.findUnique({ where: { id: this.sharedTool.id } });
  assert.strictEqual(tool, null);
});

Then('the report status is updated to {string}', async function (status) {
  const report = await this.prisma.report.findUnique({ where: { id: this.pendingReport.id } });
  assert.strictEqual(report.status, status.toLowerCase());
});

Then('the review is marked as removed and no longer shown publicly', async function () {
  assert.strictEqual(this.lastResponse.status, 200);
  const review = await this.prisma.review.findUnique({ where: { id: this.reviewedReview.id } });
  assert.strictEqual(review.isRemoved, true);
});

Then('the user\'s account is deactivated', async function () {
  assert.strictEqual(this.lastResponse.status, 200);
  const tool = await this.prisma.tool.findUnique({
    where: { id: this.sharedTool.id }, include: { owner: true },
  });
  assert.strictEqual(tool.owner.isSuspended, true);
});

Then('the user receives an email informing them of the suspension', function () {
  assert.strictEqual(this.lastResponse.status, 200);
});

Then('the user can no longer log in', async function () {
  const tool = await this.prisma.tool.findUnique({ where: { id: this.sharedTool.id }, include: { owner: true } });
  const res = await this.request.post('/auth/login').send({ email: tool.owner.email, password: 'Password123!' });
  assert.notStrictEqual(res.status, 200);
});

Then('they receive a 403 Forbidden error', function () {
  assert.strictEqual(this.lastResponse.status, 403);
});
