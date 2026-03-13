import { getRequestURL, sendRedirect } from 'h3'
import {
  browserLogoutEndpoint,
  clientBasicAuthHeader,
  logoutEndpoint,
  type KeycloakRuntimeConfig
} from '../../utils/keycloak'
import { clearAuthSession, getAuthSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event) as unknown as KeycloakRuntimeConfig & { sessionSecret: string }
  const session = getAuthSession(event, config.sessionSecret)
  const requestUrl = getRequestURL(event)
  const postLogoutRedirectUri = `${requestUrl.origin}/login`

  if (session?.refreshToken && config.keycloakClientSecret) {
    const payload = new URLSearchParams({
      client_id: config.keycloakClientId,
      refresh_token: session.refreshToken
    })

    // Best-effort Keycloak session termination.
    await fetch(logoutEndpoint(config), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: clientBasicAuthHeader(config)
      },
      body: payload.toString()
    }).catch(() => undefined)
  }

  clearAuthSession(event)

  const params = new URLSearchParams({
    client_id: config.keycloakClientId,
    post_logout_redirect_uri: postLogoutRedirectUri
  })

  return sendRedirect(event, `${browserLogoutEndpoint(config)}?${params.toString()}`, 302)
})
