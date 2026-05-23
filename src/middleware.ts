import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Inline cookie verification using Web Crypto API (Edge-compatible).
// Mirrors the HMAC SHA-256 logic from session.ts but without node:crypto.
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

// Base64url encode/decode helpers (no Node Buffer in Edge)
function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function sign(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return base64urlEncode(new Uint8Array(signature));
}

async function decode(token: string): Promise<SessionPayload | null> {
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const base = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = await sign(base);
  if (expected !== signature) return null;
  try {
    const json = new TextDecoder().decode(base64urlDecode(base));
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Parse session cookie (once) ----------------------------------------
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await decode(token) : null;

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
    pathname.startsWith('/service-day') ||
    pathname.startsWith('/settings')
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
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    '/((?!api|_next|sw\\.js|icon|manifest|offline\\.html).*)',
  ],
};
