'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('{string} borrowed a tool from {string} and the loan is marked as returned', async function (borrowerName, ownerName) {
  const owner = this[ownerName.toLowerCase()] || await this.createUser({ name: ownerName, email: `${ownerName.toLowerCase()}@example.com` });
  const borrower = this[borrowerName.toLowerCase()] || await this.createUser({ name: borrowerName, email: `${borrowerName.toLowerCase()}@example.com` });
  this[ownerName.toLowerCase()] = owner;
  this[borrowerName.toLowerCase()] = borrower;

  const tool = await this.prisma.tool.create({
    data: {
      ownerId: owner.id, name: 'Returned Tool', description: 'desc',
      condition: 'good', status: 'available',
      pickupPointAddress: '14 Elm Street, Copenhagen 2100',
    },
  });

  this.returnedRequest = await this.prisma.request.create({
    data: {
      toolId: tool.id, borrowerId: borrower.id,
      startDate: new Date(Date.now() - 86400000 * 5),
      endDate: new Date(Date.now() - 86400000 * 2),
      status: 'returned',
    },
  });
});

Given('a loan has been marked as returned by both parties', async function () {
  if (!this.returnedRequest) {
    const owner = await this.createUser({ name: 'Owner', email: 'rev-owner@example.com' });
    const borrower = await this.createUser({ name: 'Borrower', email: 'rev-borrower@example.com' });
    const tool = await this.prisma.tool.create({
      data: {
        ownerId: owner.id, name: 'Review Tool', description: 'desc',
        condition: 'good', status: 'available',
        pickupPointAddress: '14 Elm Street, Copenhagen 2100',
      },
    });
    this.returnedRequest = await this.prisma.request.create({
      data: {
        toolId: tool.id, borrowerId: borrower.id,
        startDate: new Date(Date.now() - 86400000 * 5),
        endDate: new Date(Date.now() - 86400000 * 2),
        status: 'returned',
      },
    });
    await this.loginAs('rev-borrower@example.com');
  }
});

Given('a loan has been marked as returned', async function () {
  // Re-use the same setup
  await this['a loan has been marked as returned by both parties']();
});

Given('a third user {string} exists', async function (name) {
  this[name.toLowerCase()] = await this.createUser({ name, email: `${name.toLowerCase()}@example.com` });
});

Given('a completed loan between {string} and {string}', async function (name1, name2) {
  // returnedRequest already created in Background
  void name1; void name2;
});

When('the borrower submits a 4-star rating and a comment', async function () {
  await this.loginAs('rev-borrower@example.com');
  this.lastResponse = await this.authedRequest('post', '/reviews')
    .send({
      requestId: this.returnedRequest.id,
      rating: 4,
      comment: 'Great lender!',
    });
});

When('{string} submits a 5-star review for {string}', async function (reviewerName, _revieweeName) {
  await this.loginAs(`${reviewerName.toLowerCase()}@example.com`);
  this.lastResponse = await this.authedRequest('post', '/reviews')
    .send({ requestId: this.returnedRequest.id, rating: 5 });
});

When('{string} attempts to submit a review for the loan', async function (name) {
  await this.loginAs(`${name.toLowerCase()}@example.com`);
  this.lastResponse = await this.authedRequest('post', '/reviews')
    .send({ requestId: this.returnedRequest.id, rating: 3 });
});

Then('the review is saved and appears on the lender\'s public profile', async function () {
  assert.strictEqual(this.lastResponse.status, 201);
  const review = await this.prisma.review.findUnique({ where: { id: this.lastResponse.body.id } });
  assert.ok(review);
  assert.strictEqual(review.rating, 4);
});

Then('the review appears on {string}\'s public profile', async function (_name) {
  assert.strictEqual(this.lastResponse.status, 201);
});

Then('they receive a 400 Bad Request error', function () {
  assert.strictEqual(this.lastResponse.status, 400);
});

Then('they receive a 409 Conflict error', function () {
  assert.strictEqual(this.lastResponse.status, 409);
});

Then('they receive a 403 Forbidden error', function () {
  assert.strictEqual(this.lastResponse.status, 403);
});
