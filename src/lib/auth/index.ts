import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ok, err, type Result } from "@/lib/result";
import { verifyPassword } from "./password";
import {
  createSession,
  destroySession,
  getSessionUserId,
} from "./session";

// Public auth API used by Server Components and Server Actions.
// Single-owner model for now; NextAuth / multi-user is the future scale path.

/** Return the currently logged-in user, or null if no valid session. */
export async function getCurrentUser() {
  const id = await getSessionUserId();
  if (!id) return null;
  // findUnique returns null if the user no longer exists.
  return prisma.user.findUnique({ where: { id } });
}

/** Require an authenticated user; redirect to /login otherwise. */
export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

/**
 * Validate the owner's password. Does NOT create the session — the login
 * action is responsible for calling createSession on success.
 */
export async function authenticate(
  password: string,
): Promise<Result<{ id: string }>> {
  // There is exactly one owner; prefer the OWNER role, fall back to any user.
  const owner =
    (await prisma.user.findFirst({ where: { role: "OWNER" } })) ??
    (await prisma.user.findFirst());

  if (!owner) {
    return err("NO_USER", "لا يوجد مستخدم");
  }

  if (!password) {
    return err("VALIDATION", "كلمة المرور مطلوبة", {
      password: "كلمة المرور مطلوبة",
    });
  }

  const valid = await verifyPassword(password, owner.passwordHash);
  if (!valid) {
    return err("INVALID_CREDENTIALS", "كلمة المرور غير صحيحة", {
      password: "كلمة المرور غير صحيحة",
    });
  }

  return ok({ id: owner.id });
}

// Re-export session helpers so callers can `import { ... } from "@/lib/auth"`.
// (getCurrentUser and requireUser are already exported as declarations above.)
export { createSession, destroySession, getSessionUserId };
