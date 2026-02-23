/**
 * step_definitions/auth.steps.js
 *
 * Steps for features/auth.feature
 * Uses supertest via this.agent (session-aware) or this.request (stateless).
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect }             = require('chai');

// ---------- Given ----------

Given('the API is running', function () {
  // Nothing to do — the Express app is always available via supertest
});

Given('a user exists with email {string} and password {string}', function (email, password) {
  this.createUser({ email, password });
});

Given('I am logged in as {string} with password {string}', async function (email, password) {
  this.createUser({ email, password });
  await this.loginAs(email, password);
});

Given('the database has some available tools', function () {
  const user = this.createUser({ email: 'fixture@garden.com', password: 'Fix123!' });
  this.lastTool = this.createTool({ ownerId: user.id, name: 'Fixture Tool' });
});

// ---------- When ----------

When('I POST {string} with body:', async function (path, dataTable) {
  const body = dataTable.rowsHash
    ? dataTable.rowsHash()
    : {};
  this.response = await this.agent.post(path).send(body);
});

When('I GET {string}', async function (path) {
  this.response = await this.agent.get(path);
});

When('I POST {string} with body:\n  |  |', async function (path) {
  this.response = await this.agent.post(path).send({});
});

// ---------- Then ----------

Then('the response status should be {int}', function (expectedStatus) {
  expect(this.response.status).to.equal(expectedStatus);
});

Then('the response body should include {string} equal to {string}', function (key, value) {
  expect(this.response.body).to.have.property(key, value);
});

Then('the response body should include {string}', function (key) {
  expect(this.response.body).to.have.property(key);
});

Then('the response body should be a JSON array', function () {
  expect(this.response.body).to.be.an('array');
});
