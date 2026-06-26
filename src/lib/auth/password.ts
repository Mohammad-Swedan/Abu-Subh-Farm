import bcrypt from "bcryptjs";

// Password hashing helpers. bcrypt cost factor 10 is a sensible default for a
// single-owner app (fast enough on cheap hosting, still resistant to offline attacks).

/** Hash a plaintext password for storage. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** Constant-time-ish comparison of a plaintext password against a stored hash. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
