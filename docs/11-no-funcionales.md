# 11 · Requerimientos No Funcionales

## Seguridad

### Datos que este sistema custodia

Vale enumerarlo para dimensionar el riesgo con honestidad:

- PII de contactos: nombres, emails, teléfonos, handles de Instagram.
- Grabaciones y transcripciones de llamadas de venta.
- Cifras de ingresos y márgenes de varios negocios.
- Estrategia de negocio y posicionamiento.
- Credenciales de plataformas de terceros.

Una brecha acá no expone datos de una empresa. Expone los datos de **todos los clientes de la
agencia a la vez**, incluidos sus propios leads. El daño reputacional recae sobre la agencia.

### Controles

| Área | Control |
|---|---|
| Transporte | TLS 1.3 obligatorio, HSTS, sin downgrade |
| En reposo | Cifrado de disco en el host; credenciales de integración cifradas con pgcrypto |
| Contraseñas | bcrypt costo 12; mínimo 12 caracteres; verificación contra listas de filtraciones |
| Tokens | Access 15 min; refresh rotativo con detección de reuso |
| MFA | TOTP obligatorio para `owner`, `manager` y admins de plataforma antes de producción |
| Aislamiento | Tres capas (ruta, middleware, RLS) — ver [06](06-multitenancy-auth-rbac.md) |
| Inyección SQL | sqlc genera queries parametrizadas; hay cero SQL construido por concatenación |
| XSS | React escapa por defecto; `dangerouslySetInnerHTML` prohibido salvo con sanitizado explícito para markdown de SOPs |
| CSRF | Cookies `SameSite=Strict`; el access token va en header, no en cookie |
| Rate limiting | Por IP en login; por cuenta en la API; por cuenta en el asistente |
| Subida de archivos | Lista blanca de tipos, límite de tamaño, escaneo antivirus antes de servir |
| Secretos | En variables de entorno, nunca en el repo; rotables sin redeploy donde se pueda |
| Dependencias | Dependabot + `govulncheck` + `bun audit` en CI |
| Cabeceras | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |

### Privacidad y cumplimiento

Los clientes están en México (LFPDPPP) y potencialmente en la UE (GDPR).

**Requerimientos que hay que soportar:**

- **Derecho de acceso**: exportar todos los datos de un contacto en formato legible.
- **Derecho de supresión**: borrar un contacto y todos sus journey events. Con excepción: los
  registros financieros de un deal ganado se conservan anonimizados por obligación contable.
- **Retención de datos**: los payloads de webhook se purgan a los 90 días. Las grabaciones de
  llamada necesitan una política de retención definida por la agencia — **no está definida y es
  un punto abierto** ([12](12-riesgos-y-preguntas-abiertas.md)).
- **Consentimiento de grabación**: grabar una llamada de venta requiere consentimiento en
  varias jurisdicciones. La app debe registrar que se obtuvo. **Es una decisión legal, no
  técnica.**

**No somos abogados.** Estos puntos se marcan para que la agencia consulte con quien
corresponda antes de que entre el primer cliente real.

---

## Performance

### Objetivos

| Operación | Objetivo (p95) |
|---|---|
| Carga de página (LCP) | < 2.0 s |
| Respuesta de API, lectura simple | < 150 ms |
| Respuesta de API, dashboard analítico | < 500 ms |
| Tablero de pipeline con 5,000 deals | < 800 ms |
| Timeline de contacto con 500 eventos | < 300 ms |
| Búsqueda de contactos | < 200 ms |
| Respuesta del asistente (primer token) | < 3 s |

### Cómo se sostienen

- **`kpi_daily` materializada** — el dashboard financiero no agrega tablas crudas.
- **Particionado de `journey_events`** — las consultas por rango tocan pocas particiones.
- **Paginación por cursor** en todas las listas. `OFFSET` se degrada linealmente y en el
  tablero de pipeline eso se nota.
- **Virtualización de tablas** en el frontend para más de 100 filas.
- **Índices verificados con `EXPLAIN ANALYZE`** antes de cada release de fase.
- **Sin N+1**: los repositorios usan joins o batching. Un test de conteo de queries protege las
  rutas críticas.

### Presupuesto de crecimiento

Estimación para 10 cuentas activas al año 1:

| Tabla | Filas/año | Notas |
|---|---|---|
| `journey_events` | ~2–5 M | La que domina |
| `content_metrics_daily` | ~500 K | 1 fila por publicación por día |
| `contacts` | ~50 K | |
| `deals` | ~15 K | |
| `webhook_events` | ~1 M | Purgada a los 90 días |

Nada de esto presiona a Postgres. El diseño se sostiene hasta un orden de magnitud más.

---

## Confiabilidad

### Backups

- **Postgres**: `pg_dump` diario completo + WAL archiving para recuperación a un punto en el
  tiempo. Retención: 30 días de diarios, 7 días de PITR.
- **Object storage**: versionado activo, retención de 30 días.
- **Prueba de restauración mensual.** Un backup que nunca se restauró no es un backup. Esto se
  agenda y se documenta.

### Objetivos de recuperación

| Métrica | Objetivo |
|---|---|
| RPO (pérdida máxima aceptable) | 1 hora |
| RTO (tiempo máximo de recuperación) | 4 horas |

Estos objetivos son alcanzables con un solo VPS y backups. Un RTO menor requeriría un standby
caliente, que no se justifica al tamaño actual.

### Degradación elegante

| Falla | Comportamiento |
|---|---|
| Hermes caído | El asistente muestra "no disponible"; el resto del dashboard funciona normal |
| Metricool caído | Las métricas muestran su antigüedad; la carga manual sigue disponible |
| ManyChat caído | Los webhooks se acumulan del lado de ManyChat; se procesan al volver |
| Resend caído | Los recordatorios se reintentan con backoff; se alerta después de 3 fallas |
| Base de datos caída | Página de mantenimiento; sin escrituras parciales |

**Ninguna dependencia externa puede tumbar el dashboard.** Ese es el punto de que el dashboard
sea dueño de los datos.

---

## Observabilidad

### Logging

`log/slog` en JSON, con `request_id` en cada línea.

**Nunca loggear:** contraseñas, tokens, contenido completo de payloads con PII, transcripciones
de llamada. Un log con PII es una base de datos de PII sin controles de acceso.

### Métricas

Endpoint Prometheus con, como mínimo:

- Tasa de requests, tasa de errores y latencia por endpoint.
- Profundidad de la cola de jobs y tasa de fallas por tipo de job.
- Antigüedad de la bandeja de webhooks (el indicador temprano más útil).
- Uso del pool de conexiones.
- Tokens consumidos por el asistente, por cuenta.

### Alertas

Pocas y accionables. Una alerta que se ignora entrena al equipo a ignorar alertas.

| Condición | Severidad |
|---|---|
| Tasa de error de la API > 1% en 5 min | Crítica |
| Cola de jobs > 1000 pendientes | Alta |
| Un job falló todos sus reintentos | Alta |
| Bandeja de webhooks con antigüedad > 15 min | Alta |
| Falla del backup | Crítica |
| Certificado TLS por vencer en < 14 días | Media |
| Una integración en estado `error` | Media |

### Trazas

OpenTelemetry desde el inicio, aunque no se use al principio. Instrumentar después es una
refactorización; instrumentar desde el día uno es una línea en el middleware.

---

## Deploy

### Entornos

| Entorno | Propósito | Datos |
|---|---|---|
| Local | Desarrollo | Seed sintético |
| Staging | QA e integraciones | Datos anonimizados de producción |
| Producción | En vivo | Datos reales |

**Los datos de staging se anonimizan.** Copiar producción a staging con PII real es la forma
más común de filtrar datos de clientes sin que haya un ataque de por medio.

### Pipeline

```
push → CI (lint, tests, build) → imagen a registry
     → deploy manual a staging → smoke tests
     → deploy manual a producción (aprobado por humano)
```

Sin deploy automático a producción. Al tamaño de este equipo, la puerta humana cuesta minutos y
evita el redespliegue de las 3 de la mañana.

### Migraciones

- Corren como paso separado antes del deploy de la app.
- **Compatibles hacia atrás siempre**: expandir, migrar, contraer. Una columna se agrega en un
  release, se llena en el siguiente, y la vieja se borra en un tercero.
- Cada migración tiene un `down` probado.
- Las migraciones destructivas requieren aprobación explícita y un backup fresco verificado.

### Rollback

- La app: redeploy del tag anterior.
- La base: hacia adelante, no hacia atrás. Un `down` que se corre en producción con datos
  nuevos escritos pierde datos. Por eso las migraciones son compatibles hacia atrás.

---

## Accesibilidad

Objetivo: WCAG 2.1 AA.

- Contraste mínimo 4.5:1 para texto normal.
- Todo lo interactivo alcanzable por teclado, con foco visible.
- Etiquetas ARIA en el tablero de pipeline y el calendario (los dos componentes con drag and
  drop, que son los que más se rompen para lectores de pantalla).
- El color nunca es el único portador de información: los estados llevan ícono o texto además
  de color.
- `prefers-reduced-motion` respetado.

Se verifica con axe-core en CI y con un recorrido manual por teclado antes de cada release de
fase.

---

## Internacionalización

- **UI en español** como default (el cliente y sus clientes son hispanohablantes).
- La estructura de i18n se deja lista desde el día uno: sin cadenas hardcodeadas en los
  componentes. Retrofitear i18n cuesta diez veces más que empezar con él.
- Los identificadores de código, nombres de tabla y claves de API van en inglés.
- Las monedas se formatean según la moneda de la cuenta, no según el locale del navegador.
- Las fechas se formatean en el timezone de la cuenta.
