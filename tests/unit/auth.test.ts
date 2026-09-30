import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSessionValue, verifySessionValue } from '@/lib/auth';

describe('signed session', () => {
  const originalSecret = process.env.AUTH_SECRET;
  const user = { id: 'user-1', email: 'Admin@Example.com', role: 'SUPER_ADMIN' };

  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret-with-at-least-thirty-two-characters';
  });

  afterEach(() => {
    process.env.AUTH_SECRET = originalSecret;
  });

  it('creates and verifies a signed session', () => {
    const token = createSessionValue(user, 1_000);
    expect(verifySessionValue(token, 2_000)).toMatchObject({
      id: 'user-1',
      email: 'admin@example.com',
      role: 'SUPER_ADMIN',
    });
  });

  it('rejects tampered and expired sessions', () => {
    const token = createSessionValue(user, 1_000);
    const [payload, signature] = token.split('.');
    expect(verifySessionValue(`${payload}x.${signature}`, 2_000)).toBeNull();
    expect(verifySessionValue(token, 1_000 + 8 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});
