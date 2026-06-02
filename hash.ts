import crypto from "crypto";

// Default parameters for high-performance and secure password hashing
const ITERATIONS = 12000;
const KEY_LEN = 64;
const DIGEST = "sha512";

/**
 * Checks if a string conforms to the pbkdf2 hashed password format: `pbkdf2$iterations$salt$hash`
 */
export function isHashed(password: string): boolean {
  if (!password) return false;
  return password.startsWith("pbkdf2$");
}

/**
 * Hash a password securely with a randomized salt using the industry-standard PBKDF2-SHA512 construct
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
}

/**
 * Validates a plain password against a stored hash string.
 * Supports secure timing-attack resolution, and falls back gracefully to plain-text for legacy users.
 */
export function verifyPassword(password: string, hashed: string): boolean {
  if (!password || !hashed) return false;

  // Gracefully handle legacy passwords that were created before implementing hashing
  if (!isHashed(hashed)) {
    return password === hashed;
  }

  try {
    const parts = hashed.split("$");
    if (parts.length !== 4) return false;

    const [, iterationsStr, salt, hash] = parts;
    const iterations = parseInt(iterationsStr, 10);
    
    const testHash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST).toString("hex");
    
    const buf1 = Buffer.from(hash, "hex");
    const buf2 = Buffer.from(testHash, "hex");
    
    if (buf1.length !== buf2.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(buf1, buf2);
  } catch (err) {
    console.error("[Crypto Engine] Error verifying hash signature, falling back to false authentication state.", err);
    return false;
  }
}
