# SPM-92 — User Login / Auth Flow

**Branch:** `feature/SPM-92-user-login`
**Status:** Complete

---

## What this feature delivers

Wires up the frontend auth flow so the app correctly identifies the logged-in user and redirects to login when no session exists:

- `UserContext` — React context that fetches the current user on mount, surfaces `{ user, isLoading }` app-wide, and redirects to the SSO login endpoint on 401.
- `AppHeader` + `UserAvatar` — updated to consume `UserContext` and display real user data (initials derived from `firstName`/`lastName` or `displayName`).
- `src/proxy.ts` — Next.js middleware that guards all page routes by checking `GET /api/v1/auth/me` server-side before allowing the request through.
- Mock auth handlers — built-in Next.js route handlers at `/api/mock/api/v1/auth/{login,me,logout}` so development works without a live backend.

---

## Auth flow (production)

```
Browser → page route
  → proxy.ts middleware: GET /api/v1/auth/me (server-side, forwards cookie)
    → 401: redirect to GET /api/v1/auth/login (Google SSO)
    → 200: NextResponse.next() → page renders
  → page renders → UserContext mounts → GET /api/v1/auth/me (client-side)
    → 200: setUser(user)
    → 401: redirectToLogin() (fallback, proxy should have caught this first)
```

Auth is cookie-based (`HttpOnly`). The frontend never reads or stores a token. See `PRD-frontend.md` FE-C13.

---

## Mock mode

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/mock` in `.env.local`, then visit:

- `GET /api/mock/api/v1/auth/login` — sets `session=mock-session` cookie, redirects to `/`
- `GET /api/mock/api/v1/auth/me` — returns mock user if cookie present, 401 otherwise
- `POST /api/mock/api/v1/auth/logout` — clears the session cookie

Mock user: `{ id: 'mock-usr-001', email: 'dev@whirlpool.com', displayName: 'Dev User', firstName: 'Dev', lastName: 'User' }`

**Important:** the proxy middleware (`src/proxy.ts`) excludes `/api/` paths from its matcher. Without this, its server-side fetch back to `localhost:3000/api/mock/...` would create a recursive loop exhausting socket buffers (`ENOBUFS`).

---

## Files added / modified

| File | Change |
|---|---|
| `src/context/UserContext.tsx` | New — auth context and `useUser` hook |
| `src/components/providers/Providers.tsx` | Modified — wraps tree in `UserContextProvider` |
| `src/components/layout/AppHeader.tsx` | Modified — reads user from `useUser()` |
| `src/components/ui/UserAvatar.tsx` | Modified — derives initials from `User` fields |
| `src/services/auth.service.ts` | Modified — `UserSchema` extended with optional fields |
| `src/services/http.ts` | Modified — minor type / export updates |
| `src/proxy.ts` | New — Next.js middleware (auth guard for page routes); `/api/` excluded from matcher |
| `src/app/api/mock/api/v1/auth/login/route.ts` | New — mock login handler |
| `src/app/api/mock/api/v1/auth/me/route.ts` | New — mock me handler |
| `src/app/api/mock/api/v1/auth/logout/route.ts` | New — mock logout handler |
| `src/test/services/http.test.ts` | New — unit tests for `buildQuery` and `HttpError` |
| `src/test/services/auth.service.test.ts` | New — unit tests for `getCurrentUser`, `logout`, `redirectToLogin` |
| `src/test/api/mock/api/v1/auth/login/route.test.ts` | New — route handler tests |
| `src/test/api/mock/api/v1/auth/me/route.test.ts` | New — route handler tests |
| `src/test/api/mock/api/v1/auth/logout/route.test.ts` | New — route handler tests |

---

## API endpoints used

| Endpoint | Source | Notes |
|---|---|---|
| `GET /api/v1/auth/me` | `API_SPEC.md` | Returns `User` shape; called by proxy (server-side) and `UserContext` (client-side) |
| `GET /api/v1/auth/login` | `API_SPEC.md` | SSO redirect target; redirected to on 401 |
| `POST /api/v1/auth/logout` | `API_SPEC.md` | Called by `logout()` service function |

---

## Open questions / follow-up

- Notification count in `AppHeader` is currently hardcoded to `5`. This will be replaced when the notifications API endpoint is available.
- `HighlightCard` variant prop is scaffolded but not implemented — separate ticket needed.
