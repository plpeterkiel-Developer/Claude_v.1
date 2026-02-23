/**
 * cucumber.js — E2E Cucumber configuration for the frontend
 *
 * Run:  npm run test:e2e
 * (both backend on :3001 and frontend on :5173 must be running)
 *
 * Run a single feature:
 *   npx cucumber-js e2e/features/browsing.feature
 */
module.exports = {
  default: {
    require: ['e2e/step_definitions/**/*.js'],
    paths:   ['e2e/features/**/*.feature'],
    format:  [
      'progress-bar',
      'html:reports/e2e-cucumber-report.html',
    ],
    forceExit: true,
  },
};
