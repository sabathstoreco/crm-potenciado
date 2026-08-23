# Yamil OS Frontend Demo

Frontend-only demonstration for sales and product validation. It deliberately contains no backend, database, or real authentication.

## Run

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## Demo accounts

| Role | Email | Password | Scope |
|---|---|---|---|
| Platform admin | `admin@yamilos.demo` | `Demo2026!` | Acme Consulting and Nexo Legal |
| Acme owner | `mariana@acme.demo` | `Demo2026!` | Acme Consulting |
| Nexo owner | `diego@nexo.demo` | `Demo2026!` | Nexo Legal |

## Architecture for the backend transition

- `src/types/` contains transport-independent domain contracts.
- `src/lib/mocks.ts` is the temporary fixture source.
- `src/lib/auth.ts` is the auth adapter. Replace its mock implementation with an API/OpenAPI client without changing UI components.
- `src/components/` only renders props and callbacks; server state belongs in `features/` as the real API is introduced.

## Checks

```bash
bun test
bun run lint
bunx tsc --noEmit
```
