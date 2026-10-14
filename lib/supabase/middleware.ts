import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Updates the user's auth session on each incoming request.
 * Required by Supabase SSR to refresh expired tokens and keep cookies synchronized.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('dummy') &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey.length > 20
  );

  if (!isConfigured || !supabaseUrl || !supabaseAnonKey) {
    // In local demo mode, allow direct access without external Supabase auth server
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid reading user from auth.getSession() in middleware as it is insecure.
  // getUser() validates the token against the Supabase Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. PUBLIC ROUTES: Always accessible without authentication
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/pass') || // Public candidate interview pass
    pathname === '/unauthorized' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.includes('.'); // Static files (favicon, robots, etc.)

  if (!user && !isPublicRoute) {
    // User is not logged in, redirect to login with return path
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
