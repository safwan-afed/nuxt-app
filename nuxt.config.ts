export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  css: ['~/assets/main.css'],
  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET,
    keycloakInternalUrl: process.env.KEYCLOAK_INTERNAL_URL,
    keycloakPublicUrl: process.env.KEYCLOAK_PUBLIC_URL,
    keycloakRealm: process.env.KEYCLOAK_REALM,
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET
  }
})
