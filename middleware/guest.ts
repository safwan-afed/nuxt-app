export default defineNuxtRouteMiddleware(async () => {
  const headers = process.server ? useRequestHeaders(['cookie']) : undefined

  const session = await $fetch<{ authenticated: boolean }>('/api/auth/me', {
    headers
  })

  if (session.authenticated) {
    return navigateTo('/admin')
  }
})
