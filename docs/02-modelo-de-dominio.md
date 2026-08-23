# 02 · Modelo de Dominio

Screaming architecture: los nombres de los paquetes tienen que gritar el negocio, no el
framework. Un desarrollador que abre `internal/` debe ver `content/`, `crm/`, `calls/` —
nunca `controllers/`, `models/`, `services/`.

---

## Contextos delimitados

Once contextos. Cada uno es dueño de sus tablas, expone una interfaz explícita y nunca mete
la mano en las tablas de otro contexto.

```
internal/
├── identity/      usuarios, cuentas (tenants), membresías, roles, sesiones
├── onboarding/    agendamiento, formularios, checklist de activación
├── strategy/      posicionamiento, validación de mercado, estrategia de contenido, funnel
├── content/       piezas, hooks, ángulos, pilares, guiones, publicaciones, canales
├── crm/           contactos, identidades, tags, pipelines, deals, transiciones de etapa
├── journey/       el log append-only de eventos + proyecciones de timeline
├── calls/         citas, recordatorios, registros de llamada, objeciones
├── enablement/    tareas, equipo, SOPs, lead magnets, recursos
├── analytics/     snapshots de métricas, gastos, rollups de KPI, performance del closer
├── integrations/  conexiones, bandeja de webhooks, jobs de sincronización
└── assistant/     documentos, chunks, embeddings, conversaciones
```

### Relaciones entre contextos

```
identity ──────────────► todo (account_id es universal)

strategy ──referencia──► content (ángulos, pilares, ofertas)
content  ──emite───────► journey
crm      ──emite───────► journey
calls    ──emite───────► journey
enablement ─emite──────► journey   (lead magnet entregado)
integrations ─emite────► journey   (interacción de ManyChat)

journey  ──alimenta────► analytics (atribución)
analytics ─lee─────────► crm, calls, content  (proyecciones de solo lectura)
assistant ─lee─────────► analytics, strategy, enablement (nunca escribe datos de negocio)
```

**Regla:** `journey` lo escriben muchos contextos y lo leen `analytics` y `assistant`. Nada
más puede leer eventos crudos del journey — todo lo demás pasa por `analytics`.

---

## La columna vertebral: journey events

Esta es la decisión de diseño que diferencia al producto de un CRM genérico.

Cada interacción significativa se agrega a un único log inmutable:

```
journey_events
  id            uuid
  account_id    uuid          -- tenant
  contact_id    uuid          -- quién
  occurred_at   timestamptz   -- cuándo pasó de verdad (no cuándo lo registramos)
  recorded_at   timestamptz   -- cuándo nos enteramos
  event_type    text          -- qué
  source_system text          -- manychat | metricool | manual | app | calcom | ...
  subject_type  text          -- content_publication | lead_magnet | appointment | deal
  subject_id    uuid          -- cuál
  attribution   jsonb         -- origen resuelto: publication_id, angle_id, hook_type, cta_type
  payload       jsonb         -- detalle crudo específico del proveedor
  dedupe_key    text UNIQUE   -- id del evento del proveedor; hace idempotente la ingesta
```

### Por qué un log de eventos y no solo columnas de estado

| Pregunta del brief | ¿Se responde con columnas de estado? | ¿Se responde con el log? |
|---|---|---|
| "¿Cuántos leads tengo?" | Sí | Sí |
| "¿Qué hook generó más leads?" (§7) | No | Sí |
| "¿Cuánto tarda alguien desde el primer contacto hasta la compra?" (§19) | No | Sí |
| "Mostrame todo el historial de tags de Juan" (§12) | No | Sí |
| "¿Qué contenido produjo ingresos?" (§7) | No | Sí |
| "¿Qué ángulo debería seguir usando?" (§23) | No | Sí |

Las columnas de estado registran *dónde está* un contacto. El log registra *cómo llegó ahí*.
Las secciones 7, 8, 12, 17, 19 y 23 del brief son todas preguntas de atribución, y ninguna
se puede responder sin el log.

### Vocabulario canónico de eventos

Vocabulario fijo. Agregar un tipo es una migración, no una decisión de texto libre.

| Categoría | Tipos de evento |
|---|---|
| Contenido | `content.published`, `content.commented`, `content.viewed` |
| Lead magnet | `leadmagnet.requested`, `leadmagnet.delivered` |
| Mensajería | `dm.started`, `dm.replied`, `automation.triggered` |
| CRM | `contact.created`, `tag.applied`, `tag.removed`, `deal.created`, `deal.stage_changed` |
| Llamadas | `appointment.booked`, `appointment.confirmed`, `appointment.rescheduled`, `appointment.no_show`, `call.held` |
| Ingresos | `deal.won`, `deal.lost`, `payment.received` |

### Resolución de atribución

Cuando llega un evento sin origen conocido (lo típico en un DM de ManyChat), corre un
resolvedor de atribución:

1. ¿El payload trae una referencia a `content_publication`? → usarla (exacta).
2. ¿El contacto tiene un `content.commented` previo dentro de 72 h? → usarlo (inferida).
3. ¿Hubo exactamente una publicación viva en las 24 h anteriores? → usarla (débil).
4. Si no → `unattributed`.

Cada atribución guarda su **nivel de confianza** (`exact | inferred | weak | none`). Los
reportes deben poder excluir todo lo que esté por debajo de `inferred`. Nunca presentar una
suposición como un hecho.

---

## Agregados e invariantes

### Account (raíz de agregado, `identity`)

El tenant. Cada fila del sistema pertenece a exactamente una cuenta.

**Invariantes**
- Una cuenta siempre tiene al menos un miembro con rol `owner`.
- Una cuenta tiene exactamente una versión activa de `strategy` a la vez.
- Borrar una cuenta es borrado lógico; el borrado físico es una operación offline y auditada.

### ContentPiece (raíz de agregado, `content`)

Una idea creativa. No una publicación.

**Invariantes**
- Las transiciones de estado siguen
  `IDEA → GUION → GRABACIÓN → EDICIÓN → APROBACIÓN → PROGRAMADO → PUBLICADO`.
  Las transiciones hacia atrás están permitidas y **quedan registradas**; saltarse pasos hacia
  adelante, no.
- Una pieza solo puede llegar a `PROGRAMADO` si tiene al menos una `ContentPublication`.
- Hook / contexto / CTA son obligatorios para salir de `GUION`. Esto se fuerza porque todo el
  análisis de §8 depende de que esos tres campos estén poblados — como campos opcionales
  estarían vacíos en la práctica y el análisis no valdría nada.

**Decisión de modelado clave — pieza ≠ publicación**

El ejemplo de calendario del brief muestra un reel en Instagram + TikTok + YouTube Shorts el
mismo día. Modelarlo como tres filas en una tabla `content` triplicaría cada métrica y haría
imposible responder "qué contenido vendió más".

```
ContentPiece "Reel #01"
  ├── Publicación → Instagram @cuenta1   · 24 Mar · url · 12,400 views
  ├── Publicación → TikTok @cuenta1      · 24 Mar · url ·  8,100 views
  └── Publicación → YouTube Shorts       · 24 Mar · url ·  3,200 views
```

Las métricas se adhieren a la **publicación**. Los atributos creativos (hook, ángulo, CTA) se
adhieren a la **pieza**. "Qué hook funciona mejor" agrega las métricas de las publicaciones
hacia arriba, hasta la pieza.

### Contact (raíz de agregado, `crm`)

Una persona. Posiblemente conocida por varios identificadores en varios sistemas.

**Invariantes**
- Un contacto tiene ≥ 1 `contact_identity`.
- Un valor de identidad es único **por cuenta y por tipo** — el mismo handle de Instagram no
  puede apuntar a dos contactos en una cuenta, pero dos cuentas distintas pueden tenerlo.
- Fusionar contactos es explícito y reversible por 30 días; los eventos del journey se
  reapuntan, nunca se borran.

**Tipos de identidad:** `email`, `phone`, `instagram_handle`, `manychat_subscriber_id`,
`ghl_contact_id`, `calcom_attendee_id`.

La resolución de identidad es el problema de corrección más difícil del sistema. Un lead
comenta en Instagram (handle de IG), recibe un DM (id de ManyChat), da un email por un lead
magnet, y después agenda una llamada con un teléfono. Es una persona y cuatro identificadores.
Si la resolución falla, **todas** las métricas de abajo quedan mal.

### Deal (raíz de agregado, `crm`)

Una oportunidad de venta en un pipeline. Separada de Contact porque un contacto puede comprar
dos veces.

**Invariantes**
- Un deal pertenece a exactamente un pipeline; su etapa debe pertenecer a ese pipeline.
- Cada cambio de etapa escribe una fila en `stage_transitions`. La etapa actual es derivable
  de las transiciones — la columna en `deals` es un modelo de lectura cacheado, y un job de
  consistencia lo verifica cada noche.
- El resultado es `open | won | lost`. `won` exige `value_cents > 0` y `closed_at`.
- `lost` exige un `lost_reason` de la taxonomía de la cuenta.

### Appointment (raíz de agregado, `calls`)

**Invariantes**
- `scheduled_at` debe ser ≥ ahora + 2 días **solo para agendamientos de onboarding** (§3).
  Las llamadas de venta no tienen esa restricción.
- Los recordatorios se generan como filas al momento de agendar, y después los despacha un
  worker. Generarlos de forma perezosa al momento de enviar los vuelve imposibles de
  inspeccionar o auditar.
- Un `call_record` solo puede existir para una cita en estado `held`.

### Strategy (raíz de agregado, `strategy`)

**Versionada, nunca editada en el lugar.** Los hallazgos de la auditoría evolucionan; el
cliente debe poder ver cuál era la estrategia en marzo cuando revisa los números de marzo.

---

## Los tipos de funnel son configuración (§14)

Cuatro tipos de funnel, pero no son cuatro caminos de código. Un tipo de funnel es una
**plantilla** que siembra las etapas de un pipeline y declara qué módulos son relevantes.

```
funnel_type: consulting | infoproduct | low_ticket | agency

consulting   → etapas: new, contacted, no_answer, follow_up, booked, confirmed,
                       call_held, reschedule, won, lost
                módulos: calls ✓  setters ✓  closers ✓  checkout ✗

infoproduct  → etapas: new, lead_magnet_sent, landing_visited, checkout_started, purchased
                módulos: calls ✗  setters ✗  closers ✗  checkout ✓

low_ticket   → etapas: new, landing_visited, checkout_started, purchased
agency       → misma forma que consulting
```

La plantilla solo siembra datos iniciales. Después del seed, las etapas se editan libremente
por cuenta — eso satisface el requerimiento de "configurable por cliente" sin necesidad de
tablas definidas por el usuario.

---

## Lenguaje ubicuo

Fijar estos términos ahora; la inconsistencia acá aparece después como bugs.

| Término | Significa | **No** significa |
|---|---|---|
| **Cuenta (Account)** | Un tenant — uno de los clientes de la agencia | Una cuenta de red social (eso es un *Canal*) |
| **Canal (Channel)** | Un perfil social conectado (`@handle` en una plataforma) | Un canal de marketing |
| **Contacto (Contact)** | Una persona en el CRM | Un lead (un lead es un contacto en etapa temprana) |
| **Pieza (Piece)** | Una idea creativa | Una publicación |
| **Publicación (Publication)** | Una pieza publicada en un canal | El acto de publicar |
| **Deal** | Una oportunidad de venta | Una venta cerrada |
| **Evento (Event)** | Un registro inmutable del journey | Una cita del calendario |
| **Miembro (Member)** | Un usuario con rol dentro de una cuenta | Un contacto |
