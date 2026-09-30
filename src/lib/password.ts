import crypto from 'crypto';

/**
 * Hashes a plaintext password using PBKDF2 with SHA-512 and random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string
 */
export function verifyPassword(password: string, combinedHash?: string | null): boolean {
  if (!password || !combinedHash) return false;
  try {
    const parts = combinedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const originalBuf = Buffer.from(originalHash, 'hex');
    if (hashBuf.length !== originalBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, originalBuf);
  } catch {
    return false;
  }
}
