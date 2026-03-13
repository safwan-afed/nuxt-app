export interface KeycloakRuntimeConfig {
  keycloakInternalUrl: string
  keycloakPublicUrl?: string
  keycloakRealm: string
  keycloakClientId: string
  keycloakClientSecret: string
}

function trimRightSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function realmPath(config: KeycloakRuntimeConfig): string {
  return `/realms/${encodeURIComponent(config.keycloakRealm)}/protocol/openid-connect`
}

export function tokenEndpoint(config: KeycloakRuntimeConfig): string {
  return `${trimRightSlash(config.keycloakInternalUrl)}${realmPath(config)}/token`
}

export function userInfoEndpoint(config: KeycloakRuntimeConfig): string {
  return `${trimRightSlash(config.keycloakInternalUrl)}${realmPath(config)}/userinfo`
}

export function logoutEndpoint(config: KeycloakRuntimeConfig): string {
  return `${trimRightSlash(config.keycloakInternalUrl)}${realmPath(config)}/logout`
}

export function authEndpoint(config: KeycloakRuntimeConfig): string {
  const base = config.keycloakPublicUrl ?? config.keycloakInternalUrl
  return `${trimRightSlash(base)}${realmPath(config)}/auth`
}

export function browserLogoutEndpoint(config: KeycloakRuntimeConfig): string {
  const base = config.keycloakPublicUrl ?? config.keycloakInternalUrl
  return `${trimRightSlash(base)}${realmPath(config)}/logout`
}

export function clientBasicAuthHeader(config: KeycloakRuntimeConfig): string {
  const credentials = `${config.keycloakClientId}:${config.keycloakClientSecret}`
  const encoded = Buffer.from(credentials, 'utf8').toString('base64')
  return `Basic ${encoded}`
}
