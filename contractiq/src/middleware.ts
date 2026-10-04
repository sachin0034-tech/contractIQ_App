import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_PATHS, DEFAULT_AUTHED_PATH, PROTECTED_PATH_PREFIXES } from '@/lib/constants';
import { getSupabasePublicEnv } from '@/lib/config';
import { redirectWithCookies, updateSession } from '@/lib/supabase/middleware';

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PATH_PREFIXES.some((p) => matchesPrefix(pathname, p));
  const isAuthPage = AUTH_PATHS.some((p) => matchesPrefix(pathname, p));

  const env = getSupabasePublicEnv();
  if (!env) {
    // Supabase is not configured: public pages still render, everything that needs auth fails loudly.
    if (isProtected || isAuthPage) {
      return new NextResponse(
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request, env);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);
    return redirectWithCookies(url, response);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_AUTHED_PATH;
    url.search = '';
    return redirectWithCookies(url, response);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$).*)'],
};
