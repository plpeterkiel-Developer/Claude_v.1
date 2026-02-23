/**
 * step_definitions/requests.steps.js
 *
 * Steps for features/requests.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect }             = require('chai');

// ---------- Given ----------

Given('user {string} owns an available tool called {string}', function (email, toolName) {
  // The owner may already exist (created by a previous Given in the same scenario)
  let owner = this.testDb.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!owner) {
    owner = this.createUser({ email, password: 'OwnerDefault1!' });
  }
  this.lastTool = this.createTool({ ownerId: owner.id, name: toolName, available: 1 });
});

Given('user {string} owns an unavailable tool called {string}', function (email, toolName) {
  let owner = this.testDb.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!owner) {
    owner = this.createUser({ email, password: 'OwnerDefault1!' });
  }
  this.lastTool = this.createTool({ ownerId: owner.id, name: toolName, available: 0 });
});

Given('I already have a pending request for that tool', async function () {
  const me = this.testDb.prepare('SELECT * FROM users ORDER BY id DESC LIMIT 1').get();
  this.lastRequest = this.createRequest({ toolId: this.lastTool.id, requesterId: me.id });
});

Given('there is a pending request between {string} and {string}', function (ownerEmail, borrowerEmail) {
  const owner    = this.createUser({ email: ownerEmail,   password: 'LenderPass1!' });
  const borrower = this.createUser({ email: borrowerEmail, password: 'AskerPass1!' });
  const tool     = this.createTool({ ownerId: owner.id, name: 'Lent Tool', available: 1 });
  this.lastTool    = tool;
  this.lastRequest = this.createRequest({ toolId: tool.id, requesterId: borrower.id });
});

Given('there is an approved request between {string} and {string}', function (ownerEmail, borrowerEmail) {
  const owner    = this.createUser({ email: ownerEmail,   password: 'LenderPass1!' });
  const borrower = this.createUser({ email: borrowerEmail, password: 'AskerPass1!' });
  const tool     = this.createTool({ ownerId: owner.id, name: 'Lent Tool', available: 0 });
  this.lastTool    = tool;
  this.lastRequest = this.createRequest({ toolId: tool.id, requesterId: borrower.id, status: 'approved' });
});

// ---------- When ----------

When('I POST a borrow request with message {string}', async function (message) {
  this.response = await this.agent
    .post(`/requests/tool/${this.lastTool.id}`)
    .send({ message });
});

When('I POST a borrow request for my own tool', async function () {
  this.response = await this.agent
    .post(`/requests/tool/${this.lastTool.id}`)
    .send({ message: 'Self-request test' });
});

When('I POST a borrow request for the unavailable tool', async function () {
  this.response = await this.agent
    .post(`/requests/tool/${this.lastTool.id}`)
    .send({ message: 'Unavailable test' });
});

When('I POST another borrow request for the same tool', async function () {
  this.response = await this.agent
    .post(`/requests/tool/${this.lastTool.id}`)
    .send({ message: 'Duplicate request' });
});

When('I PUT the request with status {string}', async function (status) {
  this.response = await this.agent
    .put(`/requests/${this.lastRequest.id}`)
    .send({ status });
});

// ---------- Then ----------

Then('the tool should now be unavailable', function () {
  const tool = this.testDb.prepare('SELECT available FROM tools WHERE id = ?').get(this.lastTool.id);
  expect(tool.available).to.equal(0);
});

Then('the tool should now be available', function () {
  const tool = this.testDb.prepare('SELECT available FROM tools WHERE id = ?').get(this.lastTool.id);
  expect(tool.available).to.equal(1);
});
