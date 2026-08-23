# 03 · Arquitectura

## Forma

Dos aplicaciones desplegables más un proceso de agente, una base de datos, un object store.

```
┌────────────────────────────────────────────────────────────────────┐
│  Navegador                                                         │
│  Next.js 16 (App Router) — shell SSR + cliente TanStack Query      │
└───────────────────────────────┬────────────────────────────────────┘
                                │ HTTPS, JWT en header Authorization
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│  Caddy (TLS automático, reverse proxy)                             │
└──────────────┬─────────────────────────────────┬───────────────────┘
               ▼                                 ▼
   ┌───────────────────────┐        ┌──────────────────────────┐
   │  API  (Go + Gin)      │        │  Hermes (Python)         │
   │  internal/interfaces  │◄───────┤  runtime del agente      │
   │  ├─ application       │ tools  │  un perfil por cuenta    │
   │  └─ domain            │ sobre  │  token de servicio r/o   │
   └───────────┬───────────┘  HTTP  └──────────────────────────┘
               │
   ┌───────────┴───────────┐
   │  Worker (Go, mismo    │   cron + consumidor de cola
   │  binario, -mode=worker)│  recordatorios · rollups · syncs · embeddings
   └───────────┬───────────┘
               ▼
   ┌───────────────────────────────────────────┐
   │  PostgreSQL 16 + pgvector                 │
   │  RLS activo · eventos particionados x mes │
   └───────────────────────────────────────────┘
               ▼
   ┌───────────────────────┐
   │  Storage S3-compatible│  transcripciones, exports, adjuntos de SOPs
   └───────────────────────┘
```

**Un binario de Go, dos modos.** `./server -mode=api` y `./server -mode=worker` comparten las
capas de dominio y aplicación. Dos binarios duplicarían el wiring; dos servicios duplicarían
el deploy. Un binario, dos entrypoints, contenedores separados.

---

## Capas del backend (hexagonal)

```
cmd/server/main.go              solo wiring — sin lógica de negocio, sin SQL

internal/
├── <contexto>/
│   ├── domain/                 entidades, value objects, errores de dominio
│   │                           CERO imports de otros paquetes internos
│   ├── app/                    casos de uso; declara puertos como interfaces
│   ├── infra/                  adaptadores: repos de postgres, clientes de proveedores
│   └── http/                   handlers de Gin, DTOs, mapeo request/response
└── platform/                   transversal: pool de db, auth, logging, config, tenancy
```

**Dirección de dependencias — nunca al revés:**

```
http ──► app ──► domain
infra ──► app   (implementa los puertos declarados en app)
```

Se fuerza mecánicamente, no por disciplina: un check de `import-boundaries` en CI rompe el
build cuando `domain` importa algo de `app`, `infra` o `http`.

### Por qué no un único `internal/domain` plano para todos los contextos

El backend de J4 usa `internal/domain/{product,inventory,...}` y a su tamaño funciona. Este
sistema tiene ~11 contextos y una superficie mucho más ancha. Agrupar primero por contexto
(`internal/content/domain`) mantiene un cambio al módulo de contenido dentro de un solo
directorio en lugar de tocar cuatro carpetas hermanas de primer nivel. Las reglas de capas son
idénticas; solo cambia el orden de anidamiento.

---

## Ciclo de vida de un request

```
1. Caddy termina TLS
2. Cadena de middleware de Gin:
   ├─ request_id      → adjunta un id de correlación, se loggea en todos lados
   ├─ recover         → panic → 500 + log estructurado, nunca un crash pelado
   ├─ auth            → valida el JWT, carga usuario + membresías
   ├─ tenancy         → resuelve account_id desde la ruta, verifica la membresía,
   │                    lo guarda en el contexto del request
   ├─ rbac            → verifica el permiso requerido para la ruta
   └─ tx              → abre una transacción y ejecuta
                        SET LOCAL app.current_account_id = '<uuid>'
3. El handler bindea + valida el DTO (validator/v10)
4. El handler llama a UN caso de uso — nunca a un repositorio directamente
5. El caso de uso orquesta objetos de dominio a través de puertos
6. El repositorio ejecuta queries generadas por sqlc; RLS fuerza el tenancy a nivel DB
7. La respuesta se mapea de dominio a DTO. Los tipos de dominio nunca cruzan el borde HTTP.
```

El `tenancy` del paso 2 y el mapeo del paso 7 son los dos lugares donde se filtran tenants.
Ambos llevan tests dedicados.

---

## Camino de escritura de un journey event

Todo contexto que emite eventos pasa por un único appender compartido. Duplicar la lógica de
append entre contextos es como los logs de eventos se desalinean.

```go
// internal/journey/app/appender.go
type Appender interface {
    Append(ctx context.Context, e domain.Event) error   // idempotente sobre DedupeKey
}
```

- Se llama **dentro de la misma transacción** que la escritura de negocio. Un deal que pasa a
  `won` y el evento `deal.won` commitean juntos o no commitea ninguno.
- `dedupe_key` tiene índice único; un insert duplicado se traga como éxito, no como error.
- La resolución de atribución corre **de forma asíncrona** en el worker, no en el camino del
  request. Los eventos se escriben con `attribution_status = 'pending'` y se enriquecen en
  segundos.

---

## Trabajo en segundo plano

Sin Redis, sin Kafka. Postgres es la cola.

```sql
CREATE TABLE jobs (
  id            uuid PRIMARY KEY,
  account_id    uuid,                       -- nullable: algunos jobs son globales
  kind          text NOT NULL,
  payload       jsonb NOT NULL,
  run_at        timestamptz NOT NULL,
  attempts      int NOT NULL DEFAULT 0,
  max_attempts  int NOT NULL DEFAULT 5,
  locked_at     timestamptz,
  locked_by     text,
  status        text NOT NULL DEFAULT 'pending',  -- pending|running|done|failed
  last_error    text
);
CREATE INDEX ON jobs (status, run_at) WHERE status = 'pending';
```

Se toman con `SELECT ... FOR UPDATE SKIP LOCKED LIMIT n` — correcto con múltiples workers y
sin dependencias. Un broker de verdad se introduce cuando el throughput demuestre que Postgres
no alcanza; al volumen de este sistema (miles de eventos por día, no millones) no va a pasar.

**Tipos de job**

| Tipo | Disparador | Frecuencia |
|---|---|---|
| `reminder.dispatch` | Cita agendada | En cada offset de la escalera (−5h/−1h/−5min) |
| `attribution.resolve` | Journey event agregado | Inmediato |
| `rollup.kpi_daily` | Cron | Cada noche 03:00 en el timezone de la cuenta |
| `sync.metricool` | Cron | Cada hora (Fase 5) |
| `sync.calendar` | Webhook + reconciliación horaria | Fase 5 |
| `embed.document` | Documento creado/actualizado | Inmediato (Fase 6) |
| `transcript.analyze` | Grabación de llamada subida | Inmediato (Fase 6) |
| `consistency.deal_stage` | Cron | Cada noche |

Los reintentos usan backoff exponencial. Un job que supera `max_attempts` pasa a `failed` y
levanta una alerta — nunca se descarta en silencio.

---

## Ingesta de webhooks (patrón inbox)

Los webhooks de terceros son entrada hostil: reintentan, llegan fuera de orden y duplican.

```
POST /webhooks/manychat
  1. Verificar la firma. Inválida → 401, log, cortar.
  2. INSERT INTO webhook_events (provider, external_id, payload, status='received')
     ON CONFLICT (provider, external_id) DO NOTHING
  3. Devolver 200 de inmediato.       ← nunca hacer trabajo de negocio en el handler
  4. El worker lo levanta, procesa y marca status='processed' o 'failed' + error.
```

Beneficios: el proveedor recibe un 200 rápido y deja de reintentar; un bug de procesamiento se
corrige y **se reprocesa todo el backlog** desde los payloads guardados; los duplicados son
imposibles.

---

## Arquitectura del frontend

Next.js 16 App Router, separación container/presentational (acorde a la preferencia declarada).

```
app/
├── (auth)/login, /accept-invite
├── (admin)/accounts, /accounts/[id]        rutas solo para la agencia
└── (client)/[accountSlug]/
    ├── overview  strategy  tasks  content  calendar  metrics
    ├── crm  crm/[contactId]  calls  sales  lead-magnets
    ├── team  sops  assistant

components/
├── ui/            primitivos de shadcn — sin lógica de negocio
├── <contexto>/    content/, crm/, calls/ — presentacionales, solo props, testeables
└── layouts/

features/
└── <contexto>/    containers: hooks, llamadas TanStack Query, mutaciones, orquestación
```

**Regla:** un componente en `components/` nunca llama a un hook que hace fetch. Los datos
entran por `features/`. Eso mantiene la capa presentacional trivialmente testeable y apta para
Storybook.

**Server vs client components**
- Server components: shell inicial de la página, contenido estático, primer pintado.
- Client components: todo lo que tenga un gráfico, un filtro, un tablero drag-and-drop o
  actualizaciones optimistas. El tablero de pipeline del CRM y el calendario son client
  components.
- La API se llama desde el navegador con el JWT del usuario. Los route handlers de Next.js se
  usan solo para callbacks de auth y firma de subida de archivos — **no** como proxy de cada
  request (eso duplicaría la latencia y la superficie de RBAC).

---

## Lo que está deliberadamente ausente

| No se usa | Por qué |
|---|---|
| Redis | Postgres resuelve la cola y todavía no hay presión de caché |
| Kafka / RabbitMQ | El volumen no justifica el costo operativo |
| Microservicios | Un equipo, un deploy; los contextos se fuerzan con límites de paquete, no de red |
| GraphQL | El cliente es un frontend conocido; REST + generación tipada es más simple |
| Un ORM (gorm/ent) | sqlc da queries tipadas con SQL visible y sin reflection en runtime |
| Event sourcing como store primario | El journey log es un *log de auditoría append-only*, no la fuente de verdad del estado de las entidades. Event sourcing completo agregaría complejidad de reconstrucción sin beneficio acá. |
