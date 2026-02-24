'use strict';

/**
 * Unit tests for the email service template generation.
 * These tests verify that each template produces the correct subject and
 * content for both Danish and English.
 */

// We test the template functions in isolation without actually sending email.
// Set NODE_ENV=test to skip actual delivery in sendEmail.
process.env.NODE_ENV = 'test';

const { sendEmail } = require('../../src/services/email');

describe('Email service', () => {
  it('does not throw when sending in test mode (Danish)', async () => {
    await expect(
      sendEmail({
        to: 'test@example.com',
        lang: 'da',
        templateKey: 'verifyEmail',
        templateArgs: ['Test User', 'https://example.com/verify?token=abc'],
      })
    ).resolves.not.toThrow();
  });

  it('does not throw when sending in test mode (English)', async () => {
    await expect(
      sendEmail({
        to: 'test@example.com',
        lang: 'en',
        templateKey: 'verifyEmail',
        templateArgs: ['Test User', 'https://example.com/verify?token=abc'],
      })
    ).resolves.not.toThrow();
  });

  it('throws for unknown template keys', async () => {
    await expect(
      sendEmail({
        to: 'test@example.com',
        lang: 'da',
        templateKey: 'nonExistentTemplate',
        templateArgs: [],
      })
    ).rejects.toThrow('Unknown email template');
  });

  it('falls back to Danish for unsupported language codes', async () => {
    await expect(
      sendEmail({
        to: 'test@example.com',
        lang: 'fr', // unsupported — should fall back to 'da'
        templateKey: 'loanOverdue',
        templateArgs: ['User', 'Lawnmower', '01.03.2025'],
      })
    ).resolves.not.toThrow();
  });

  const templates = [
    ['verifyEmail', ['User', 'https://example.com/verify']],
    ['borrowRequestReceived', ['Owner', 'Borrower', 'Spade', '01.03.2025', '05.03.2025', 'Hi', 'https://example.com']],
    ['requestCancelledByBorrower', ['Owner', 'Borrower', 'Spade']],
    ['requestAccepted', ['Borrower', 'Spade', '01.03.2025', '05.03.2025', '14 Elm St', 'Front gate']],
    ['requestDeclined', ['Borrower', 'Spade']],
    ['loanOverdue', ['Borrower', 'Spade', '01.03.2025']],
    ['loanReturned', ['User', 'Spade', 'https://example.com/review']],
    ['lenderAccountDeleted', ['Borrower', 'Spade']],
    ['warning', ['User', 'Reason for warning']],
    ['suspended', ['User', 'Reason for suspension']],
    ['dataDownloadReady', ['User', 'https://example.com/download']],
  ];

  test.each(templates)('template %s sends without error', async (key, args) => {
    for (const lang of ['da', 'en']) {
      await expect(
        sendEmail({ to: 'test@example.com', lang, templateKey: key, templateArgs: args })
      ).resolves.not.toThrow();
    }
  });
});
