/**
 * cucumber.js — Cucumber configuration
 *
 * Run all tests:          npm test
 * Run with HTML report:   npm run test:report
 * Run one feature:        npx cucumber-js features/auth.feature
 */
module.exports = {
  default: {
    require: [
      'support/**/*.js',        // world + any global hooks
      'step_definitions/**/*.js',
    ],
    paths: ['features/**/*.feature'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
    ],
    forceExit: true,            // close the supertest server after tests
  },
};
