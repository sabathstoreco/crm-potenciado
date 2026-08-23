# 05 · Esquema de Base de Datos

PostgreSQL 16 + pgvector. Este es el esquema de referencia; las migraciones de goose pasan a
ser la fuente de verdad ejecutable en cuanto arranque el código.

## Convenciones

- Llaves primarias: `uuid` generado con **UUIDv7** (`uuid_generate_v7()` o generado en Go) —
  ordenado por tiempo, así los inserts en el B-tree quedan secuenciales y las consultas por
  rango de creación funcionan. Con UUIDv4 aleatorio los índices se fragmentan feo a este
  volumen de escritura.
- Timestamps: `timestamptz`, siempre en UTC.
- Dinero: `bigint` en centavos + `currency` char(3). **Nunca `float`.**
- Borrado lógico: `deleted_at timestamptz NULL` en las entidades que el usuario puede eliminar.
  Toda query lo filtra; todo índice único es parcial con `WHERE deleted_at IS NULL`.
- Auditoría: `created_at`, `updated_at`, `created_by`, `updated_by` en toda entidad mutable.
- Los enums son `text` + `CHECK`, no tipos `ENUM` de Postgres — agregar un valor a un enum de
  Postgres es una migración que no puede correr dentro de una transacción junto con otro DDL.
- Toda tabla de tenant lleva `account_id uuid NOT NULL` y tiene RLS habilitado.

---

## 1 · Identidad

```sql
CREATE TABLE users (
  id             uuid PRIMARY KEY,
  email          citext NOT NULL UNIQUE,
  password_hash  text,                       -- NULL si es solo SSO
  full_name      text NOT NULL,
  avatar_url     text,
  is_platform_admin boolean NOT NULL DEFAULT false,   -- staff de la agencia
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);

CREATE TABLE accounts (                      -- un cliente = un tenant
  id           uuid PRIMARY KEY,
  slug         text NOT NULL UNIQUE,
  name         text NOT NULL,
  timezone     text NOT NULL DEFAULT 'America/Mexico_City',
  currency     char(3) NOT NULL DEFAULT 'MXN',
  funnel_type  text NOT NULL CHECK (funnel_type IN
                 ('consulting','infoproduct','low_ticket','agency')),
  status       text NOT NULL DEFAULT 'onboarding' CHECK (status IN
                 ('onboarding','active','paused','churned')),
  onboarded_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE TABLE account_memberships (
  id          uuid PRIMARY KEY,
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN
                ('owner','manager','editor','community_manager','setter','closer','viewer')),
  permissions jsonb NOT NULL DEFAULT '{}',   -- overrides por usuario sobre el rol
  invited_by  uuid REFERENCES users(id),
  accepted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE UNIQUE INDEX ON account_memberships (account_id, user_id) WHERE deleted_at IS NULL;

CREATE TABLE refresh_tokens (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,          -- guardar el hash, nunca el token
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  replaced_by uuid REFERENCES refresh_tokens(id),   -- cadena de rotación, detecta reuso
  user_agent  text,
  ip          inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id          uuid PRIMARY KEY,
  account_id  uuid,
  actor_id    uuid REFERENCES users(id),
  action      text NOT NULL,                 -- 'deal.updated', 'member.role_changed'
  entity_type text NOT NULL,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  ip          inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_log (account_id, created_at DESC);
```

---

## 2 · Onboarding y Estrategia

```sql
CREATE TABLE onboarding_bookings (
  id            uuid PRIMARY KEY,
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  scheduled_at  timestamptz NOT NULL,
  status        text NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled','rescheduled','completed','no_show','cancelled')),
  external_event_id text,                    -- uid de la reserva en Cal.com
  created_at    timestamptz NOT NULL DEFAULT now()
  -- La regla de "mínimo 2 días de diferencia" (§3) se fuerza en la capa de aplicación, no acá:
  -- depende del timezone de la cuenta y de lógica de días hábiles que un CHECK no puede expresar.
);

CREATE TABLE onboarding_submissions (
  id           uuid PRIMARY KEY,
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  form_version int  NOT NULL,
  payload      jsonb NOT NULL,               -- respuestas crudas completas, nunca con pérdida
  submitted_by uuid REFERENCES users(id),
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- Proyección normalizada de las partes que el producto realmente consulta.
-- El jsonb guarda la verdad cruda; esta tabla guarda la verdad consultable.
CREATE TABLE business_profiles (
  account_id      uuid PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  company_name    text,
  website         text,
  offer           text,
  main_service    text,
  price_cents     bigint,
  business_model  text,
  market          text,
  niche           text,
  ideal_customer  text,
  main_problem    text,
  main_desire     text,
  differentiator  text,
  does_content    boolean,
  does_ads        boolean,
  ad_budget_cents bigint,
  current_crm     text,
  monthly_revenue_goal_cents bigint,
  monthly_leads_goal  int,
  monthly_sales_goal  int,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE strategies (
  id               uuid PRIMARY KEY,
  account_id       uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  version          int  NOT NULL,
  positioning      jsonb NOT NULL,   -- cliente ideal, problema, deseo, oferta, diferenciador
  market_status    text CHECK (market_status IN ('validated','not_validated','testing')),
  content_strategy jsonb NOT NULL,   -- ángulos, pilares, temas, formatos
  funnel_config    jsonb NOT NULL,   -- pasos del funnel para esta cuenta
  notes            text,
  published_at     timestamptz,
  superseded_at    timestamptz,
  created_by       uuid REFERENCES users(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON strategies (account_id, version);
CREATE UNIQUE INDEX one_active_strategy ON strategies (account_id)
  WHERE published_at IS NOT NULL AND superseded_at IS NULL;
```

---

## 3 · Canales y Contenido

```sql
CREATE TABLE channels (                      -- un perfil social conectado (§24 multicuenta)
  id           uuid PRIMARY KEY,
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  platform     text NOT NULL CHECK (platform IN
                 ('instagram','tiktok','youtube','facebook','linkedin','x')),
  handle       text NOT NULL,
  external_id  text,                         -- id del lado de la plataforma cuando exista
  is_primary   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE UNIQUE INDEX ON channels (account_id, platform, handle) WHERE deleted_at IS NULL;

CREATE TABLE content_angles (
  id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL, description text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE content_pillars (
  id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE offers (
  id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL, price_cents bigint, currency char(3),
  created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);

CREATE TABLE content_pieces (
  id             uuid PRIMARY KEY,
  account_id     uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title          text NOT NULL,
  content_type   text NOT NULL CHECK (content_type IN
                   ('reel','short','tiktok','carousel','story','post','long_form','live')),
  status         text NOT NULL DEFAULT 'idea' CHECK (status IN
                   ('idea','script','recording','editing','approval','scheduled','published','archived')),

  -- H — C — CTA (§8). Obligatorios para salir de 'script'; se fuerza en la capa de aplicación.
  hook_text      text,
  hook_type      text,      -- question | contrarian | result | story | pattern_interrupt | ...
  context_topic  text,
  context_problem text,
  cta_text       text,
  cta_type       text,      -- comment_keyword | dm | link_in_bio | book_call | ...

  angle_id       uuid REFERENCES content_angles(id),
  pillar_id      uuid REFERENCES content_pillars(id),
  pain_point     text,
  offer_id       uuid REFERENCES offers(id),
  lead_magnet_id uuid REFERENCES lead_magnets(id),
  script         text,
  asset_url      text,                       -- link a Drive/Frame.io del archivo editado
  owner_user_id  uuid REFERENCES users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);
CREATE INDEX ON content_pieces (account_id, status) WHERE deleted_at IS NULL;
CREATE INDEX ON content_pieces (account_id, angle_id);

CREATE TABLE content_status_transitions (    -- quién lo movió, cuándo, y las vueltas atrás
  id uuid PRIMARY KEY,
  content_piece_id uuid NOT NULL REFERENCES content_pieces(id) ON DELETE CASCADE,
  account_id uuid NOT NULL,
  from_status text, to_status text NOT NULL,
  moved_by uuid REFERENCES users(id),
  moved_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content_publications (          -- una pieza → muchas publicaciones
  id               uuid PRIMARY KEY,
  account_id       uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  content_piece_id uuid NOT NULL REFERENCES content_pieces(id) ON DELETE CASCADE,
  channel_id       uuid NOT NULL REFERENCES channels(id),
  scheduled_at     timestamptz,
  published_at     timestamptz,
  external_url     text,
  external_post_id text,                     -- para hacer match en la sync de métricas
  status           text NOT NULL DEFAULT 'scheduled' CHECK (status IN
                     ('scheduled','published','failed','removed')),
  responsible_user_id uuid REFERENCES users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);
CREATE INDEX ON content_publications (account_id, scheduled_at);   -- vista de calendario
CREATE UNIQUE INDEX ON content_publications (channel_id, external_post_id)
  WHERE external_post_id IS NOT NULL;
```

### Métricas de contenido (§7)

Snapshots diarios, no una única fila mutable — una fila mutable pierde la curva de crecimiento,
y "cómo rindió este reel en sus primeras 48 h" es una pregunta que el cliente va a hacer.

```sql
CREATE TABLE content_metrics_daily (
  id              uuid PRIMARY KEY,
  account_id      uuid NOT NULL,
  publication_id  uuid NOT NULL REFERENCES content_publications(id) ON DELETE CASCADE,
  metric_date     date NOT NULL,             -- en el timezone de la cuenta
  views           bigint NOT NULL DEFAULT 0,
  likes           bigint NOT NULL DEFAULT 0,
  comments        bigint NOT NULL DEFAULT 0,
  shares          bigint NOT NULL DEFAULT 0,
  saves           bigint NOT NULL DEFAULT 0,
  reach           bigint NOT NULL DEFAULT 0,
  followers_gained int  NOT NULL DEFAULT 0,
  watch_time_seconds bigint,
  source          text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','metricool','api')),
  recorded_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON content_metrics_daily (publication_id, metric_date);
```

**Los valores son totales acumulados a esa fecha, no deltas.** Los deltas diarios se calculan
con una window function. Guardar deltas hace que un día de sincronización perdido quede mal
para siempre en silencio; guardar totales lo vuelve auto-reparable.

Leads, llamadas e ingresos por contenido **no se guardan acá** — se derivan de la atribución de
`journey_events`. Duplicarlos garantizaría desalineación.

---

## 4 · Lead magnets

```sql
CREATE TABLE lead_magnets (
  id          uuid PRIMARY KEY,
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name        text NOT NULL,
  type        text CHECK (type IN ('pdf','template','checklist','video','webinar','audit','other')),
  url         text,
  cta_text    text,
  keyword     text,                          -- la palabra clave que dispara ManyChat
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
CREATE UNIQUE INDEX ON lead_magnets (account_id, lower(keyword))
  WHERE keyword IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE lead_magnet_deliveries (
  id             uuid PRIMARY KEY,
  account_id     uuid NOT NULL,
  lead_magnet_id uuid NOT NULL REFERENCES lead_magnets(id) ON DELETE CASCADE,
  contact_id     uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  publication_id uuid REFERENCES content_publications(id),   -- origen atribuido
  channel        text,                       -- instagram_dm | email | whatsapp
  requested_at   timestamptz NOT NULL,
  delivered_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON lead_magnet_deliveries (account_id, lead_magnet_id, requested_at);
```

Los contadores (solicitudes / leads / llamadas / ventas / revenue por lead magnet, §10) se
**calculan**, nunca se guardan. Ver [09](09-analitica-y-metricas.md).

---

## 5 · CRM

```sql
CREATE TABLE contacts (
  id            uuid PRIMARY KEY,
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  full_name     text,
  email         citext,
  phone         text,                        -- E.164
  instagram_handle text,
  city          text, country text, timezone text,
  source        text,                        -- manychat | manual | import | landing | referral
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz,
  owner_user_id uuid REFERENCES users(id),   -- setter asignado
  merged_into_id uuid REFERENCES contacts(id),   -- se setea al fusionar
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX ON contacts (account_id, last_activity_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX contacts_search ON contacts
  USING gin (to_tsvector('simple', coalesce(full_name,'') || ' ' ||
             coalesce(email::text,'') || ' ' || coalesce(instagram_handle,'')));

CREATE TABLE contact_identities (            -- resolución de identidad entre sistemas
  id         uuid PRIMARY KEY,
  account_id uuid NOT NULL,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN
               ('email','phone','instagram_handle','manychat_subscriber_id',
                'ghl_contact_id','calcom_attendee_id','stripe_customer_id')),
  value      text NOT NULL,
  verified   boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON contact_identities (account_id, kind, lower(value));

CREATE TABLE tags (
  id         uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name       text NOT NULL,
  category   text,                           -- interest | behavior | source | lifecycle
  color      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON tags (account_id, lower(name));

CREATE TABLE contact_tags (                  -- historial, no solo el estado actual (§12)
  id         uuid PRIMARY KEY,
  account_id uuid NOT NULL,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  applied_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,                    -- el retiro lógico preserva la historia
  applied_by uuid REFERENCES users(id),
  source     text NOT NULL DEFAULT 'manual'  -- manual | manychat | automation
);
CREATE INDEX ON contact_tags (contact_id, applied_at);
CREATE UNIQUE INDEX ON contact_tags (contact_id, tag_id) WHERE removed_at IS NULL;

CREATE TABLE pipelines (
  id           uuid PRIMARY KEY,
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name         text NOT NULL,
  funnel_type  text NOT NULL,
  is_default   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE UNIQUE INDEX one_default_pipeline ON pipelines (account_id)
  WHERE is_default AND deleted_at IS NULL;

CREATE TABLE pipeline_stages (
  id          uuid PRIMARY KEY,
  account_id  uuid NOT NULL,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name        text NOT NULL,
  position    int  NOT NULL,
  is_won      boolean NOT NULL DEFAULT false,
  is_lost     boolean NOT NULL DEFAULT false,
  sla_hours   int,                           -- alertar cuando un deal se estanca acá
  deleted_at  timestamptz
);
CREATE UNIQUE INDEX ON pipeline_stages (pipeline_id, position) WHERE deleted_at IS NULL;

CREATE TABLE deals (
  id            uuid PRIMARY KEY,
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id    uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  pipeline_id   uuid NOT NULL REFERENCES pipelines(id),
  stage_id      uuid NOT NULL REFERENCES pipeline_stages(id),   -- modelo de lectura cacheado
  title         text,
  offer_id      uuid REFERENCES offers(id),
  value_cents   bigint NOT NULL DEFAULT 0,
  currency      char(3) NOT NULL DEFAULT 'MXN',
  outcome       text NOT NULL DEFAULT 'open' CHECK (outcome IN ('open','won','lost')),
  lost_reason   text,
  closed_at     timestamptz,
  setter_user_id uuid REFERENCES users(id),
  closer_user_id uuid REFERENCES users(id),
  source_publication_id uuid REFERENCES content_publications(id),   -- atribución
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  CONSTRAINT won_requires_close CHECK (outcome <> 'won' OR (closed_at IS NOT NULL AND value_cents > 0)),
  CONSTRAINT lost_requires_reason CHECK (outcome <> 'lost' OR lost_reason IS NOT NULL)
);
CREATE INDEX ON deals (account_id, stage_id) WHERE deleted_at IS NULL;
CREATE INDEX ON deals (account_id, outcome, closed_at);

CREATE TABLE deal_stage_transitions (        -- habilita tiempo en etapa y caída del funnel
  id         uuid PRIMARY KEY,
  account_id uuid NOT NULL,
  deal_id    uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_stage_id uuid REFERENCES pipeline_stages(id),
  to_stage_id   uuid NOT NULL REFERENCES pipeline_stages(id),
  moved_by   uuid REFERENCES users(id),
  moved_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON deal_stage_transitions (deal_id, moved_at);
```

---

## 6 · Journey events (la columna vertebral)

```sql
CREATE TABLE journey_events (
  id            uuid NOT NULL,
  account_id    uuid NOT NULL,
  contact_id    uuid,                        -- NULL para eventos a nivel cuenta
  occurred_at   timestamptz NOT NULL,
  recorded_at   timestamptz NOT NULL DEFAULT now(),
  event_type    text NOT NULL,
  source_system text NOT NULL,
  subject_type  text,
  subject_id    uuid,
  attribution   jsonb NOT NULL DEFAULT '{}',
  attribution_status text NOT NULL DEFAULT 'pending'
                CHECK (attribution_status IN ('pending','exact','inferred','weak','none')),
  payload       jsonb NOT NULL DEFAULT '{}',
  dedupe_key    text,
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

-- Particiones mensuales, creadas con 3 meses de anticipación por un job de cron.
CREATE TABLE journey_events_2026_09 PARTITION OF journey_events
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE UNIQUE INDEX ON journey_events (account_id, dedupe_key, occurred_at)
  WHERE dedupe_key IS NOT NULL;
CREATE INDEX ON journey_events (account_id, contact_id, occurred_at DESC);
CREATE INDEX ON journey_events (account_id, event_type, occurred_at DESC);
CREATE INDEX ON journey_events USING gin (attribution jsonb_path_ops);
```

**Por qué particionar ahora y no después.** Es la única tabla con crecimiento no acotado (cada
vista, comentario, DM, tag y movimiento de etapa). Agregar particionado cuando ya tenga decenas
de millones de filas significa una ventana de mantenimiento. Hacerlo al crear el esquema cuesta
un job de cron.

**Append-only.** Sin `UPDATE`, sin `DELETE`, salvo el worker seteando `attribution` y
`attribution_status` exactamente una vez. Se fuerza con un trigger que rechaza cualquier otro
update.

---

## 7 · Llamadas

```sql
CREATE TABLE appointments (
  id            uuid PRIMARY KEY,
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id    uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id       uuid REFERENCES deals(id),
  kind          text NOT NULL DEFAULT 'sales' CHECK (kind IN ('sales','onboarding','follow_up')),
  scheduled_at  timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 45,
  setter_user_id uuid REFERENCES users(id),
  closer_user_id uuid REFERENCES users(id),
  status        text NOT NULL DEFAULT 'scheduled' CHECK (status IN
                  ('scheduled','confirmed','rescheduled','held','no_show','cancelled')),
  meeting_url   text,
  external_event_id text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON appointments (account_id, scheduled_at);
CREATE INDEX ON appointments (account_id, closer_user_id, scheduled_at);

CREATE TABLE appointment_reminders (         -- §15 escalera: inmediato, −5h, −1h, −5min
  id             uuid PRIMARY KEY,
  account_id     uuid NOT NULL,
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  offset_minutes int NOT NULL,               -- 0, -300, -60, -5
  channel        text NOT NULL CHECK (channel IN ('email','sms','whatsapp')),
  send_at        timestamptz NOT NULL,
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sent','failed','skipped')),
  sent_at        timestamptz,
  error          text
);
CREATE INDEX ON appointment_reminders (status, send_at) WHERE status = 'pending';

CREATE TABLE call_records (
  id             uuid PRIMARY KEY,
  account_id     uuid NOT NULL,
  appointment_id uuid NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  held_at        timestamptz NOT NULL,
  duration_seconds int,
  outcome        text NOT NULL CHECK (outcome IN
                   ('won','lost','follow_up','reschedule','no_show','not_qualified')),
  offer_id       uuid REFERENCES offers(id),
  quoted_price_cents bigint,
  next_step      text,
  lost_reason    text,
  recording_url  text,
  transcript_url text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE objection_types (               -- taxonomía por cuenta (§17)
  id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,                        -- dinero | timing | confianza | decisión | ...
  sop_id uuid REFERENCES sops(id),           -- el activo de entrenamiento que la corrige
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON objection_types (account_id, lower(name));

CREATE TABLE call_objections (
  id             uuid PRIMARY KEY,
  account_id     uuid NOT NULL,
  call_record_id uuid NOT NULL REFERENCES call_records(id) ON DELETE CASCADE,
  objection_type_id uuid NOT NULL REFERENCES objection_types(id),
  verbatim       text,
  timestamp_seconds int,                     -- en qué punto de la grabación
  detected_by    text NOT NULL DEFAULT 'manual' CHECK (detected_by IN ('manual','ai')),
  confidence     numeric(3,2),               -- solo para detección por IA
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON call_objections (account_id, objection_type_id);
```

`detected_by` + `confidence` importan: una objeción extraída por IA tiene que ser visualmente
distinguible de una que registró un humano, y filtrable fuera de los reportes.

---

## 8 · Habilitación

```sql
CREATE TABLE tasks (
  id           uuid PRIMARY KEY,
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  assignee_user_id uuid REFERENCES users(id),
  due_date     date,
  priority     text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status       text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  project      text,
  related_type text, related_id uuid,        -- link opcional a cualquier entidad
  completed_at timestamptz,
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE INDEX ON tasks (account_id, status, due_date) WHERE deleted_at IS NULL;

CREATE TABLE sops (
  id          uuid PRIMARY KEY,
  account_id  uuid REFERENCES accounts(id) ON DELETE CASCADE,  -- NULL = biblioteca global
  category    text NOT NULL CHECK (category IN ('content','team','sales','marketing','ops')),
  subcategory text,
  title       text NOT NULL,
  body_md     text,
  video_url   text,
  checklist   jsonb,
  resources   jsonb,                         -- [{name, url, type}]
  published   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE TABLE sop_assignments (
  id uuid PRIMARY KEY, account_id uuid NOT NULL,
  sop_id uuid NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  role text,                                 -- asignar a un rol en vez de a una persona
  completed_at timestamptz,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR role IS NOT NULL)
);
```

`sops.account_id NULL` significa la biblioteca global de la agencia — visible para todas las
cuentas, editable solo por admins de plataforma. Así un SOP se escribe una vez y se reutiliza
en todos los clientes.

---

## 9 · Finanzas y rollups

```sql
CREATE TABLE spend_entries (
  id         uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  spend_date date NOT NULL,
  category   text NOT NULL CHECK (category IN ('ads','tools','team','other')),
  channel    text,                           -- meta | google | tiktok | NULL
  amount_cents bigint NOT NULL,
  currency   char(3) NOT NULL,
  source     text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','meta_ads','google_ads')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON spend_entries (account_id, spend_date);

CREATE TABLE kpi_daily (                     -- materializada cada noche; nunca a mano
  account_id      uuid NOT NULL,
  kpi_date        date NOT NULL,             -- en el timezone de la cuenta
  ad_spend_cents  bigint NOT NULL DEFAULT 0,
  total_spend_cents bigint NOT NULL DEFAULT 0,
  new_contacts    int NOT NULL DEFAULT 0,
  lead_magnet_requests int NOT NULL DEFAULT 0,
  appointments_booked  int NOT NULL DEFAULT 0,
  appointments_held    int NOT NULL DEFAULT 0,
  no_shows        int NOT NULL DEFAULT 0,
  deals_won       int NOT NULL DEFAULT 0,
  deals_lost      int NOT NULL DEFAULT 0,
  revenue_cents   bigint NOT NULL DEFAULT 0,
  computed_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, kpi_date)
);
```

Las tasas (CPL, CAC, close rate) **no** se guardan — son ratios que se calculan al leer, a
partir de estos conteos. Guardar un ratio significa que no se puede recalcular para un rango de
fechas arbitrario sin que quede mal.

---

## 10 · Integraciones

```sql
CREATE TABLE integration_connections (
  id           uuid PRIMARY KEY,
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider     text NOT NULL CHECK (provider IN
                 ('manychat','metricool','gohighlevel','calcom','meta_ads','google_ads','stripe')),
  status       text NOT NULL DEFAULT 'disconnected'
               CHECK (status IN ('connected','disconnected','error','expired')),
  credentials  bytea NOT NULL,               -- cifrado con pgcrypto; la llave sale del env
  config       jsonb NOT NULL DEFAULT '{}',
  last_sync_at timestamptz,
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON integration_connections (account_id, provider);

CREATE TABLE webhook_events (                -- la bandeja; la entrada hostil aterriza acá
  id          uuid PRIMARY KEY,
  provider    text NOT NULL,
  account_id  uuid,                          -- se resuelve al procesar, puede empezar NULL
  external_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload     jsonb NOT NULL,
  status      text NOT NULL DEFAULT 'received'
              CHECK (status IN ('received','processed','failed','ignored')),
  processed_at timestamptz,
  attempts    int NOT NULL DEFAULT 0,
  error       text
);
CREATE UNIQUE INDEX ON webhook_events (provider, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX ON webhook_events (status, received_at) WHERE status IN ('received','failed');

CREATE TABLE sync_jobs (
  id uuid PRIMARY KEY,
  connection_id uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  account_id uuid NOT NULL, kind text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
  status text NOT NULL DEFAULT 'running', stats jsonb, error text
);
```

Los payloads crudos se retienen 90 días y después se purgan — contienen PII y no tienen valor
de largo plazo una vez procesados.

---

## 11 · Asistente (Fase 6)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id          uuid PRIMARY KEY,
  account_id  uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN
                ('sop','strategy','call_transcript','content_script','note')),
  source_id   uuid,
  title       text NOT NULL,
  content     text NOT NULL,
  content_hash text NOT NULL,                -- evita re-embeber contenido sin cambios
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE document_chunks (
  id          uuid PRIMARY KEY,
  account_id  uuid NOT NULL,                 -- desnormalizado A PROPÓSITO: RLS filtra acá
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content     text NOT NULL,
  embedding   halfvec(1536),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON document_chunks USING hnsw (embedding halfvec_cosine_ops);
CREATE INDEX ON document_chunks (account_id);

CREATE TABLE assistant_conversations (
  id uuid PRIMARY KEY, account_id uuid NOT NULL, user_id uuid NOT NULL REFERENCES users(id),
  title text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE assistant_messages (
  id uuid PRIMARY KEY, account_id uuid NOT NULL,
  conversation_id uuid NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','tool')),
  content text NOT NULL,
  tool_calls jsonb,
  citations jsonb,                           -- [{type, id, label}] — cada número enlaza a un registro
  tokens_in int, tokens_out int,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

`account_id` en `document_chunks` está desnormalizado a propósito: RLS tiene que filtrar
**antes** de consultar el índice vectorial. Exigir un join a `documents` para el chequeo de
tenant hace que la búsqueda ANN barra entre tenants primero — lento y además riesgo de fuga.

`halfvec` reduce el almacenamiento a la mitad frente a `vector` con pérdida de recall
despreciable a esta escala.

---

## Row-Level Security

Se aplica a toda tabla que lleva `account_id`.

```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;   -- aplica también al dueño de la tabla

CREATE POLICY tenant_isolation ON contacts
  USING       (account_id = current_setting('app.current_account_id', true)::uuid)
  WITH CHECK  (account_id = current_setting('app.current_account_id', true)::uuid);
```

- La aplicación se conecta con un rol que **no** es dueño de las tablas y **no** es superusuario.
- `SET LOCAL app.current_account_id = '<uuid>'` corre al inicio de la transacción de cada
  request. `LOCAL` lo limita a la transacción, así una conexión del pool no puede filtrar el
  tenant del request anterior.
- Los admins de plataforma que operan entre cuentas usan un rol aparte con una política
  explícita equivalente a `BYPASSRLS`, y cada acción de ese tipo escribe en `audit_log`.
- Las migraciones corren con el rol dueño, que está exento.

RLS es la **segunda** línea de defensa. La capa de aplicación igual acota cada query. Tienen que
fallar dos mecanismos independientes para que haya una fuga.

## Checklist de revisión de índices

Antes de que salga la Fase 4, correr `EXPLAIN ANALYZE` sobre esto y confirmar que no hay
sequential scans:

- Vista de calendario del mes: `content_publications` por rango de `(account_id, scheduled_at)`.
- Tablero de pipeline: `deals` por `(account_id, stage_id)` con join a contactos.
- Timeline de contacto: `journey_events` por `(account_id, contact_id, occurred_at DESC)`.
- Leaderboard de contenido: `journey_events` agregado por `attribution->>'publication_id'`.
- Performance del closer: `call_objections` con join a `call_records` por `closer_user_id`.
