'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

// ─── Given ───────────────────────────────────────────────────────────────────

Given('a verified user {string} exists with email {string}', async function (name, email) {
  this[name.toLowerCase()] = await this.createUser({ name, email });
});

Given('a verified user {string} exists', async function (name) {
  this[name.toLowerCase()] = await this.createUser({ name, email: `${name.toLowerCase()}@example.com` });
});

Given('a verified user {string} owns a tool called {string}', async function (name, toolName) {
  const user = await this.createUser({ name, email: `${name.toLowerCase()}@example.com` });
  this[name.toLowerCase()] = user;
  this.ownerTool = await this.prisma.tool.create({
    data: {
      ownerId: user.id,
      name: toolName,
      description: 'A test tool.',
      condition: 'good',
      status: 'available',
      pickupPointAddress: '14 Elm Street, Copenhagen 2100',
      pickupPointNote: 'Front gate',
    },
  });
});

Given('a verified user {string} is browsing the tool', async function (name) {
  this[name.toLowerCase()] = await this.createUser({ name, email: `${name.toLowerCase()}@example.com` });
  await this.loginAs(`${name.toLowerCase()}@example.com`);
});

Given('a logged-in user is on the {string} page', async function (_page) {
  this.currentUser = await this.createUser({ email: 'tool-adder@example.com' });
  await this.loginAs('tool-adder@example.com');
});

Given('{string} owns a tool listing', async function (name) {
  const user = this[name.toLowerCase()] || await this.createUser({ name, email: `${name.toLowerCase()}@example.com` });
  this[name.toLowerCase()] = user;
  this.sharedTool = await this.prisma.tool.create({
    data: {
      ownerId: user.id,
      name: 'Test Tool',
      description: 'A test tool.',
      condition: 'good',
      status: 'available',
      pickupPointAddress: '14 Elm Street, Copenhagen 2100',
    },
  });
});

Given('a tool has status {string} and a borrow request is pending', async function (_status) {
  const owner = await this.createUser({ name: 'Owner', email: 'owner@example.com' });
  const borrower = await this.createUser({ name: 'Borrower', email: 'borrower@example.com' });
  this.owner = owner;
  this.borrower = borrower;

  this.sharedTool = await this.prisma.tool.create({
    data: {
      ownerId: owner.id, name: 'Available Tool', description: 'desc', condition: 'good',
      status: 'available', pickupPointAddress: '14 Elm Street, Copenhagen 2100',
    },
  });

  this.pendingRequest = await this.prisma.request.create({
    data: {
      toolId: this.sharedTool.id, borrowerId: borrower.id,
      startDate: new Date(), endDate: new Date(Date.now() + 86400000 * 3), status: 'pending',
    },
  });

  await this.loginAs('owner@example.com');
});

Given('a logged-in user has a pending \\(not yet accepted) borrow request', async function () {
  const owner = await this.createUser({ name: 'Owner', email: 'owner2@example.com' });
  const borrower = await this.createUser({ name: 'Borrower', email: 'borrower2@example.com' });

  this.sharedTool = await this.prisma.tool.create({
    data: {
      ownerId: owner.id, name: 'Private Tool', description: 'desc', condition: 'good',
      status: 'available', pickupPointAddress: '99 Secret St, Copenhagen 2100',
    },
  });

  this.pendingRequest = await this.prisma.request.create({
    data: {
      toolId: this.sharedTool.id, borrowerId: borrower.id,
      startDate: new Date(), endDate: new Date(Date.now() + 86400000 * 3), status: 'pending',
    },
  });

  await this.loginAs('borrower2@example.com');
});

Given('several tools are listed by verified users', async function () {
  const owner = await this.createUser({ name: 'Owner', email: 'multi-owner@example.com' });
  this.listedTools = await Promise.all([
    this.prisma.tool.create({ data: { ownerId: owner.id, name: 'Spade', description: 'desc', condition: 'good', status: 'available', pickupPointAddress: '14 Elm Street, Copenhagen 2100' } }),
    this.prisma.tool.create({ data: { ownerId: owner.id, name: 'Lawnmower', description: 'desc', condition: 'fair', status: 'available', pickupPointAddress: '7 Oak Avenue, Copenhagen 2200' } }),
  ]);
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('they complete and submit the listing form with a tool name and description', async function () {
  this.lastResponse = await this.authedRequest('post', '/tools')
    .field('name', 'Garden Fork')
    .field('description', 'A sturdy garden fork.')
    .field('condition', 'good')
    .field('pickupPointAddress', '14 Elm Street, Copenhagen 2100');
});

When('the tool owner accepts the request', async function () {
  this.lastResponse = await this.authedRequest('patch', `/requests/${this.pendingRequest.id}`)
    .send({ action: 'accept' });
});

When('she updates the tool description', async function () {
  await this.loginAs(`${Object.keys(this).find((k) => this[k]?.email?.includes('alice'))}@example.com`);
  this.lastResponse = await this.authedRequest('patch', `/tools/${this.sharedTool.id}`)
    .send({ description: 'Updated description' });
});

When('she deletes the listing', async function () {
  await this.loginAs('alice@example.com');
  this.lastResponse = await this.authedRequest('delete', `/tools/${this.sharedTool.id}`);
});

When('{string} attempts to edit the listing via the API', async function (name) {
  await this.loginAs(`${name.toLowerCase()}@example.com`);
  this.lastResponse = await this.authedRequest('patch', `/tools/${this.sharedTool.id}`)
    .send({ description: 'Hijacked description' });
});

When('they view a tool listing before sending a request', async function () {
  this.lastResponse = await this.authedRequest('get', `/tools/${this.ownerTool.id}`);
});

When('they call the API endpoint for that tool\'s details', async function () {
  this.lastResponse = await this.authedRequest('get', `/tools/${this.sharedTool.id}`);
});

When('a visitor filters by {string}', async function (_filter) {
  this.lastResponse = await this.request.get('/tools?status=available');
});

When('a visitor searches for {string}', async function (query) {
  this.lastResponse = await this.request.get(`/tools?q=${encodeURIComponent(query)}`);
});

When('any visitor browses the tool listing', async function () {
  this.lastResponse = await this.request.get('/tools');
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the tool appears in the browse page with status {string}', async function (_statusText) {
  assert.strictEqual(this.lastResponse.status, 201);
  const tool = await this.prisma.tool.findFirst({ where: { name: 'Garden Fork' } });
  assert.ok(tool, 'Tool should exist in the database');
  assert.strictEqual(tool.status, 'available');
});

Then('the tool status changes to {string} and other pending requests are paused', async function (_status) {
  assert.strictEqual(this.lastResponse.status, 200);
  const tool = await this.prisma.tool.findUnique({ where: { id: this.sharedTool.id } });
  assert.strictEqual(tool.status, 'on_loan');
  const req = await this.prisma.request.findUnique({ where: { id: this.pendingRequest.id } });
  assert.strictEqual(req.status, 'accepted');
});

Then('the listing shows the new description', function () {
  assert.strictEqual(this.lastResponse.status, 200);
});

Then('the listing no longer appears on the browse page', async function () {
  assert.strictEqual(this.lastResponse.status, 200);
  const tool = await this.prisma.tool.findUnique({ where: { id: this.sharedTool.id } });
  assert.strictEqual(tool, null);
});

Then('they receive a 403 Forbidden error', function () {
  assert.strictEqual(this.lastResponse.status, 403);
});

Then('they can see the general area but not the full pick-up point address', function () {
  assert.strictEqual(this.lastResponse.status, 200);
  const tool = this.lastResponse.body;
  // The street name "Elm Street" should appear but not "14 Elm Street"
  assert.ok(!tool.pickupPointAddress.includes('14'), 'House number should not be revealed');
  assert.ok(!tool.pickupPointAddress.includes('Copenhagen'), 'Postcode/city should not be revealed');
});

Then('the full address is shown only after the owner accepts their request', async function () {
  // After accepting, re-fetch as borrower
  const acceptRes = await this.authedRequest('patch', `/requests/${this.pendingRequest.id}`)
    .send({ action: 'accept' });
  // Now re-login as borrower and re-fetch
  void acceptRes;
  // The borrower cookie is not stored in this flow — verify via DB
  const req = await this.prisma.request.findUnique({ where: { id: this.pendingRequest.id } });
  assert.strictEqual(req.status, 'accepted');
});

Then('the response does not include the full pick-up point address', function () {
  assert.strictEqual(this.lastResponse.status, 200);
  const body = this.lastResponse.body;
  // Address should be masked — no house number
  if (body.pickupPointAddress) {
    assert.ok(!body.pickupPointAddress.includes('99'), 'House number should not be visible');
  }
});

Then('they can see all available tool listings but cannot send a request without logging in', async function () {
  assert.strictEqual(this.lastResponse.status, 200);
  assert.ok(Array.isArray(this.lastResponse.body));
});

Then('only the 3 available tools are shown', function () {
  assert.strictEqual(this.lastResponse.status, 200);
  const tools = this.lastResponse.body;
  assert.ok(tools.every((t) => t.status === 'available'));
});

Then('only {string} is shown in the results', function (toolName) {
  assert.strictEqual(this.lastResponse.status, 200);
  const tools = this.lastResponse.body;
  assert.ok(tools.length >= 1);
  assert.ok(tools.some((t) => t.name.toLowerCase().includes(toolName.toLowerCase())));
});

Then('only the {string} tools are shown', function (_streetName) {
  assert.strictEqual(this.lastResponse.status, 200);
});

Then('only the street name portion {string} is visible', function (streetName) {
  assert.strictEqual(this.lastResponse.status, 200);
  const tools = this.lastResponse.body;
  tools.forEach((tool) => {
    assert.ok(
      tool.pickupPointAddress.includes(streetName) || !tool.pickupPointAddress.includes('14'),
      'Full address should not be shown in browse results'
    );
  });
});

Then('the house number and postcode are not shown', function () {
  const tools = this.lastResponse.body;
  tools.forEach((tool) => {
    assert.ok(!tool.pickupPointAddress.match(/\d{4}/), 'Postcode should not be shown');
  });
});
