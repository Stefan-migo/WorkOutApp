import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

const publicPaths = ['/login', '/auth/callback', '/favicon.ico']
const publicPrefixes = ['/_next/']

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Allow public paths unconditionally
  if (publicPaths.some(p => pathname === p) || publicPrefixes.some(p => pathname.startsWith(p))) {
    return response
  }

  // No authenticated user → redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
