# Spec 02: Authentication and Session (US-001, FR-01)

## 1. Behaviour

| Aspect | Decision |
|---|---|
| Provider | Supabase Auth, email and password |
| Email confirmation | Required (Supabase Auth > Providers > Email > "Confirm email" ON) |
| Session | Cookie based via `@supabase/ssr`; refreshed in `middleware.ts` |
| Password rules | Minimum 8 characters, at least one letter and one number (client Zod and Supabase minimum length 8) |
| Redirect after sign in or verification | `/dashboard`, or validated `next` param |
| Sign out | `supabase.auth.signOut()` then `router.replace('/')` and `router.refresh()` |
| Auth latency target | 10 seconds or less end to end |

Supabase project settings (documented for setup, not SQL): Site URL = `NEXT_PUBLIC_APP_URL`; Redirect URLs include `${NEXT_PUBLIC_APP_URL}/auth/callback`; keep the default PKCE confirmation link, which arrives as `/auth/callback?code=...`.

## 2. Routes

| Route | File | Behaviour |
|---|---|---|
| `/sign-up` | `src/app/(auth)/sign-up/page.tsx` | Renders `AuthForm mode="sign-up"` |
| `/sign-in` | `src/app/(auth)/sign-in/page.tsx` | Renders `AuthForm mode="sign-in"`; shows banner for `?error=link_expired` |
| `/auth/callback` | `src/app/auth/callback/route.ts` | `GET ?code=`: `exchangeCodeForSession(code)`; success redirects to `/dashboard` (or safe `next`); failure redirects to `/sign-in?error=link_expired` |
| `/auth/check-email` | `src/app/(auth)/check-email/page.tsx` | "Check your email" screen with resend button (`supabase.auth.resend({type:'signup', email})`), 60 second cooldown |

## 3. `AuthForm` Component (`src/components/auth/AuthForm.tsx`, client)

Props: `{ mode: 'sign-in' | 'sign-up'; next?: string }`.

Fields: email, password (with show/hide toggle, `aria-pressed`). Optional full name on sign-up.

Zod schema (`src/lib/validation/auth.ts`):
```ts
export const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/[0-9]/),
  fullName: z.string().trim().max(120).optional(),
});
export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
```

Flows:
- Sign up: `supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${APP_URL}/auth/callback`, data: { full_name } } })`. On success navigate to `/auth/check-email?email=...`. If Supabase returns an obfuscated existing user (identities empty) show the same check-email screen (no account enumeration).
- Sign in: `signInWithPassword`. On success `router.replace(next ?? '/dashboard')`. On `invalid_credentials` show "Email or password is incorrect." On `email_not_confirmed` show "Please confirm your email first" with a resend button.
- Loading: submit button disabled with spinner and `aria-busy`.
- Errors render in an `role="alert"` region under the form; focus moves to the first invalid field.
- `next` is accepted only if it starts with `/` and not `//`.

## 4. Data

`profiles` row is created by trigger `on_auth_user_created` (see `supabase-schema.sql`). No client write is needed. `profiles` is readable by its owner only.

## 5. Header and Sign Out

`AppHeader` (`src/components/layout/AppHeader.tsx`) shows logo, "Dashboard" link, "Review a Contract" button, and a user menu (email, "Sign out"). The sign out action is a client handler.

## 6. Edge Cases

| Case | Behaviour |
|---|---|
| Expired or reused confirmation link | `/sign-in?error=link_expired` with resend option |
| Session expires while on results page | API returns 401; client React Query `onError` redirects to `/sign-in?next=<current path>` |
| Signed-in user opens `/sign-up` | Middleware redirects to `/dashboard` |
| Rapid repeated submit | Button disabled while pending; server rate limits are Supabase defaults |
| Open redirect via `next` | Rejected; falls back to `/dashboard` |

## 7. Acceptance Criteria

- New user can sign up, confirm email, land on an empty dashboard showing the empty state text "No contracts reviewed yet. Upload your first contract to begin".
- Wrong password shows a clear error and does not reveal whether the email exists.
- Signed-out access to `/dashboard` and `/contracts/*` redirects to sign in and returns to the original page afterwards.
- Auth flow completes in 10 seconds or less on a normal connection.
- Tests: unit for Zod schemas and `safeNext()`; E2E for sign up (mail stub), sign in, sign out, protected redirect.
