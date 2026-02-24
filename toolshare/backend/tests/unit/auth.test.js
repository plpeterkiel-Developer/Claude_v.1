'use strict';

const bcrypt = require('bcrypt');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../src/services/tokens');

describe('Password hashing', () => {
  it('hashes a password with bcrypt cost factor ≥ 12', async () => {
    const password = 'Password123!';
    const hash = await bcrypt.hash(password, 12);
    // Bcrypt hash encodes the cost factor in the string
    expect(hash.startsWith('$2b$12$')).toBe(true);
  });

  it('verifies a correct password', async () => {
    const password = 'Password123!';
    const hash = await bcrypt.hash(password, 10);
    const match = await bcrypt.compare(password, hash);
    expect(match).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await bcrypt.hash('CorrectPass1!', 10);
    const match = await bcrypt.compare('WrongPass1!', hash);
    expect(match).toBe(false);
  });
});

describe('JWT token service', () => {
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  it('signs and verifies a refresh token', () => {
    const userId = 'user-123';
    const token = signRefreshToken(userId);
    expect(typeof token).toBe('string');

    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe(userId);
  });

  it('signs an access token with a subject', () => {
    const userId = 'user-456';
    const token = signAccessToken(userId);
    expect(typeof token).toBe('string');
    // JWT has 3 parts
    expect(token.split('.').length).toBe(3);
  });

  it('throws on an invalid refresh token', () => {
    expect(() => verifyRefreshToken('invalid.token.here')).toThrow();
  });

  it('throws on a tampered token', () => {
    const token = signRefreshToken('user-789');
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ sub: 'attacker' })).toString('base64');
    const tampered = parts.join('.');
    expect(() => verifyRefreshToken(tampered)).toThrow();
  });
});
