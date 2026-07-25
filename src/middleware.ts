import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

const publicPaths = ['/login', '/auth/callback', '/favicon.ico']
const publicPrefixes = ['/_next/']

export async function middleware(request: NextRequest) {
  const res = await updateSession(request)
  const { pathname } = request.nextUrl

  // Allow public paths unconditionally
  if (publicPaths.some(p => pathname === p) || publicPrefixes.some(p => pathname.startsWith(p))) {
    return res
  }

  // After updateSession refreshed the cookies, check if auth tokens are present
  const hasSession = res.cookies.has('sb-access-token') || res.cookies.has('sb-refresh-token')

  if (!hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
