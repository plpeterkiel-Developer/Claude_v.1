'use strict';

/**
 * Unit tests for input validation patterns.
 */

// ─── Password validation rules (mirroring the auth route) ─────────────────────

function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8) errors.push('Must be at least 8 characters.');
  if (!/[A-Z]/.test(password)) errors.push('Must contain at least one uppercase letter.');
  if (!/\d/.test(password)) errors.push('Must contain at least one number.');
  return errors;
}

describe('Password validation', () => {
  it('accepts a valid password', () => {
    expect(validatePassword('Password123!')).toHaveLength(0);
  });

  it('rejects a password that is too short', () => {
    const errors = validatePassword('Pass1!');
    expect(errors.some((e) => e.includes('8 characters'))).toBe(true);
  });

  it('rejects a password without an uppercase letter', () => {
    const errors = validatePassword('password123!');
    expect(errors.some((e) => e.includes('uppercase'))).toBe(true);
  });

  it('rejects a password without a number', () => {
    const errors = validatePassword('PasswordOnly!');
    expect(errors.some((e) => e.includes('number'))).toBe(true);
  });

  it('rejects an empty password', () => {
    expect(validatePassword('')).not.toHaveLength(0);
  });
});

// ─── Date range validation ────────────────────────────────────────────────────

function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime())) return 'Start date is invalid.';
  if (isNaN(end.getTime())) return 'End date is invalid.';
  if (end <= start) return 'End date must be after start date.';
  return null;
}

describe('Date range validation', () => {
  it('accepts a valid date range', () => {
    expect(validateDateRange('2025-03-01', '2025-03-05')).toBeNull();
  });

  it('rejects same start and end date', () => {
    expect(validateDateRange('2025-03-01', '2025-03-01')).toBeTruthy();
  });

  it('rejects end date before start date', () => {
    expect(validateDateRange('2025-03-05', '2025-03-01')).toBeTruthy();
  });

  it('rejects an invalid start date', () => {
    expect(validateDateRange('not-a-date', '2025-03-05')).toBeTruthy();
  });

  it('rejects an invalid end date', () => {
    expect(validateDateRange('2025-03-01', 'not-a-date')).toBeTruthy();
  });
});

// ─── Rating validation ────────────────────────────────────────────────────────

function validateRating(rating) {
  const n = parseInt(rating, 10);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

describe('Rating validation', () => {
  [1, 2, 3, 4, 5].forEach((r) => {
    it(`accepts rating ${r}`, () => {
      expect(validateRating(r)).toBe(true);
    });
  });

  [0, 6, -1, 1.5, NaN, null, 'five'].forEach((r) => {
    it(`rejects invalid rating ${JSON.stringify(r)}`, () => {
      expect(validateRating(r)).toBe(false);
    });
  });
});
