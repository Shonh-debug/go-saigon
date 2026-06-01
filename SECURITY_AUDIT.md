# Security Audit - Go Saigon

Date: 2026-06-01

## Scope

This audit reviewed the current Go Saigon Next.js application, public API routes, Google Maps and Places integration boundaries, dependency advisories, tracked secret exposure, deployed response headers, and project policy rules from `AGENTS.md`.

The audit covered:

- Dependency vulnerability scan with production and full dependency sets.
- Secret scan across tracked source files.
- Environment-file tracking checks.
- API route review for request validation, caching, rate limiting, key exposure, and photo proxy behavior.
- Client code review for unsafe DOM APIs and external link handling.
- Deployed header check against `https://go-saigon.vercel.app`.
- Verification with tests, lint, and production build.

## Executive Summary

No critical or high-severity vulnerabilities were found.

The main issues to address are:

- A moderate production dependency advisory from Next.js' bundled PostCSS version.
- Missing baseline browser security headers on the deployed app.
- Rate limiting that fails open when Upstash Redis environment variables are missing.
- A photo proxy signature design that reuses the Google server API key as the signing secret.
- A dev-only esbuild advisory through Drizzle Kit tooling.

Secrets were not found in tracked files. `.env.local` is ignored and untracked. The server-side Google Places key is not referenced by browser code.

## Findings

### 1. Moderate Production Dependency Advisory: Next.js Bundled PostCSS

Severity: Medium

`npm audit --omit=dev` reports a moderate advisory for `postcss <8.5.10` through `next`. The installed app uses `next@15.5.18`, which currently vendors `postcss@8.4.31`, while the top-level project `postcss@8.5.15` is already patched.

Impact:

- The advisory is `GHSA-qx2v-qp2m-jg93`, related to unescaped `</style>` handling in PostCSS stringification.
- The risk depends on whether attacker-controlled CSS is processed and stringified by the vulnerable PostCSS path.
- The audit tool also flags `@vercel/analytics` because it depends on the same installed Next.js tree.

Evidence:

- `npm audit --omit=dev --json` reported 3 moderate production vulnerabilities: `next`, `postcss`, and `@vercel/analytics`.
- `npm ls next postcss` showed `next@15.5.18` using `postcss@8.4.31`.

Recommendation:

- Track the Next.js release line and upgrade when a version vendors `postcss >=8.5.10`.
- Do not use npm audit's suggested downgrade to `next@9.3.3`; that would be a major functional and security regression.
- If this needs immediate mitigation, test a package-manager override carefully before shipping it.

### 2. Missing Security Headers On Deployed App

Severity: Medium

The deployed app currently sends HSTS, but does not send several common browser security headers.

Missing headers observed:

- `Content-Security-Policy`
- `X-Frame-Options` or equivalent `frame-ancestors` CSP directive
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Impact:

- A missing CSP increases impact if any future XSS bug is introduced.
- Missing frame protections can allow clickjacking unless constrained elsewhere.
- Missing `nosniff` and referrer controls weakens browser hardening.

Evidence:

- `curl -sSI https://go-saigon.vercel.app/` showed `strict-transport-security`, but not the headers above.
- `next.config.mjs` currently only sets `reactStrictMode`.

Recommendation:

- Add a `headers()` block in `next.config.mjs`.
- Start with a CSP compatible with Google Maps JavaScript, Google tile/image domains, Places photo proxy usage, and Vercel Analytics.
- Consider shipping CSP in report-only mode first if the Google Maps allowlist needs tuning.

### 3. Public Search Rate Limiting Fails Open Without Upstash Configuration

Severity: Medium

Status: Fixed in the working tree after this audit.

`src/lib/discovery/rateLimit.ts` previously returned an allowed response when the Upstash Redis environment variables were missing. This was convenient for local development, but risky in production.

Impact:

- Before the fix, if `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` was missing in Vercel, public discovery searches were effectively unlimited.
- That could increase Google Places API cost exposure and create a denial-of-wallet risk.

Evidence:

- `createLimiter()` returns `undefined` when Redis config is missing.
- `checkDiscoveryLimit()` now returns `{ success: false, reason: "RATE_LIMIT_NOT_CONFIGURED" }` in production when no limiter exists.
- `/api/discovery/search` now returns `503` for missing production rate-limit configuration.
- `/api/discovery/search` is limited to 20 requests per 5 minutes per client IP when Upstash is configured.
- `/api/discovery/photo` is no longer rate-limited because photo URLs are signed, short-lived, and validated before proxying.
- Local development still allows requests without Upstash configuration.

Remaining requirement:

- Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel before relying on the public app.
- Add a deployment health check later if you want missing production rate-limit configuration to be visible before user traffic reaches the app.

### 4. Photo Proxy Signs URLs With The Google Server API Key

Severity: Low-Medium

Photo proxy references are HMAC-signed using `GOOGLE_MAPS_API_KEY` as the signing secret.

Impact:

- The current implementation is much better than exposing raw photo references because signatures expire and are validated with timing-safe comparison.
- However, the Places API key and the photo proxy signing secret are coupled. If the server key is leaked, an attacker could also forge valid photo proxy signatures until the key is rotated.

Evidence:

- `src/lib/googlePlaces.ts` uses `createHmac("sha256", key)` where `key` is the Google Places server key.
- `validatePhotoReference()` correctly verifies expiry, resource format, and HMAC signature.

Recommendation:

- Add a separate `PHOTO_PROXY_SIGNING_SECRET` environment variable.
- Use the Google key only for Google API calls and the signing secret only for internal URL integrity.

### 5. Photo Proxy Does Not Explicitly Cap Response Type Or Size

Severity: Low-Medium

The photo proxy validates signed Google photo references and fetches Google-provided media URLs, but it does not explicitly enforce an `image/*` content type or response-size ceiling.

Impact:

- SSRF risk is low because the browser cannot supply arbitrary URLs and the signed photo reference must be generated by the server from Google Places data.
- Defensive response validation would reduce risk if Google response behavior changes or an unexpected upstream response is returned.

Evidence:

- `src/app/api/discovery/photo/route.ts` proxies the fetched upstream response with its upstream content type when available.
- No explicit content-length limit or image-only allowlist is enforced.

Recommendation:

- Require `content-type` to start with `image/`.
- Add a maximum content-length or bounded stream handling.
- Set `X-Content-Type-Options: nosniff` on photo responses.

### 6. Dev Dependency Advisory Through Drizzle Kit And esbuild

Severity: Low-Medium

The full `npm audit` reports a moderate advisory for old `esbuild` through Drizzle Kit's `@esbuild-kit` dependency chain.

Impact:

- The advisory, `GHSA-67mh-4wv8-2f99`, affects development servers that expose esbuild behavior to untrusted websites.
- This appears to be a development-tooling risk rather than a production runtime issue.

Evidence:

- `npm audit --json` reported 7 total moderate vulnerabilities.
- `npm ls drizzle-kit esbuild` showed `drizzle-kit@0.31.10` depending on `@esbuild-kit/esm-loader`, which pulls `esbuild@0.18.20`.

Recommendation:

- Keep local dev servers bound to localhost.
- Update Drizzle Kit when its dependency chain removes the vulnerable esbuild version.
- Avoid exposing dev tooling ports on public or shared networks.

### 7. Database Persistence Errors Are Swallowed

Severity: Low

Database persistence failures in `src/lib/discovery/database.ts` are caught and ignored so discovery can continue.

Impact:

- This is not a direct data exposure issue.
- It can hide production misconfiguration, which may reduce visibility into whether place-ID persistence and request metrics are functioning as intended.

Recommendation:

- Log sanitized server-side errors in production.
- Do not include secrets, raw Google responses, names, addresses, ratings, photos, or Maps URLs in logs.

## Positive Security Controls Observed

- No actual API keys, database URLs, Upstash tokens, private keys, GitHub tokens, or OpenAI-style keys were found in tracked files.
- `.env.local` exists locally but is ignored by `.gitignore` and is not tracked by Git.
- `.env.example` contains placeholders only.
- `GOOGLE_MAPS_API_KEY` is referenced only in server-side Google Places utilities.
- `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` is intentionally browser-visible and used for the Google Maps JavaScript API.
- Discovery request inputs are validated against application-owned area and category allowlists.
- Live discovery responses use `Cache-Control: no-store`.
- Photo proxy responses use `Cache-Control: no-store`.
- Photo proxy references are signed, expire after 15 minutes, validate expected Google resource shape, and use timing-safe comparison.
- External destination opens use `noopener,noreferrer`.
- No use of `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML`, `document.write`, `localStorage`, or `sessionStorage` was found.
- Database code stores Google place IDs and application-owned metadata, not persisted Google names, ratings, review counts, addresses, photos, Maps URLs, or raw Places API responses.

## Verification Commands Run

```bash
npm audit --json
npm audit --omit=dev --json
npm ls next postcss drizzle-kit esbuild @vercel/analytics --all
npm outdated --json
npm run test
npm run lint
npm run build
```

Additional checks:

- Searched tracked files for common secret patterns.
- Confirmed `.env.local` is ignored and untracked.
- Checked deployed response headers for the homepage and discovery API routes.
- Reviewed discovery API, rate-limit, Google Places, database, map, and photo proxy code.

## Current Risk Rating

Overall risk: Medium

The application has good separation between server and browser keys, no tracked secrets, no high or critical dependency issues, and reasonable API input validation. The highest-priority hardening work is to add security headers, make rate limiting production-safe, and track the Next.js/PostCSS advisory until an appropriate patched Next.js version is available.
