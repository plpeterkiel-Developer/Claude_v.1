/**
 * e2e/step_definitions/steps.js
 *
 * Shared step definitions for all E2E feature files.
 * Uses Playwright (chromium) launched via @cucumber/cucumber.
 *
 * Run:  npm run test:e2e
 * (requires both backend and frontend dev servers to be running)
 */

const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { chromium } = require('playwright');
const { expect }   = require('chai');

let browser;
let page;

Before(async function () {
  browser = await chromium.launch({ headless: true });
  page    = await browser.newPage();
});

After(async function () {
  await browser.close();
});

// ---------- Given ----------

Given('the app is running at {string}', function (_url) {
  // The base URL is stored per-step in the When step; this is just documentation.
  this.baseUrl = _url;
});

// ---------- When ----------

When('I visit {string}', async function (path) {
  const base = this.baseUrl || 'http://localhost:5173';
  await page.goto(`${base}${path}`);
});

When('I click the link {string}', async function (text) {
  await page.getByRole('link', { name: text }).click();
});

When('I click the button {string}', async function (text) {
  await page.getByRole('button', { name: text }).click();
});

When('I fill in {string} with {string}', async function (label, value) {
  await page.getByLabel(label).fill(value);
});

// ---------- Then ----------

Then('the page title should contain {string}', async function (text) {
  const title = await page.title();
  expect(title).to.include(text);
});

Then('I should see {string}', async function (text) {
  await page.waitForSelector(`text=${text}`);
  const el = page.getByText(text, { exact: false });
  expect(await el.count()).to.be.greaterThan(0);
});

Then('I should see the heading {string}', async function (text) {
  const h = page.getByRole('heading', { name: text });
  await h.waitFor();
  expect(await h.count()).to.be.greaterThan(0);
});

Then('I should see a link {string}', async function (text) {
  const link = page.getByRole('link', { name: text });
  expect(await link.count()).to.be.greaterThan(0);
});

Then('the URL should contain {string}', async function (fragment) {
  await page.waitForURL(`**${fragment}**`);
  expect(page.url()).to.include(fragment);
});

Then('the URL should be {string}', async function (path) {
  const base = this.baseUrl || 'http://localhost:5173';
  await page.waitForURL(`${base}${path}`);
  expect(page.url()).to.equal(`${base}${path}`);
});

Then('I should see an error message', async function () {
  await page.waitForSelector('.alert-error');
  const el = page.locator('.alert-error');
  expect(await el.count()).to.be.greaterThan(0);
});
