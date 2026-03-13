import { createHmac, timingSafeEqual } from 'node:crypto'
import { deleteCookie, getCookie, setCookie, type H3Event } from 'h3'

const SESSION_COOKIE = 'kc_session'

interface CookieBaseOptions {
  httpOnly: boolean
  sameSite: 'lax'
  secure: boolean
  path: string
}

export interface UserProfile {
  sub: string
  email?: string
  name?: string
  preferred_username?: string
}

export interface AuthSession {
  user: UserProfile
  refreshToken?: string
  expiresAt: number
}

function cookieBaseOptions(): CookieBaseOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function encodeSigned<T>(value: T, secret: string): string {
  const payload = Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
  const signature = signPayload(payload, secret)
  return `${payload}.${signature}`
}

function decodeSigned<T>(rawValue: string | undefined, secret: string): T | null {
  if (!rawValue) {
    return null
  }

  const parts = rawValue.split('.')
  if (parts.length !== 2) {
    return null
  }

  const [payload, signature] = parts
  const expectedSignature = signPayload(payload, secret)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null
  }
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T
  } catch {
    return null
  }
}

export function setAuthSession(event: H3Event, session: AuthSession, secret: string): void {
  const ttlSeconds = Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000))
  setCookie(event, SESSION_COOKIE, encodeSigned(session, secret), {
    ...cookieBaseOptions(),
    maxAge: ttlSeconds
  })
}

export function getAuthSession(event: H3Event, secret: string): AuthSession | null {
  const session = decodeSigned<AuthSession>(getCookie(event, SESSION_COOKIE), secret)
  if (!session) {
    return null
  }

  if (session.expiresAt <= Date.now()) {
    clearAuthSession(event)
    return null
  }

  return session
}

export function clearAuthSession(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}
