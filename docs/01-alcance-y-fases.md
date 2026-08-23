# 01 · Alcance y Fases de Entrega

Seis fases. Cada una tiene **criterios de salida** — condiciones objetivas, no "ya se siente
terminado". Una fase no arranca hasta que la anterior los cumple.

El brief original listaba 28 secciones. Están mapeadas a fases más abajo para que nada se pierda.

---

## Fase 0 — Cimientos (solo infraestructura, cero funcionalidades)

No estaba en el brief original, y saltársela es la forma más común de que un proyecto así se
pudra al tercer mes.

**Construir**
- Estructura del repo, `Makefile`, `docker-compose` para Postgres + pgvector local.
- Herramienta de migraciones (goose) con una primera migración que cree `accounts` y `users`.
- CI: `go vet`, `go test ./...`, `sqlc diff`, biome + `tsc --noEmit`, `vitest run`.
- Logging estructurado (`log/slog` en JSON) y endpoint `/healthz`.
- Script de seed que produzca una cuenta ficticia con datos realistas — todas las fases
  posteriores se demuestran contra ella.

**Criterios de salida**
- `make up && make migrate && make seed && make test` funciona desde un clon limpio en una
  máquina nueva.
- CI queda en rojo cuando falla un test y en verde cuando no.

---

## Fase 1 — Base (brief §26, §3, §4)

**Construir**
- `accounts` (tenants), `users`, `account_memberships` con roles.
- **Roles de plataforma `admin` y `dev`** con sus permisos separados ([06](06-multitenancy-auth-rbac.md#roles-de-plataforma)).
- Auth: email + contraseña, JWT de acceso + refresh token con rotación. MFA obligatorio para
  todo actor de plataforma.
- Middleware de RBAC y la matriz de permisos de [06](06-multitenancy-auth-rbac.md).
- RLS de Postgres habilitado en todas las tablas con tenant.
- Consola de plataforma: crear, editar, suspender y archivar tenants; invitar usuarios;
  asignar roles.
- **Impersonación auditada** con motivo obligatorio, expiración de 30 min, franja visible y
  notificación al owner.
- **Branding de tenant**: carga de logo (claro / oscuro / marca) y color, con vista previa en
  vivo en ambos modos ([DESIGN.md §13](../DESIGN.md#13--branding-de-tenant)).
- Onboarding: thank-you page, agendamiento con la **regla de mínimo 2 días**, formulario de
  onboarding (negocio / posicionamiento / marketing / equipo / objetivos) guardado como
  submission versionada.
- Módulo de estrategia: documento de estrategia versionado (posicionamiento, validación de
  mercado, estrategia de contenido, configuración de funnel) escrito por el admin, leído por
  el cliente.
- Shell del Overview: navegación y estados vacíos para todos los módulos futuros.

**Criterios de salida**
- Se puede crear una cuenta de cliente, onboardearla de punta a punta, y el cliente puede
  entrar y leer su estrategia — sin que nadie corra SQL a mano.
- Un test automatizado prueba que la cuenta A no puede leer datos de la cuenta B por ningún
  endpoint.
- Un `dev` no puede tocar facturación ni estrategia; un `admin` no puede leer payloads crudos
  de webhook. Ambas restricciones cubiertas por test.
- Toda sesión de impersonación deja rastro en `audit_log` con el actor real y el impersonado.

---

## Fase 2 — Operación (brief §5, §6, §20, §21, §22, §24)

**Construir**
- `content_pieces` con la estructura H–C–CTA completa y el flujo de 7 estados.
- `content_publications`: una pieza → muchas publicaciones por plataforma (multicuenta desde
  el día uno).
- Vista de calendario (mes + semana) alimentada por `content_publications.scheduled_at`.
- Tareas: responsable, fecha límite, prioridad, 3 estados, link opcional a cualquier entidad.
- Equipo: miembros, roles, SOPs asignados.
- Biblioteca de SOPs: categorías, cuerpo en markdown, URL de video, checklist, plantillas.

**Criterios de salida**
- Un reel puede recorrer IDEA → PUBLICADO con una URL registrada por plataforma.
- El calendario muestra correctamente una pieza apareciendo en tres plataformas el mismo día.

---

## Fase 3 — CRM (brief §10, §12, §13, §14, §19, §11 parcial)

El núcleo del reemplazo de GoHighLevel.

**Construir**
- `contacts` con resolución de identidad múltiple (email / teléfono / handle de IG /
  subscriber id de ManyChat).
- Tags con historial completo de aplicación.
- Pipelines y etapas configurables; tipo de funnel elegido por cuenta (§14).
- Deals con historial de transiciones de etapa (habilita métricas de tiempo en etapa).
- Lead magnets y seguimiento de entregas.
- **Log append-only `journey_events`** — la columna vertebral. Todos los módulos escriben ahí.
- UI de timeline del customer journey por contacto.
- Ingesta de webhooks de ManyChat (solo lectura: entran eventos, no sale nada).

**Criterios de salida**
- Un contacto creado por un webhook de ManyChat aparece en el pipeline con la atribución
  correcta hacia una `content_publication` específica.
- Reenviar el mismo payload de webhook dos veces crea exactamente un evento (idempotencia
  demostrada con test).

---

## Fase 4 — Llamadas, Ventas y Analítica (brief §7, §8, §15, §16, §17, §18)

**Construir**
- Citas con la escalera de recordatorios (inmediato / −5h / −1h / −5min) como jobs agendados.
- Registros de llamada: setter, closer, duración, resultado, oferta, precio, próximo paso,
  motivo de pérdida.
- Objeciones estructuradas con una taxonomía de objeciones por cuenta.
- Performance del closer: llamadas, cierres, close rate, distribución de objeciones,
  detección de debilidades.
- Métricas de contenido: primero carga manual, por publicación, por día (snapshots).
- Dashboard financiero: gastos, CPL, CPA, CAC, show rate, close rate, ticket promedio, ROI.
- Job nocturno de rollup que materializa `kpi_daily`.

**Criterios de salida**
- Todos los KPIs de [09-analitica-y-metricas.md](09-analitica-y-metricas.md) renderizan un
  valor que coincide con un cálculo hecho a mano sobre el dataset de seed.
- El dashboard financiero carga en menos de 500 ms con 12 meses de datos sembrados.

---

## Fase 5 — Integraciones (brief §9, §25)

Deliberadamente **después** de la analítica: el esquema debe estar probado con datos manuales
antes de permitir que una API escriba en él.

Orden de prioridad, cada una entregable de forma independiente:
1. Calendario / agendamiento (Cal.com) — mayor valor operativo.
2. ManyChat — profundizar más allá de la ingesta de la Fase 3.
3. Metricool — sincronización de métricas ⚠️ *ver [07](07-integraciones.md), acceso a la API
   sin verificar*.
4. Datos de pagos/ventas.
5. Ads (Meta, Google) para gasto real en lugar de carga manual.

**Criterios de salida por integración**
- La conexión se puede establecer, revocar y volver a establecer desde la UI.
- Una falla de sincronización genera una alerta y no corrompe los datos existentes.

---

## Fase 6 — Inteligencia (brief §23, §17 avanzado)

**Construir**
- Un perfil de Hermes por cuenta con acceso a herramientas limitado a esa cuenta.
- Embeddings con pgvector sobre SOPs, estrategia y transcripciones de llamadas.
- Consulta en lenguaje natural sobre los datos propios de la cuenta.
- Análisis de transcripciones → extracción automática de objeciones.
- Recomendaciones de coaching para closers vinculadas a SOPs específicos.

**Criterios de salida**
- Una prueba de red team demuestra que el asistente de la cuenta A no puede recuperar datos
  de la cuenta B.
- Toda respuesta del asistente que cite un número enlaza al registro que lo respalda.

Ver [08-hermes-capa-ia.md](08-hermes-capa-ia.md).

---

## Trazabilidad sección → fase

| Brief § | Tema | Fase |
|---|---|---|
| 1, 2 | Objetivo, estructura de la app | 1 |
| 3 | Onboarding | 1 |
| 4 | Estrategia | 1 |
| 5 | Contenido | 2 |
| 6 | Calendario | 2 |
| 7 | Métricas de contenido | 4 |
| 8 | Análisis H–C–CTA | 2 (captura) / 4 (análisis) |
| 9 | Publicación | 2 (registro) / 5 (sync Metricool) |
| 10 | Lead magnets | 3 |
| 11 | ManyChat / automatización | 3 (ingesta) / 5 (profundo) |
| 12 | Tags | 3 |
| 13 | CRM / pipeline | 3 |
| 14 | Tipos de funnel | 3 |
| 15 | Confirmación de llamadas | 4 |
| 16 | Llamadas de venta | 4 |
| 17 | Performance del closer | 4 (métricas) / 6 (detección con IA) |
| 18 | Dashboard financiero | 4 |
| 19 | Customer journey | 3 |
| 20 | SOPs | 2 |
| 21 | Tareas | 2 |
| 22 | Equipo | 2 |
| 23 | IA | 6 |
| 24 | Multicuenta | 2 (integrado desde el inicio) |
| 25 | Integraciones | 5 |
| 26 | Arquitectura de usuarios | 1 |
| 27, 28 | Fases, filosofía | este documento |
