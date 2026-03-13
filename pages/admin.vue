<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { data } = await useFetch('/api/auth/me', {
  headers: process.server ? useRequestHeaders(['cookie']) : undefined
})

const user = computed(() => data.value?.user)
</script>

<template>
  <main class="admin-layout">
    <aside class="admin-sidebar">
      <div>
        <p class="sidebar-label">Control Panel</p>
        <h2>Admin Home</h2>
      </div>

      <nav class="sidebar-nav">
        <a class="nav-link active" href="/admin">Dashboard</a>
      </nav>

      <a class="btn secondary logout-btn" href="/api/auth/logout">Logout</a>
    </aside>

    <section class="admin-content">
      <header class="content-header">
        <h1>Welcome back</h1>
        <p>You are authorized with Keycloak authentication.</p>
      </header>

      <section class="card profile-card">
        <h3>Account Summary</h3>
        <div class="kv">
          <div><strong>Subject ID:</strong> {{ user?.sub || '-' }}</div>
          <div><strong>Name:</strong> {{ user?.name || '-' }}</div>
          <div><strong>Email:</strong> {{ user?.email || '-' }}</div>
          <div><strong>Username:</strong> {{ user?.preferred_username || '-' }}</div>
        </div>
      </section>
    </section>
  </main>
</template>
