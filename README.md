# Nuxt Keycloak Login App

Nuxt 3 application that authenticates with Keycloak using email/password (Direct Access Grant). Uses a confidential Keycloak client with signed session cookies.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Nuxt App                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  Pages                    Middleware              Server API                  │
│  /login (guest)    →      guest.ts         →     /api/auth/login (POST)       │
│  /admin (auth)     ←      auth.ts         ←     /api/auth/me (GET)            │
│  / (redirect)             validates cookie       /api/auth/logout (GET)       │
└──────────────────────────────────────────────────────────────────────────────┘
         │                              │                         │
         │                              │                         │
         ▼                              ▼                         ▼
   Browser cookie              kc_session (signed)         Keycloak token
   (after login)               httpOnly, sameSite          /userinfo endpoints
```

- **Frontend**: Login form, protected admin page, route middleware.
- **Backend**: Auth API exchanges credentials with Keycloak and stores a signed session cookie.
- **Session**: `kc_session` cookie contains user profile and refresh token (server-side only).

---

## Quick Start

### Prerequisites

- Keycloak running (see `../keycloak/README.md` for setup)
- Keycloak client `nuxt-app` created with Direct Access Grants enabled

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

- `SESSION_SECRET` — long random string for signing cookies
- `KEYCLOAK_CLIENT_SECRET` — from Keycloak client Credentials tab

### 2. Start with Docker

```bash
# Ensure Keycloak is running first
cd ../keycloak && docker compose up -d

# Start Nuxt
cd ../nuxt-app
docker compose up -d
```

- **App**: http://localhost:3000

### 3. Run locally (without Docker)

```bash
npm install
npm run dev
```

Set in `.env`:

- `KEYCLOAK_INTERNAL_URL=http://localhost:8080`
- `KEYCLOAK_PUBLIC_URL=http://localhost:8080`

---

## App Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Redirects to `/login` or `/admin` based on session |
| `/login` | Guest only | Login form (email + password) |
| `/admin` | Authenticated | Protected admin home |

**Middleware**

- `auth` — Protects `/admin`; redirects to `/login` if not authenticated
- `guest` — Redirects authenticated users from `/login` to `/admin`

---

## Login Integration

### Flow

1. User visits `/login` and submits email/password.
2. `login.vue` sends `POST /api/auth/login` with `{ email, password }`.
3. Nuxt server calls Keycloak token endpoint (`grant_type=password`).
4. On success, server fetches user info and sets signed `kc_session` cookie.
5. Client redirects to `/admin`.
6. `auth` middleware validates session via `GET /api/auth/me` on protected routes.

---

## API Documentation

### POST `/api/auth/login`

Authenticate with email and password. Sets signed session cookie on success.

**Request**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

**Body**

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email (Keycloak username) |
| `password` | string | Yes | User password |

**Success** `200 OK`

```json
{
  "success": true
}
```

Sets `kc_session` cookie (httpOnly, signed).

**Errors**

| Status | Message |
|--------|---------|
| `400` | Email and password are required. |
| `401` | Invalid email or password. |
| `401` | Unable to authenticate user. |
| `401` | Unable to load user profile. |
| `500` | Server auth configuration is missing client secret. |

---

### GET `/api/auth/me`

Returns current authentication state. Used by middleware and client.

**Request**

- Include `kc_session` cookie from prior successful login.

**Success** `200 OK` (authenticated)

```json
{
  "authenticated": true,
  "user": {
    "sub": "abc-123-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "preferred_username": "johndoe"
  },
  "expiresAt": 1234567890123
}
```

| Field | Type | Description |
|-------|------|-------------|
| `authenticated` | boolean | `true` if session valid |
| `user` | object | Keycloak user profile |
| `user.sub` | string | Keycloak subject ID |
| `user.email` | string | Email |
| `user.name` | string | Full name |
| `user.preferred_username` | string | Username |
| `expiresAt` | number | Session expiry (ms) |

**Success** `200 OK` (unauthenticated)

```json
{
  "authenticated": false,
  "user": null
}
```

---

### GET `/api/auth/logout`

Logs out: revokes Keycloak refresh token, clears session, redirects to Keycloak end-session, then to `/login`.

**Request**

- Optional: `kc_session` cookie (used to revoke refresh token if present).

**Response**

- `302` redirect to Keycloak logout → `{origin}/login`.

Use full page navigation (e.g. `window.location` or `<a href>`).

---

## Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `SESSION_SECRET` | (random string) | Secret for signing session cookies (required) |
| `KEYCLOAK_INTERNAL_URL` | `http://keycloak:8080` | Keycloak URL from Nuxt (Docker: `keycloak` hostname) |
| `KEYCLOAK_PUBLIC_URL` | `http://localhost:8080` | Keycloak URL for browser redirects (logout) |
| `KEYCLOAK_REALM` | `master` | Keycloak realm |
| `KEYCLOAK_CLIENT_ID` | `nuxt-app` | Keycloak client ID |
| `KEYCLOAK_CLIENT_SECRET` | (from Keycloak) | Client secret (required) |

**Docker**: Use `KEYCLOAK_INTERNAL_URL=http://keycloak:8080` (container hostname).

**Local**: Use `KEYCLOAK_INTERNAL_URL=http://localhost:8080`.

---

## Local Development

```bash
npm install
npm run dev
```

- App: http://localhost:3000
- Keycloak must be reachable at `KEYCLOAK_INTERNAL_URL` (e.g. `http://localhost:8080` when running Keycloak locally).

---

## Project Structure

| Path | Description |
|------|-------------|
| `server/utils/keycloak.ts` | Keycloak endpoints and config |
| `server/utils/session.ts` | Session cookie encode/decode, sign/verify |
| `server/api/auth/login.post.ts` | Login handler |
| `server/api/auth/logout.get.ts` | Logout handler |
| `server/api/auth/me.get.ts` | Session state handler |
| `pages/login.vue` | Login page |
| `pages/admin.vue` | Protected admin page |
| `middleware/auth.ts` | Protects authenticated routes |
| `middleware/guest.ts` | Redirects logged-in users from login |
| `nuxt.config.ts` | Runtime config (Keycloak vars) |

---

## Security

- Token and logout requests use confidential client auth (`client_secret_basic`).
- Do not leave `KEYCLOAK_CLIENT_SECRET` empty.
- Session cookie is httpOnly, signed with `SESSION_SECRET`, and uses `sameSite: lax`.
