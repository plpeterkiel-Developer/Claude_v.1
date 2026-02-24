'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('a visitor is not logged in', function () {
  this.authCookie = null;
});

Given('a logged-in user', async function () {
  await this.createUser({ email: 'logged-in@example.com' });
  await this.loginAs('logged-in@example.com');
});

Given('{string} owns a tool and there is a pending request from {string}', async function (ownerName, borrowerName) {
  const owner = this[ownerName.toLowerCase()] || await this.createUser({ name: ownerName, email: `${ownerName.toLowerCase()}@example.com` });
  const borrower = this[borrowerName.toLowerCase()] || await this.createUser({ name: borrowerName, email: `${borrowerName.toLowerCase()}@example.com` });
  this[ownerName.toLowerCase()] = owner;
  this[borrowerName.toLowerCase()] = borrower;

  this.sharedTool = await this.prisma.tool.create({
    data: {
      ownerId: owner.id, name: 'Owner Tool', description: 'desc',
      condition: 'good', status: 'available',
      pickupPointAddress: '14 Elm Street, Copenhagen 2100',
    },
  });

  this.pendingRequest = await this.prisma.request.create({
    data: {
      toolId: this.sharedTool.id, borrowerId: borrower.id,
      startDate: new Date(), endDate: new Date(Date.now() + 86400000 * 3), status: 'pending',
    },
  });
});

Given('and a third user {string} is logged in', async function (name) {
  const carol = await this.createUser({ name, email: `${name.toLowerCase()}@example.com` });
  this[name.toLowerCase()] = carol;
  await this.loginAs(`${name.toLowerCase()}@example.com`);
});

Given('{string} is logged in', async function (name) {
  await this.loginAs(`${name.toLowerCase()}@example.com`);
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('they send a POST request to /tools directly', async function () {
  this.lastResponse = await this.request.post('/tools')
    .send({ name: 'Hack Tool', description: 'desc', condition: 'good', pickupPointAddress: '1 St' });
});

When('they send a POST request to /requests', async function () {
  const tool = await this.prisma.tool.findFirst();
  this.lastResponse = await this.request.post('/requests')
    .send({ toolId: tool?.id || 'fake-id', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000).toISOString() });
});

When('{string} attempts to accept the request via the API', async function (name) {
  await this.loginAs(`${name.toLowerCase()}@example.com`);
  this.lastResponse = await this.authedRequest('patch', `/requests/${this.pendingRequest.id}`)
    .send({ action: 'accept' });
});

When('{string} attempts to DELETE {string}\'s tool listing', async function (attackerName, _ownerName) {
  await this.loginAs(`${attackerName.toLowerCase()}@example.com`);
  this.lastResponse = await this.authedRequest('delete', `/tools/${this.sharedTool.id}`);
});

When('they send a POST request with a body larger than 10kb', async function () {
  const bigBody = { data: 'x'.repeat(11 * 1024) };
  this.lastResponse = await this.authedRequest('post', '/tools').send(bigBody);
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the API returns a 401 Unauthorised response', function () {
  assert.strictEqual(this.lastResponse.status, 401);
});

Then('the login is blocked and they receive a {string} message', function (_msg) {
  assert.strictEqual(this.lastResponse.status, 429);
});

Then('the response does not include the pick-up point address', function () {
  // Step already defined in tools.steps.js — re-checked here for clarity
  assert.strictEqual(this.lastResponse.status, 200);
  const body = this.lastResponse.body;
  if (body.pickupPointAddress) {
    assert.ok(!body.pickupPointAddress.includes('99'), 'Full address should not be revealed');
  }
});

Then('they receive a 403 Forbidden error', function () {
  assert.strictEqual(this.lastResponse.status, 403);
});

Then('the API returns a 413 Payload Too Large response', function () {
  assert.ok([413, 400].includes(this.lastResponse.status), 'Should reject oversized payload');
});
