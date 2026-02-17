import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode('CLAVE_SECRETA_SUPER_SEGURA_CAMBIALA_SI_QUIERES')

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  // Si no hay sesión y no está en el login, lo mandamos al login
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si hay sesión, verificamos que sea válida
  if (session) {
    try {
      await jwtVerify(session, SECRET_KEY)
      // Si está en login y ya tiene sesión, lo mandamos al inicio
      if (request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      // Si la sesión es falsa/expirada, borramos cookie y al login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}