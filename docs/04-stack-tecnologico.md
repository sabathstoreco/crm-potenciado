# 04 · Stack Tecnológico

Decisiones cerradas. Cambiar una requiere un ADR en [adr/](adr/) explicando qué fue lo que la
decisión anterior no logró resolver.

## Backend

| Aspecto | Elección | Razonamiento |
|---|---|---|
| Lenguaje | **Go 1.23+** | Binario estático único, deploy trivial, buena concurrencia para el worker, y coincide con el backend existente de J4 así que las convenciones se transfieren |
| HTTP | **Gin** | Ya es el framework de la casa; la cadena de middleware encaja con el diseño de tenancy/RBAC |
| Driver de DB | **pgx/v5** + `pgxpool` | Protocolo nativo de Postgres, soporte de `jsonb`/arrays/`vector` sin las conversiones de `database/sql` |
| Queries | **sqlc** | Métodos tipados generados desde SQL real. El SQL queda legible y revisable — crítico cuando las queries de analítica se pongan complejas |
| Migraciones | **goose** | `.sql` plano con up/down, sin DSL |
| Validación | `go-playground/validator/v10` | Tags de struct sobre los DTOs |
| Auth | `golang-jwt/jwt/v5` + `bcrypt` | Access token de 15 min + refresh token rotativo de 30 días |
| Logging | `log/slog` de la stdlib, JSON | Estructurado desde el día uno; sin dependencia de librería de logging |
| Config | Variables de entorno vía `caarlos0/env` | 12-factor; sin archivos de config en la imagen |
| Testing | stdlib + `testify` + `testcontainers-go` | Los tests de repositorio corren contra un Postgres real, no contra un mock. El comportamiento de RLS no se puede testear contra un mock. |
| Docs | Anotaciones de `swaggo` → OpenAPI | Alimenta la generación de tipos del frontend |

**Rechazados explícitamente:** gorm/ent (SQL oculto), Echo/Fiber/Chi (no hay motivo para
divergir de Gin), Redis (nada lo necesita todavía), un message broker (ver [03](03-arquitectura.md)).

## Base de datos

| Aspecto | Elección | Razonamiento |
|---|---|---|
| Motor | **PostgreSQL 16** | RLS, particionado, `jsonb`, window functions — cada requerimiento difícil de acá es una feature de Postgres |
| Vectores | **pgvector** (`halfvec`, índice HNSW) | Una sola base en lugar de dos. Al tamaño de este corpus (SOPs + transcripciones, miles de chunks) una base vectorial dedicada es puro sobrecosto operativo |
| Full text | `tsvector` de Postgres | Búsqueda de contactos y SOPs; sin Elasticsearch |
| Aislamiento | **RLS** + scoping a nivel aplicación | Defensa en profundidad — ver [06](06-multitenancy-auth-rbac.md) |

**La decisión de hosting está abierta** — ver [12](12-riesgos-y-preguntas-abiertas.md).
Candidatos: Postgres administrado (Neon/Supabase/RDS) vs self-hosted en el VPS de Hostinger
existente. pgvector tiene que estar disponible; verificarlo antes de comprometerse.

## Frontend

| Aspecto | Elección | Razonamiento |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Estándar de la casa |
| React | 19 | |
| Lenguaje | TypeScript, `strict: true` | |
| Gestor de paquetes | **Bun** | Estándar de la casa — nunca `npm`, corrompe `bun.lock` |
| Estilos | **Tailwind CSS v4** (`@theme inline`, CSS-first) | En v4 no existe `tailwind.config.ts` |
| Componentes | **shadcn/ui** | Código propio, no una dependencia caja negra |
| Íconos | `lucide-react` | |
| Estado de servidor | **TanStack Query** | Caché, invalidación, updates optimistas para el tablero de pipeline |
| Estado de cliente | `zustand`, solo donde haga falta de verdad | La mayoría del estado es estado de servidor |
| Formularios | `react-hook-form` + `zod` | El formulario de onboarding solo ya lo justifica |
| Tablas | `@tanstack/react-table` | Contactos, llamadas, listas de contenido — orden/filtro/virtualización |
| Gráficos | `recharts` | |
| Drag & drop | `@dnd-kit/core` | Tablero de pipeline y calendario |
| Calendario | Propio sobre `date-fns` | FullCalendar es pesado y su licenciamiento comercial hay que revisarlo; la vista requerida es simple |
| Fechas | `date-fns` + `date-fns-tz` | **El manejo de zonas horarias no es opcional** — ver abajo |
| Linter | `@biomejs/biome` | Reemplaza ESLint + Prettier |
| Tests unitarios | `vitest` + `@testing-library/react` | |
| E2E | `@playwright/test` | Onboarding y el tablero del CRM llevan cobertura E2E |

### Seguridad de tipos a través del borde

El backend emite OpenAPI desde anotaciones de `swaggo`; el frontend genera tipos con
`openapi-typescript` en CI. Un cambio de DTO en el backend que rompa el frontend rompe el
build en lugar de romper en producción. Vale la poca herramienta que cuesta.

## Capa de IA

| Aspecto | Elección |
|---|---|
| Runtime de agente | **Hermes Agent** (self-hosted, Python) — ver [08](08-hermes-capa-ia.md) |
| Embeddings | Agnóstico al proveedor detrás de una interfaz; la dimensión se fija en el tipo de columna |
| Store vectorial | pgvector en el mismo Postgres |
| Modelo | Configurable por entorno; Hermes no tiene lock-in de proveedor |

## Infraestructura

| Aspecto | Elección | Razonamiento |
|---|---|---|
| Contenedores | Docker + Docker Compose | Coincide con el setup actual del VPS |
| Reverse proxy | **Caddy** | TLS automático, configuración mínima |
| Host | VPS de Hostinger existente al inicio | Ya corre Hermes; evita un segundo host |
| Object storage | S3-compatible (Cloudflare R2 o Hetzner) | Transcripciones y exports; R2 no cobra egreso |
| Email | **Resend** | Ya está en uso; solo transaccional |
| WhatsApp (si hace falta) | **Kapso** | Cloud API oficial con soporte de plantillas — los adaptadores propios de WhatsApp de Hermes no pueden enviar plantillas |
| CI | GitHub Actions | |
| Tracking de errores | Sentry (ambas apps) | |
| Uptime | Ping externo simple sobre `/healthz` | |

⚠️ Co-hospedar la app con Hermes en un solo VPS está bien para el MVP, pero se convierte en un
punto único de falla. Presupuestar la migración a un host separado antes de onboardear al
tercer cliente.

## Estructura del repositorio

Monorepo, dos apps.

```
crm-potenciado/
├── backend/          Go
│   ├── cmd/server/
│   ├── internal/
│   ├── migrations/
│   ├── queries/
│   ├── sqlc.yaml
│   └── Makefile
├── frontend/         Next.js
├── docs/             esta carpeta de planeación
├── deploy/           docker-compose, Caddyfile, plantillas de env
└── .github/workflows/
```

Repos separados significarían coordinar dos PRs para un cambio de API. Un repo, dos apps, un CI.

## Transversal: zonas horarias

Se resalta acá porque equivocarse invalida todas las métricas del producto.

- **Guardar todo en UTC** (`timestamptz`).
- Cada `account` tiene un `timezone` (IANA, ej. `America/Mexico_City`).
- **Todos los rollups diarios, vistas de calendario y filtros de "hoy" usan el timezone de la
  cuenta**, no el del servidor ni el del que mira.
- Los offsets de recordatorio se calculan en el timezone de la cuenta para que los cambios de
  horario de verano no corran una hora el recordatorio de "1 hora antes".
- El frontend renderiza en el timezone de la cuenta por defecto, con la hora local del usuario
  como etiqueta secundaria en las pantallas de citas.
