# 07 · Integraciones

## Principio rector

El dashboard es el dueño de los datos. Las plataformas externas son **fuentes**, no la verdad.
Cada integración se construye en este orden:

```
1. Entrada manual   → el esquema queda probado con datos reales cargados a mano
2. Importación CSV  → carga masiva, mismo esquema
3. Sync por API     → automatización, mismo esquema
```

Saltar al paso 3 es lo que produce esquemas moldeados por la forma que tiene la API de un
tercero en lugar de por el negocio. Cuando esa API cambie o se reemplace, el esquema queda
inservible.

---

## ⚠️ Estado de verificación

**Nada de lo que sigue está confirmado contra la documentación en vivo del proveedor.** Antes
de comprometer trabajo de la Fase 5, alguien tiene que verificar cada punto marcado y anotar
el resultado acá. Planear sobre acceso a API asumido es la forma más rápida de perder una
fase entera.

| Proveedor | Qué hay que verificar | Estado |
|---|---|---|
| ManyChat | Que el plan del cliente incluya External Request / webhooks salientes | ⚠️ Sin verificar |
| Metricool | Que exista API pública, en qué plan, y qué métricas expone | ⚠️ Sin verificar — **es un supuesto de riesgo alto** |
| GoHighLevel | Formato de exportación y si hace falta API para migrar el histórico | ⚠️ Sin verificar |
| Cal.com | Self-hosted vs cloud; payload de webhooks | ⚠️ Sin verificar |
| Instagram Messaging API | Permisos requeridos y tiempo de App Review de Meta | ⚠️ Sin verificar |

---

## 1 · ManyChat — la entrada del lead (§11)

**Se queda. No se reemplaza.**

### Por qué Hermes no reemplaza a ManyChat

Este punto merece precisión, porque la intención original era reemplazarlo.

Hermes Agent soporta 21 plataformas de mensajería: `telegram`, `discord`, `slack`, `whatsapp`,
`email`, `sms`, `teams`, `matrix`, `mattermost`, `irc`, `line`, `feishu`, `wecom`, `dingtalk`,
`google_chat`, `homeassistant`, `ntfy`, `simplex`, `buzz`, `photon`, `raft`.

**Instagram no está en esa lista.** Y el funnel descrito en el brief empieza exactamente ahí:
*contenido → la persona comenta → ManyChat → automatización → lead magnet*. El disparador
comentario-en-Reel → DM es la función central de ManyChat en este sistema, y Hermes no tiene
un adaptador que lo haga.

Construirlo significaría integrarse directo con la Instagram Messaging API de Meta:
- Cuenta de Instagram Business vinculada a una Página de Facebook.
- Permisos `instagram_manage_messages` y `pages_manage_metadata`.
- App Review de Meta, con tiempos que no controlamos.
- Manejo propio de la ventana de 24 horas y las políticas de mensajería.

Eso es un proyecto en sí mismo, con riesgo regulatorio externo. **Recomendación: ManyChat se
queda para el MVP** y el dashboard lo consume. Reemplazarlo se reevalúa cuando el producto ya
esté generando valor, y como decisión independiente.

### Integración: ManyChat → Dashboard

Dirección única, entrante. El dashboard no le escribe a ManyChat en el MVP.

```
Persona comenta un Reel
   ↓
ManyChat dispara la automatización, manda el lead magnet
   ↓
ManyChat External Request → POST /webhooks/manychat
   ↓
webhook_events (bandeja, idempotente por external_id)
   ↓
Worker: resolver identidad → upsert de contacto → aplicar tags
        → journey_events: leadmagnet.requested, tag.applied
        → resolver atribución hacia la content_publication
```

**Campos que hay que hacer que ManyChat mande** (configurables en el External Request):

| Campo | Por qué es indispensable |
|---|---|
| `subscriber_id` | Llave de identidad primaria |
| `first_name`, `last_name` | Nombre del contacto |
| `ig_username` | Vincula al comentario y al canal |
| `email`, `phone` | Se capturan más adelante en el flujo |
| `tags` | Tags aplicados en ManyChat |
| `trigger_keyword` | **Mapea al `keyword` del lead magnet — así se resuelve la atribución** |
| `flow_name` | Qué automatización corrió |
| `timestamp` | Cuándo pasó de verdad |

`trigger_keyword` es el campo crítico. Sin él, la atribución cae a "inferida" y toda la promesa
de "qué contenido genera más leads" se degrada a una suposición.

**Recomendación operativa:** una palabra clave única por lead magnet, y una palabra clave única
por campaña de contenido cuando importe distinguir. Eso convierte la atribución en `exact` en
lugar de `inferred`.

---

## 2 · Metricool — métricas de contenido (§9)

⚠️ **Supuesto de riesgo alto.** El plan depende de que Metricool exponga las métricas por
publicación vía API. Verificar antes de la Fase 5.

**Plan A — sync por API.** Job horario que trae métricas por publicación y las escribe en
`content_metrics_daily` con `source = 'metricool'`. El match se hace por `external_post_id`.

**Plan B — la ruta del MVP, y el default.** El dashboard registra
`Contenido → Fecha → Plataforma → URL → Estado`, y las métricas se cargan a mano o por CSV.
Esto es exactamente lo que propone la Opción B del brief, y es la ruta correcta para el MVP:
demuestra el esquema con datos reales antes de que exista cualquier integración.

**Plan C — si la API de Metricool no sirve.** Ir directo a las APIs de las plataformas:
- Instagram Graph API → `/media/insights` (requiere cuenta Business + App Review).
- YouTube Data API → estadísticas de video (cuota generosa, fácil).
- TikTok Display API → limitada, con aprobación por caso.

El Plan C es más trabajo pero elimina la dependencia de un intermediario. Vale evaluarlo con
seriedad si Metricool no expone lo que hace falta.

**Restricción de diseño que hace que esto no importe demasiado:** como
`content_metrics_daily.source` distingue el origen, cambiar de proveedor no requiere migración
de esquema. Solo cambia quién llena las filas.

---

## 3 · GoHighLevel — a reemplazar, no a integrar (§25)

GHL es el sistema que este producto sustituye. La integración es **migración de una sola vez**,
no una sincronización continua.

```
Exportar de GHL → contactos, oportunidades, etapas del pipeline, notas, tags
   ↓
Mapear al esquema propio (ver 10-migracion-de-datos.md)
   ↓
Importar con contact_identities.kind = 'ghl_contact_id' preservado
   ↓
Correr en paralelo entre 2 y 4 semanas
   ↓
Apagar GHL
```

**Correr en paralelo no es opcional.** Migrar el CRM de un negocio en vivo y apagar el sistema
viejo el mismo día es cómo se pierden leads reales con dinero real detrás. El período en
paralelo es lo que hace reversible el error.

Conservar `ghl_contact_id` permite reconciliar contra el sistema viejo durante ese período.

---

## 4 · Calendario / agendamiento (§3, §15)

**Recomendación: Cal.com.** Open source, self-hostable, buena API de webhooks, y a diferencia
de Calendly no cobra por asiento por cada setter y closer que agregues.

Dos usos distintos:

| Uso | Regla |
|---|---|
| Llamada de onboarding (§3) | Mínimo 2 días de anticipación, para que el equipo prepare la estrategia |
| Llamada de venta (§15, §16) | Sin restricción; ruteo por disponibilidad del closer |

**Flujo de webhook**

```
BOOKING_CREATED    → crear appointment + generar las 4 filas de recordatorio
BOOKING_RESCHEDULED→ actualizar appointment, recalcular los send_at de los recordatorios
BOOKING_CANCELLED  → cancelar appointment, marcar recordatorios como 'skipped'
MEETING_ENDED      → marcar la cita como 'held' (si existe), pedir el registro de llamada
```

**La regla de 2 días** se hace cumplir en dos lugares: configurada en Cal.com (mínimo aviso),
y validada en nuestro lado al procesar el webhook. Un cambio de configuración en Cal.com no
debe poder romper una regla de negocio.

### Recordatorios (§15)

La escalera del brief: inmediato, −5h, −1h, −5min.

```
Al agendar → INSERT 4 filas en appointment_reminders con su send_at calculado
             en el timezone de la CUENTA (no del servidor, no del contacto)
Cada minuto → el worker toma los recordatorios con send_at <= now() y status='pending'
             → envía por Resend (email) / Kapso (WhatsApp) / proveedor SMS
             → marca 'sent' o 'failed' + el error
```

**Por qué filas y no un cálculo en el momento del envío:** un recordatorio como fila se puede
inspeccionar, se puede reintentar, se puede auditar y se puede cancelar. Un recordatorio
calculado al vuelo es invisible hasta que falla.

Al reagendar hay que recalcular los `send_at`. Al cancelar, marcar `skipped`. Ambos son casos
que se olvidan y terminan mandando "tu llamada es en 1 hora" para una llamada cancelada.

---

## 5 · Mensajería saliente

| Canal | Proveedor | Notas |
|---|---|---|
| Email | **Resend** | Ya en uso. Transaccional únicamente. Requiere verificación de dominio (SPF/DKIM/DMARC) |
| WhatsApp | **Kapso** | Cloud API oficial **con soporte de plantillas** |
| SMS | Por definir | Twilio o proveedor regional; evaluar costo en MX/LATAM |

### Por qué Kapso y no el WhatsApp de Hermes

Hermes trae dos adaptadores de WhatsApp y ninguno resuelve este caso:

- `plugins/platforms/whatsapp/` usa Baileys — no oficial, no sirve para uso comercial.
- `gateway/platforms/whatsapp_cloud.py` es la Cloud API oficial de Meta, pero **no manda
  plantillas**.

Los recordatorios de cita casi siempre caen fuera de la ventana de 24 horas de la sesión de
WhatsApp, y fuera de esa ventana **solo se pueden enviar plantillas aprobadas**. Sin soporte de
plantillas, el recordatorio de "5 horas antes" simplemente no se entrega.

Kapso publica la Cloud API oficial con envío de plantillas y multi-número nativo. Es la pieza
correcta.

---

## 6 · Ads (§18) — Fase 5, prioridad baja

Meta Ads y Google Ads alimentan `spend_entries` con `source = 'meta_ads' | 'google_ads'`.

Hasta entonces, el gasto se carga a mano. Un cliente que carga su gasto publicitario una vez
por semana produce un CAC igual de correcto que uno sincronizado por API — solo con menor
frecuencia de actualización. **Esto no bloquea el dashboard financiero.**

---

## 7 · Pagos

Fuera de alcance para el MVP salvo que el cliente use funnel `infoproduct` o `low_ticket`,
donde el checkout es el evento de conversión.

Si hace falta: Stripe → webhook → `journey_events: payment.received` → cerrar el deal como
ganado.

---

## Reglas transversales de integración

1. **Toda integración entrante pasa por `webhook_events`.** Sin excepciones. Ese es el mecanismo
   de reprocesamiento.
2. **Toda integración saliente es idempotente.** Con clave de idempotencia cuando el proveedor
   la soporte.
3. **Las credenciales se cifran en reposo** con pgcrypto; la llave sale del entorno y nunca vive
   en la base.
4. **Fallar visiblemente.** Una integración caída aparece en la UI con su `last_error`. La falla
   silenciosa es peor que no tener la integración, porque el cliente confía en números
   incompletos.
5. **Rate limiting con backoff exponencial** y un circuit breaker por proveedor.
6. **Ninguna integración escribe directo en tablas de negocio.** Escribe en la bandeja; el
   worker aplica las reglas de dominio. Así la validación de dominio no se puede saltar.
