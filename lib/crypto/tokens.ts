import { createHash, randomBytes } from 'crypto';

/**
 * Generates at least 32 cryptographically secure random bytes (256 bits).
 * Encoded as a URL-safe Base64URL string (RFC 4648).
 * 
 * SECURITY MANDATE:
 * 1. The raw token is sent to the candidate in an email/pass URL and is NEVER stored in the database.
 * 2. Only `tokenHash` (SHA-256) is stored in `public.pass_tokens(token_hash)`.
 * 3. Lookup occurs by hashing the incoming token and matching the SHA-256 digest.
 */
export function generateCandidatePassToken(): {
  rawToken: string;
  tokenHash: string;
} {
  const bytes = randomBytes(32); // 256 bits of cryptographic entropy
  const rawToken = bytes.toString('base64url'); // URL-safe representation without padding
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

/**
 * Server-side memory-based rate limiter for public pass lookups.
 * Limits brute-force or automated scanning attempts per IP.
 */
const rateLimitWindowMs = 60 * 1000; // 1 minute window
const maxAttemptsPerWindow = 30; // Max 30 lookups/min per IP
const ipRequestCounts = new Map<string, { count: number; expiresAt: number }>();

export function checkPassRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.expiresAt) {
    ipRequestCounts.set(ip, {
      count: 1,
      expiresAt: now + rateLimitWindowMs,
    });
    return true; // Allowed
  }

  if (record.count >= maxAttemptsPerWindow) {
    return false; // Rate-limited
  }

  record.count++;
  return true; // Allowed
}
