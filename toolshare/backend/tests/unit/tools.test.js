'use strict';

/**
 * Unit tests for tool-related business logic.
 * These tests do NOT require a database — they test pure functions.
 */

// ─── Address masking ──────────────────────────────────────────────────────────
// Replicate the maskAddress logic from routes/tools.js for isolated testing

function maskAddress(tool) {
  const parts = tool.pickupPointAddress.split(',');
  const streetParts = parts[0].trim().split(' ');
  const streetName = streetParts.slice(1).join(' ') || parts[0].trim();
  return { ...tool, pickupPointAddress: streetName, pickupPointNote: undefined };
}

describe('maskAddress', () => {
  it('strips the house number from a standard address', () => {
    const tool = { pickupPointAddress: '14 Elm Street, Copenhagen 2100', pickupPointNote: 'Ring bell' };
    const masked = maskAddress(tool);
    expect(masked.pickupPointAddress).toBe('Elm Street');
    expect(masked.pickupPointAddress).not.toContain('14');
    expect(masked.pickupPointAddress).not.toContain('Copenhagen');
  });

  it('removes pickupPointNote', () => {
    const tool = { pickupPointAddress: '7 Oak Avenue, Aarhus', pickupPointNote: 'Side gate' };
    const masked = maskAddress(tool);
    expect(masked.pickupPointNote).toBeUndefined();
  });

  it('handles an address with no comma', () => {
    const tool = { pickupPointAddress: '99 Rose Lane', pickupPointNote: null };
    const masked = maskAddress(tool);
    expect(masked.pickupPointAddress).toBe('Rose Lane');
  });

  it('handles a single-word street name', () => {
    const tool = { pickupPointAddress: '3 Broadway, Copenhagen 1234', pickupPointNote: null };
    const masked = maskAddress(tool);
    expect(masked.pickupPointAddress).toBe('Broadway');
  });

  it('does not expose postcode', () => {
    const tool = { pickupPointAddress: '5 Maple Road, Copenhagen 2300', pickupPointNote: null };
    const masked = maskAddress(tool);
    expect(masked.pickupPointAddress).not.toMatch(/\d{4}/);
  });
});

// ─── Rating calculation ───────────────────────────────────────────────────────

function calculateAverageRating(ratings) {
  if (!ratings.length) return null;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

describe('calculateAverageRating', () => {
  it('returns null for empty ratings array', () => {
    expect(calculateAverageRating([])).toBeNull();
  });

  it('calculates a simple average', () => {
    expect(calculateAverageRating([4, 5, 3])).toBe(4);
  });

  it('rounds to one decimal place', () => {
    expect(calculateAverageRating([4, 5])).toBe(4.5);
    expect(calculateAverageRating([1, 2, 3])).toBe(2);
    expect(calculateAverageRating([4, 4, 5])).toBe(4.3);
  });

  it('handles a single rating', () => {
    expect(calculateAverageRating([5])).toBe(5);
  });

  it('clamps correctly for min/max ratings', () => {
    expect(calculateAverageRating([1])).toBe(1);
    expect(calculateAverageRating([5])).toBe(5);
    expect(calculateAverageRating([1, 1, 1, 1, 5])).toBe(1.8);
  });
});

// ─── Request status transitions ───────────────────────────────────────────────

const VALID_TRANSITIONS = {
  pending:  ['accepted', 'declined', 'cancelled'],
  accepted: ['returned', 'overdue'],
  overdue:  ['returned'],
  declined: [],
  returned: [],
  cancelled: [],
};

function canTransition(currentStatus, targetStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

describe('canTransition (request status state machine)', () => {
  it('allows accept from pending', () => {
    expect(canTransition('pending', 'accepted')).toBe(true);
  });

  it('allows decline from pending', () => {
    expect(canTransition('pending', 'declined')).toBe(true);
  });

  it('allows cancel from pending', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true);
  });

  it('allows return from accepted', () => {
    expect(canTransition('accepted', 'returned')).toBe(true);
  });

  it('allows overdue from accepted', () => {
    expect(canTransition('accepted', 'overdue')).toBe(true);
  });

  it('allows return from overdue', () => {
    expect(canTransition('overdue', 'returned')).toBe(true);
  });

  it('does not allow accept from returned', () => {
    expect(canTransition('returned', 'accepted')).toBe(false);
  });

  it('does not allow cancel from accepted', () => {
    expect(canTransition('accepted', 'cancelled')).toBe(false);
  });

  it('does not allow transitions from terminal states', () => {
    expect(canTransition('declined', 'pending')).toBe(false);
    expect(canTransition('cancelled', 'pending')).toBe(false);
    expect(canTransition('returned', 'overdue')).toBe(false);
  });
});
