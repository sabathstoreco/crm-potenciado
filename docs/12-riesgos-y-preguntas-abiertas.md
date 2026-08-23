# 12 · Riesgos y Preguntas Abiertas

## Cómo se usa este documento

Los puntos **BLOQUEANTES** tienen que estar respondidos antes de que arranque la fase indicada.
Los demás se pueden resolver sobre la marcha, pero cada uno tiene un dueño y una fecha.

Cuando un punto se resuelve: se registra la respuesta acá, se abre un ADR en [adr/](adr/) si
cambia una decisión de arquitectura, y se actualiza el documento correspondiente.

---

## Preguntas bloqueantes

### B1 · ¿Metricool tiene una API utilizable? — BLOQUEA la Fase 5

**Por qué importa:** todo el módulo de métricas de contenido asume que las métricas por
publicación se pueden ingerir. Si Metricool no las expone en el plan del cliente, hay que
decidir entre carga manual permanente o integración directa con las APIs de las plataformas
(que implica App Review de Meta y semanas de trabajo).

**Qué hay que verificar concretamente**
- ¿Existe API pública? ¿En qué plan?
- ¿Expone métricas por publicación o solo agregados por cuenta?
- ¿Devuelve el id o la URL del post, para poder hacer match con `external_post_id`?
- ¿Cuáles son los límites de rate?

**Dueño:** agencia · **Impacto si es que no:** el Plan B ([07](07-integraciones.md)) es viable;
el MVP no se bloquea, pero la Fase 5 se reduce.

---

### B2 · ¿Qué plan de ManyChat tiene el cliente? — BLOQUEA la Fase 3

**Por qué importa:** la funcionalidad External Request (webhooks salientes) es lo que alimenta
la ingesta de leads. Sin ella, la entrada del funnel es invisible para el dashboard y el
producto pierde su propuesta central.

**Qué hay que verificar**
- ¿El plan incluye External Request?
- ¿Se pueden mandar campos personalizados en el payload?
- ¿Se puede incluir el `trigger_keyword`? (crítico para la atribución exacta)

**Dueño:** agencia · **Alternativa si es que no:** polling de la API de ManyChat, más frágil y
con latencia. Aceptable pero peor.

---

### B3 · ¿Dónde vive Postgres? — BLOQUEA la Fase 0

**Opciones**

| Opción | A favor | En contra |
|---|---|---|
| Self-hosted en el VPS actual | Costo cero adicional, control total | Backups y actualizaciones a cargo nuestro; punto único de falla junto con Hermes |
| Neon | Serverless, branching, buen tier gratuito | Latencia si la región no coincide con el VPS |
| Supabase | Postgres administrado + pgvector listo | Trae features que no vamos a usar |
| AWS RDS | Maduro, backups automáticos | El más caro; más configuración |

**Requisito duro:** pgvector tiene que estar disponible.

**Recomendación:** Postgres self-hosted en el VPS para el MVP, con backups automatizados y
prueba de restauración mensual desde el primer día. Migrar a administrado cuando entre el
tercer cliente o cuando la carga operativa se sienta — lo que pase primero. La migración es
un `pg_dump`/`pg_restore`, no una reescritura.

**Dueño:** decisión técnica · **Fecha:** antes de la Fase 0.

---

### B4 · Consentimiento y retención de grabaciones de llamada — BLOQUEA la Fase 4

**Por qué importa:** el sistema va a guardar grabaciones de llamadas de venta. Eso tiene
implicaciones legales que varían por jurisdicción.

**Qué hay que definir**
- ¿Se está pidiendo consentimiento hoy? ¿Cómo se registra?
- ¿Cuánto tiempo se conservan las grabaciones?
- ¿Quién puede escucharlas? (nuestra propuesta está en [06](06-multitenancy-auth-rbac.md))
- ¿Dónde se almacenan y en qué jurisdicción?

**Dueño:** agencia, con asesoría legal · **No es una decisión técnica.**

---

### B5 · ¿Cuál es el primer cliente real y cuándo? — BLOQUEA la planificación

**Por qué importa:** define qué tipo de funnel se implementa primero, qué integraciones son
urgentes y cuánta migración de datos hay que hacer. Construir los cuatro tipos de funnel antes
de saber cuál usa el primer cliente es trabajo especulativo.

**Qué hace falta saber**
- ¿Qué tipo de funnel usa? (consultoría / infoproducto / low ticket / agencia)
- ¿Cuántos contactos hay en su GHL?
- ¿Cuántas cuentas sociales?
- ¿Cuántas personas en su equipo, y con qué roles?
- ¿Fecha objetivo?

**Dueño:** agencia.

---

## Riesgos

### R1 · La resolución de identidad falla en silencio — ALTO

Un lead que comenta en Instagram, recibe un DM, da un email y agenda con teléfono es una persona
con cuatro identificadores. Si la resolución falla, se crean contactos duplicados y **todas** las
métricas quedan infladas: más leads de los reales, close rate más bajo del real, CAC más alto
del real.

Es el modo de falla más peligroso porque **no se ve**. El dashboard muestra números plausibles
que están mal.

**Mitigación**
- Reglas de resolución explícitas y documentadas, no heurísticas dispersas.
- Una cola de "posibles duplicados" que un humano revisa, no un merge automático.
- Un dashboard de calidad de datos: contactos sin identidad verificada, posibles duplicados,
  eventos sin atribuir.
- Aceptar que la resolución nunca va a ser perfecta y **mostrar el margen de error**.

### R2 · La calidad de la atribución se degrada sin que nadie lo note — ALTO

Si las palabras clave de ManyChat no son únicas por lead magnet, la atribución cae de `exact` a
`inferred` y de ahí a `weak`. Nadie se entera hasta que los reportes dejan de tener sentido.

**Mitigación**
- Monitorear el porcentaje de eventos por nivel de confianza de atribución.
- Alertar cuando `exact` baja del 60%.
- Mostrar el nivel de confianza en cada reporte, no esconderlo.

### R3 · El alcance se desborda hacia "reconstruyamos Metricool" — ALTO

El brief lo advierte explícitamente en §28, y aun así es el riesgo más probable. Cada
integración invita a "ya que estamos, ¿por qué no programamos el post desde acá?".

**Mitigación**
- Los no-objetivos de [00](00-vision-de-producto.md) son un contrato.
- Toda funcionalidad propuesta tiene que servir a una de las tres preguntas centrales.
- Los criterios de salida de fase son objetivos.

### R4 · Un solo VPS aloja app, base de datos y Hermes — MEDIO

Punto único de falla. Aceptable para el MVP, no para varios clientes en producción.

**Mitigación**
- Backups y prueba de restauración desde el día uno.
- Separar la base de datos cuando entre el tercer cliente.
- Alertas de uptime activas desde el primer deploy.

### R5 · Datos históricos incompletos arruinan la analítica — MEDIO

Importar contenido de Notion sin hook/contexto/CTA llena la tabla analítica de filas que no
pueden participar del análisis pero sí engordan los denominadores.

**Mitigación:** ver [10](10-migracion-de-datos.md) — importar solo 90 días, o marcar el
histórico con `excluded_from_analytics`.

### R6 · Meta cambia las reglas de la API de Instagram — MEDIO

Fuera de nuestro control. Afecta a ManyChat (que lo absorbe) y a cualquier integración directa
que hagamos.

**Mitigación:** depender de ManyChat como intermediario es en realidad una *mitigación* de este
riesgo, no un problema. Ellos absorben los cambios de plataforma. Es un argumento adicional para
no reemplazarlos por ahora.

### R7 · Alucinaciones del asistente erosionan la confianza — MEDIO

Un cliente que recibe un número inventado deja de confiar en todo el dashboard, no solo en el
asistente.

**Mitigación**
- Hermes nunca calcula; solo consulta valores precalculados ([08](08-hermes-capa-ia.md)).
- Citas obligatorias en toda respuesta con números.
- El asistente sale en la Fase 6, cuando los datos ya están probados.

### R8 · La corrección de zonas horarias se descubre tarde — MEDIO

Un rollup diario que corre en UTC para un cliente en México asigna las conversiones de la tarde
al día equivocado. Se descubre cuando el cliente compara con su propia contabilidad.

**Mitigación:** timezone de la cuenta en el esquema desde el día uno; un test que verifica los
límites de día de un rollup para una cuenta no-UTC.

---

## Decisiones tomadas y su razón

Registro rápido; los ADRs completos van en [adr/](adr/).

| Decisión | Razón |
|---|---|
| Backend Go + frontend Next.js | Elección del usuario; coincide con la experiencia del equipo (patrón J4) |
| ManyChat se queda | Hermes no tiene adaptador de Instagram; el reemplazo es un proyecto aparte con riesgo externo |
| GoHighLevel se reemplaza | Es el objetivo central del producto |
| Metricool queda como fuente, con carga manual como default | Reduce el riesgo del camino crítico |
| Postgres + pgvector, no una base vectorial dedicada | Un corpus de miles de chunks no justifica un segundo sistema |
| Postgres como cola de jobs, no Redis | El volumen no justifica el costo operativo |
| Journey events como log append-only | Es la única forma de responder las preguntas de atribución de §7, §8, §12, §17, §19, §23 |
| Multi-tenant desde el día uno, aunque no sea SaaS | Retrofitear tenancy es una reescritura; hacerlo ahora es casi gratis |
| `kpi_daily` materializada, ratios calculados al leer | Los ratios guardados no se pueden reagregar sin quedar mal |
| RLS además del scoping en la aplicación | Defensa en profundidad; el dato son ingresos de varios negocios |

---

## Puntos abiertos, no bloqueantes

| # | Pregunta | Necesaria para |
|---|---|---|
| O1 | ¿Se necesita marca blanca por cliente (logo, colores)? | Fase 1 UI |
| O2 | ¿Proveedor de SMS para recordatorios en México? | Fase 4 |
| O3 | ¿Hace falta app móvil, o alcanza con web responsive? | Después del MVP |
| O4 | ¿Los clientes necesitan exportar reportes a PDF? | Fase 4 |
| O5 | ¿Un cliente puede tener varias marcas bajo una cuenta? | Afecta el modelo de canales |
| O6 | ¿Facturación y suscripciones dentro del producto? | Fuera de alcance del MVP; confirmar |
| O7 | ¿Quién escribe los SOPs de la biblioteca global? | Fase 2, contenido |
| O8 | ¿Se necesita un portal de cliente para los clientes *del* cliente? | Probablemente nunca; confirmar |
