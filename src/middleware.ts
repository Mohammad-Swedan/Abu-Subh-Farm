import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Coarse edge gate. We only check for the PRESENCE of the session cookie here —
// HMAC verification is intentionally NOT done in middleware (it runs on the edge
// runtime and we keep it cheap). The real verification happens server-side in
// requireUser(). NextAuth / multi-user is the future scale path.

const COOKIE_NAME = "asf_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  const isLogin = pathname === "/login";

  // Already-authenticated users should not see the login page.
  if (isLogin) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Any other (matched) path requires a session cookie.
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, the favicon, and
  // files with an extension (static assets). /login is included so we can
  // branch on it above.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
