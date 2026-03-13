import { readBody } from 'h3'
import {
  clientBasicAuthHeader,
  tokenEndpoint,
  userInfoEndpoint,
  type KeycloakRuntimeConfig
} from '../../utils/keycloak'
import {
  setAuthSession,
  type UserProfile
} from '../../utils/session'

interface LoginBody {
  email?: string
  password?: string
}

interface TokenResponse {
  access_token?: string
  id_token?: string
  refresh_token?: string
  expires_in?: number
}

function toUserProfile(raw: Record<string, unknown>): UserProfile {
  return {
    sub: String(raw.sub ?? ''),
    email: typeof raw.email === 'string' ? raw.email : undefined,
    name: typeof raw.name === 'string' ? raw.name : undefined,
    preferred_username:
      typeof raw.preferred_username === 'string' ? raw.preferred_username : undefined
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event) as unknown as KeycloakRuntimeConfig & { sessionSecret: string }
  const body = await readBody<LoginBody>(event)

  const email = (body.email || '').trim()
  const password = body.password || ''

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required.'
    })
  }
  if (!config.keycloakClientSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server auth configuration is missing client secret.'
    })
  }

  const tokenPayload = new URLSearchParams({
    grant_type: 'password',
    username: email,
    password,
    scope: 'openid profile email'
  })

  const tokenResponse = await fetch(tokenEndpoint(config), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: clientBasicAuthHeader(config)
    },
    body: tokenPayload.toString()
  })

  if (!tokenResponse.ok) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password.'
    })
  }

  const tokenData = (await tokenResponse.json()) as TokenResponse
  const accessToken = tokenData.access_token ?? ''

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unable to authenticate user.'
    })
  }

  const userInfoResponse = await fetch(userInfoEndpoint(config), {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if (!userInfoResponse.ok) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unable to load user profile.'
    })
  }

  const claims = (await userInfoResponse.json()) as Record<string, unknown>
  const expiresInSeconds = Number(tokenData.expires_in ?? 300)

  // Keep cookie payload small to avoid browser cookie-size limits.
  setAuthSession(
    event,
    {
      user: toUserProfile(claims),
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + expiresInSeconds * 1000
    },
    config.sessionSecret
  )

  return { success: true }
})
