import { getAuthSession } from '../../utils/session'
import { type KeycloakRuntimeConfig } from '../../utils/keycloak'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event) as unknown as KeycloakRuntimeConfig & { sessionSecret: string }
  const session = getAuthSession(event, config.sessionSecret)

  if (!session) {
    return {
      authenticated: false,
      user: null
    }
  }

  return {
    authenticated: true,
    user: session.user,
    expiresAt: session.expiresAt
  }
})
