import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SECRET_KEY = new TextEncoder().encode('CLAVE_SECRETA_SUPER_SEGURA_CAMBIALA_SI_QUIERES')

export async function createSession(userId: number) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 día
  const session = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expires)
    .sign(SECRET_KEY)

  const cookieStore = await cookies()
  cookieStore.set('session', session, { expires, httpOnly: true })
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null

  try {
    const { payload } = await jwtVerify(session, SECRET_KEY)
    return payload as { userId: number }
  } catch (error) {
    return null
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}

// Función para proteger páginas
export async function verificarSesion() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session.userId
}