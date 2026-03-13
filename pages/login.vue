<script setup lang="ts">
definePageMeta({
  middleware: 'guest'
})

const route = useRoute()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const inlineError = ref('')

const authError = computed(() => {
  const value = route.query.error
  if (typeof value !== 'string') {
    return ''
  }
  return value.replaceAll('_', ' ')
})

const displayError = computed(() => inlineError.value || authError.value)

async function handleLogin() {
  inlineError.value = ''

  if (!email.value.trim() || !password.value.trim()) {
    inlineError.value = 'Email and password are required.'
    return
  }

  isLoading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })
    await navigateTo('/admin')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string }; statusMessage?: string }
    inlineError.value = fetchErr?.data?.message || fetchErr?.statusMessage || 'Login failed.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="auth-shell">
    <section class="card auth-card">
      <div class="auth-logo">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>

      <p class="eyebrow">Identity Access Management</p>
      <h1>Welcome back</h1>
      <p class="subtitle">
        Sign in with your email and password.
      </p>

      <form class="login-form" @submit.prevent="handleLogin">
        <label class="form-label" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          class="form-input"
          type="email"
          autocomplete="email"
          placeholder="you@company.com"
        />

        <label class="form-label" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          class="form-input"
          type="password"
          autocomplete="current-password"
          placeholder="Enter your password"
        />

        <button class="btn auth-btn" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <div v-if="displayError" class="notice">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ displayError }}
      </div>
    </section>

    <p class="auth-footer">
      &copy; {{ new Date().getFullYear() }} Admin Portal
    </p>
  </main>
</template>
