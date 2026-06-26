import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

// Server-only session helpers. We keep sessions stateless: the cookie value is
// `${userId}.${hmac}` where the HMAC is keyed by SESSION_SECRET. This is enough
// for a single-owner app. NextAuth / a DB-backed session table is the future
// scale path once multi-user lands.
//
// NOTE: these functions are intended to run server-side only. We intentionally
// skip the `server-only` import (package may not be installed) and rely on
// usage discipline instead.

const COOKIE_NAME = "asf_session";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

// Fall back to a dev constant if the secret is missing so local dev still works.
const SECRET = process.env.SESSION_SECRET ?? "dev-insecure-session-secret";

/** Build a signed cookie token for a user id: `${userId}.${hmacHex}`. */
function sign(userId: string): string {
  const hmacHex = createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${userId}.${hmacHex}`;
}

/**
 * Verify a token and return the userId if the HMAC matches, else null.
 * Splits on the LAST "." so user ids containing dots are handled correctly.
 */
export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const userId = token.slice(0, lastDot);
  const providedHex = token.slice(lastDot + 1);

  const expectedHex = createHmac("sha256", SECRET).update(userId).digest("hex");

  // Guard against length mismatch before timingSafeEqual (it throws otherwise).
  const provided = Buffer.from(providedHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");
  if (provided.length !== expected.length || provided.length === 0) return null;

  return timingSafeEqual(provided, expected) ? userId : null;
}

/** Create the session cookie for the given user id. */
export async function createSession(userId: string): Promise<void> {
  (await cookies()).set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
}

/** Remove the session cookie (logout). */
export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

/** Read and verify the session cookie, returning the userId or null. */
export async function getSessionUserId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return verifyToken(value);
}

export { COOKIE_NAME };
