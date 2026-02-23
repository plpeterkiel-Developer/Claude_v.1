/**
 * step_definitions/tools.steps.js
 *
 * Steps for features/tools.feature
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect }             = require('chai');

// ---------- Given ----------

Given('I own a tool called {string}', function (name) {
  const user = this.testDb.prepare('SELECT * FROM users LIMIT 1').get();
  this.lastTool = this.createTool({ ownerId: user.id, name });
});

Given('I own an available tool called {string}', function (name) {
  const user = this.testDb.prepare('SELECT * FROM users LIMIT 1').get();
  this.lastTool = this.createTool({ ownerId: user.id, name, available: 1 });
});

Given('another user owns a tool', function () {
  const other = this.createUser({ email: 'other-owner@garden.com', password: 'Other123!' });
  this.otherTool = this.createTool({ ownerId: other.id, name: 'Other Person Tool' });
});

// ---------- When ----------

When('I GET the first tool\\'s detail page', async function () {
  const tool = this.testDb.prepare('SELECT * FROM tools LIMIT 1').get();
  this.response = await this.agent.get(`/tools/${tool.id}`);
});

When('I PUT my tool with body:', async function (dataTable) {
  const body = dataTable.rowsHash();
  this.response = await this.agent.put(`/tools/${this.lastTool.id}`).send(body);
});

When('I try to PUT that other user\\'s tool', async function () {
  this.response = await this.agent.put(`/tools/${this.otherTool.id}`).send({ name: 'Stolen Name' });
});

When('I DELETE my tool', async function () {
  this.response = await this.agent.delete(`/tools/${this.lastTool.id}`);
});

When('I try to DELETE that other user\\'s tool', async function () {
  this.response = await this.agent.delete(`/tools/${this.otherTool.id}`);
});
