# Local platform demonstration

The combined runner starts this Vite frontend with `/api` proxied to `LOCAL_API_TARGET` (default `http://127.0.0.1:8080`). Sign in with synthetic account `platform-local` / `LocalDemo123!`.

The basic merchant list supports search, refresh, pagination and existing backend merchant maintenance endpoints. It does not implement subscription billing or marketing. Save and enable/disable actions suppress duplicate in-flight submissions; list errors remain visible.

Checks using preinstalled dependencies: `npm run lint`, `npm test`, `npm run build`. The existing `check` script requires pnpm; use the individual commands if pnpm's home is unavailable.
