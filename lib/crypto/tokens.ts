import { createHash, randomBytes } from 'crypto';

/**
 * Generates an unguessable 256-bit cryptographic token and its SHA-256 hash.
 * 
 * SECURITY MANDATE:
 * 1. The raw token is sent to the candidate in an email and is NEVER stored in the database.
 * 2. Only `tokenHash` (SHA-256) is stored in `public.pass_tokens(token_hash)`.
 * 3. Lookup occurs by hashing incoming candidate URL tokens and matching the hash.
 */
export function generateCandidatePassToken(): {
  rawToken: string;
  tokenHash: string;
} {
  const rawToken = randomBytes(32).toString('hex'); // 64 hex characters (256 bits)
  const tokenHash = hashToken(rawToken);

  return { rawToken, tokenHash };
}

/**
 * Computes SHA-256 hash of a candidate's pass token.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Format timestamps in Indian Standard Time (Asia/Kolkata).
 */
export function formatToIST(date: string | Date, includeSeconds = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: includeSeconds ? 'medium' : 'short',
    hour12: true,
  }).format(d);
}
