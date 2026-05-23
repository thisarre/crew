import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// Inline cookie verification (middleware runs on the Edge/Node layer and
// cannot import server-only helpers from src/lib/auth/session.ts).
// The logic mirrors `decode()` + `sign()` in session.ts.
// ---------------------------------------------------------------------------

const COOKIE_NAME = 'crew_session';

type SessionPayload = {
  profileId: string;
  isAdmin: boolean;
  ts: number;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  return 'crew-dev-fallback-secret-please-override-in-env';
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function decode(token: string): SessionPayload | null {
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const base = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (sign(base) !== signature) return null;
  try {
    const json = Buffer.from(base, 'base64url').toString('utf8');
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Parse session cookie (once) ----------------------------------------
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? decode(token) : null;

  // --- Auth page: redirect logged-in users --------------------------------
  if (pathname === '/') {
    if (session) {
      const dest = session.isAdmin ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // --- Admin routes: require admin session --------------------------------
  if (pathname.startsWith('/admin')) {
    if (!session?.isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // --- Protected member routes --------------------------------------------
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/service-day')
  ) {
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — only run middleware on relevant paths.
// Excludes API routes, Next.js internals, static assets, and service worker.
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - /api/*          (API routes handle their own auth)
     *  - /_next/*        (Next.js internals / static files)
     *  - /sw.js          (service worker)
     *  - /icon*          (icons / favicons)
     *  - /manifest*      (PWA manifest)
     *  - /offline.html   (offline fallback page)
     */
    '/((?!api|_next|sw\\.js|icon|manifest|offline\\.html).*)',
  ],
};
