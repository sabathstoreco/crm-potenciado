# 09 · Contrato de Analítica y Métricas

Cada KPI del brief, con su fórmula exacta y su fuente. Este documento es el contrato: si un
número del dashboard no coincide con la fórmula de acá, es un bug.

## Regla fundamental

**Los conteos se materializan. Los ratios se calculan al leer.**

`kpi_daily` guarda conteos y montos por día. Toda tasa, promedio y costo por unidad se calcula
sobre la suma de esos conteos en el rango solicitado.

Por qué: un close rate guardado para el 15 de marzo no se puede promediar con el del 16 para
obtener el close rate de dos días. `(a/b + c/d) / 2 ≠ (a+c)/(b+d)`. Guardar ratios produce
números que están mal de una forma que nadie detecta hasta que un cliente hace la cuenta a mano.

---

## Métricas de contenido (§7)

### Por publicación

| Métrica | Fórmula | Fuente |
|---|---|---|
| Views | Último `views` acumulado | `content_metrics_daily` |
| Likes / Comments / Shares / Saves | Último acumulado | `content_metrics_daily` |
| Seguidores generados | `SUM(followers_gained)` | `content_metrics_daily` |
| Engagement rate | `(likes + comments + shares + saves) / views` | derivado |
| Leads generados | `COUNT(DISTINCT contact_id)` de journey events con `attribution->>'publication_id' = <id>` y tipo `leadmagnet.requested` o `contact.created` | `journey_events` |
| Lead magnets solicitados | `COUNT(*)` de `leadmagnet.requested` atribuidos | `journey_events` |
| CTR a lead magnet | `lead_magnets_solicitados / views` | derivado |
| Llamadas generadas | `COUNT(DISTINCT appointment_id)` de `appointment.booked` atribuidos | `journey_events` |
| Ventas generadas | `COUNT(*)` de `deal.won` atribuidos | `journey_events` |
| Revenue generado | `SUM(value_cents)` de deals ganados atribuidos | `journey_events` + `deals` |
| Tasa view→lead | `leads / views` | derivado |
| Tasa lead→venta | `ventas / leads` | derivado |
| Revenue por 1000 views | `revenue / views * 1000` | derivado |

**"Revenue por 1000 views" no está en el brief y es la métrica más útil de la lista.** Normaliza
el rendimiento entre piezas con alcances muy distintos. Un reel con 2,000 views que produjo dos
ventas superó a uno con 200,000 views que produjo tres, y ninguna otra métrica de esta tabla lo
muestra.

### Por pieza (agregando publicaciones)

Se suman las métricas de todas las publicaciones de la pieza. Ese es el número que responde
"¿qué contenido funciona mejor?" — porque el mismo reel en tres plataformas es un solo
experimento creativo.

### Por ángulo, hook y CTA (§8)

Estas son las preguntas centrales del producto.

```sql
-- ¿Qué ángulo vende más?
SELECT
  a.name                                              AS angle,
  COUNT(DISTINCT cp.id)                               AS pieces,
  SUM(m.views)                                        AS views,
  COUNT(DISTINCT je_lead.contact_id)                  AS leads,
  COUNT(DISTINCT je_won.subject_id)                   AS sales,
  SUM(d.value_cents)                                  AS revenue_cents,
  SUM(d.value_cents)::float / NULLIF(SUM(m.views),0) * 1000 AS revenue_per_1k_views
FROM content_angles a
JOIN content_pieces cp        ON cp.angle_id = a.id
JOIN content_publications pub ON pub.content_piece_id = cp.id
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (publication_id) views
  FROM content_metrics_daily
  WHERE publication_id = pub.id ORDER BY publication_id, metric_date DESC
) m ON true
LEFT JOIN journey_events je_lead ON je_lead.attribution->>'publication_id' = pub.id::text
                                AND je_lead.event_type = 'leadmagnet.requested'
                                AND je_lead.attribution_status IN ('exact','inferred')
LEFT JOIN journey_events je_won  ON je_won.attribution->>'publication_id' = pub.id::text
                                AND je_won.event_type = 'deal.won'
                                AND je_won.attribution_status IN ('exact','inferred')
LEFT JOIN deals d ON d.id = je_won.subject_id
WHERE a.account_id = $1 AND pub.published_at BETWEEN $2 AND $3
GROUP BY a.name
ORDER BY revenue_cents DESC NULLS LAST;
```

Mismo patrón para `hook_type` y `cta_type`.

**Nota sobre el filtro de atribución:** todos estos cálculos excluyen `attribution_status IN
('weak','none','pending')`. Los reportes muestran cuántos eventos quedaron excluidos. Un ángulo
que se ve ganador porque absorbió toda la atribución débil es un artefacto, no un hallazgo.

### Umbral de significancia

Un ángulo con 2 piezas y 1 venta no supera a uno con 40 piezas y 12 ventas. La UI debe:

- Ocultar por defecto los grupos con menos de 5 piezas o menos de 1,000 views.
- Marcar los grupos por debajo del umbral con "muestra insuficiente".
- Nunca ordenar un leaderboard por una tasa calculada sobre un denominador de un dígito.

Sin esto, el cliente cambia su estrategia de contenido por ruido estadístico. Es el modo de
falla más probable de todo el producto: no que los números estén mal, sino que sean correctos
y carezcan de sentido.

---

## Métricas de lead magnet (§10)

Todas calculadas, ninguna guardada.

| Métrica | Fórmula |
|---|---|
| Solicitudes | `COUNT(*)` en `lead_magnet_deliveries` |
| Leads | `COUNT(DISTINCT contact_id)` en `lead_magnet_deliveries` |
| Llamadas | Contactos con `leadmagnet.requested` de este LM que después tienen `appointment.booked` |
| Ventas | Los mismos contactos que después tienen `deal.won` |
| Revenue | `SUM(value_cents)` de esos deals |
| Tasa solicitud→llamada | `llamadas / solicitudes` |
| Tasa llamada→venta | `ventas / llamadas` |
| Revenue por solicitud | `revenue / solicitudes` |

**Nota sobre la atribución:** "llamadas" y "ventas" acá usan atribución de *último toque* dentro
de una ventana de 90 días. Un contacto que pidió tres lead magnets y después compró se atribuye
al último. Es una decisión, no una verdad. Documentada acá para que el número sea interpretable.

Una vista alternativa de *primer toque* es útil y debería existir como toggle en la UI. Ambas
son legítimas; presentar una sin decir cuál es lo que induce a error.

---

## Métricas de marketing (§18)

| Métrica | Fórmula | Notas |
|---|---|---|
| Ad Spend | `SUM(amount_cents) WHERE category='ads'` | `spend_entries` |
| Marketing Spend | `SUM(amount_cents) WHERE category IN ('ads','tools')` | |
| Leads | `SUM(new_contacts)` | `kpi_daily` |
| **CPL** | `ad_spend / leads` | Cost per Lead |
| **CPA** | `ad_spend / appointments_booked` | Cost per Appointment |
| **CAC** | `total_spend / deals_won` | Incluye herramientas y equipo, no solo ads |
| CTR | `clics / impresiones` | Solo si hay integración de ads; si no, no se muestra |

**CPL vs CAC:** CPL usa solo gasto en ads porque mide eficiencia de campañas. CAC usa gasto
total porque mide viabilidad del negocio. Mezclarlos es el error más común en dashboards de
este tipo. Ambos van etiquetados en la UI con qué gasto incluyen.

---

## Métricas de ventas (§18)

| Métrica | Fórmula |
|---|---|
| Calls (agendadas) | `SUM(appointments_booked)` |
| Calls (realizadas) | `SUM(appointments_held)` |
| **Show Rate** | `appointments_held / appointments_booked` |
| No-show Rate | `no_shows / appointments_booked` |
| **Close Rate** | `deals_won / appointments_held` |
| Sales | `SUM(deals_won)` |
| Revenue | `SUM(revenue_cents)` |
| **Average Deal Size** | `revenue / deals_won` |
| Win Rate | `deals_won / (deals_won + deals_lost)` |

**Close Rate se calcula sobre llamadas realizadas, no agendadas.** Un closer no puede cerrar a
alguien que no se presentó. Mezclarlo penaliza al closer por un problema del setter. El brief
dice "Close Rate: 26.2%" sin especificar el denominador; acá queda fijado.

---

## ROI del funnel (§18)

```
INVERSIÓN → LEADS → AGENDAS → LLAMADAS → VENTAS → REVENUE
```

Se renderiza como un funnel con tasas de conversión y caída absoluta en cada paso.

| Métrica | Fórmula |
|---|---|
| ROI | `(revenue - total_spend) / total_spend` |
| ROAS | `revenue / ad_spend` |
| Payback (días) | Días hasta que el revenue acumulado iguala el gasto acumulado de la cohorte |

**Mostrar la caída absoluta, no solo el porcentaje.** "Show rate 62%" es un dato; "perdiste 47
llamadas este mes por no-shows" es una acción. El brief pide diagnóstico, y el diagnóstico vive
en los números absolutos.

---

## Performance del closer (§17)

| Métrica | Fórmula |
|---|---|
| Llamadas | `COUNT(*)` en `call_records` por `closer_user_id` |
| Cierres | `COUNT(*) WHERE outcome='won'` |
| Close Rate | `cierres / llamadas` |
| Duración promedio | `AVG(duration_seconds)` |
| Revenue generado | `SUM(value_cents)` de sus deals ganados |
| Distribución de objeciones | `COUNT(*)` por `objection_type_id` |
| Close rate por objeción | Cierres en llamadas donde apareció la objeción X / total de llamadas con X |

### Detección de debilidades

El ejemplo del brief:

```
⚠ ÁREA A MEJORAR
Objeción "No tengo el dinero"
Aparece en 17 llamadas.
Recomendación: Trabajar manejo de objeción de precio.
```

La lógica de detección tiene que ser más cuidadosa que un conteo bruto. Una objeción frecuente
no es una debilidad si el closer la maneja bien.

```
Una objeción es una debilidad para el closer C si:
  1. Aparece en ≥ 20% de las llamadas de C, Y
  2. El close rate de C en llamadas con esa objeción es
     ≥ 15 puntos porcentuales menor que su close rate general, Y
  3. C tiene ≥ 15 llamadas en el período (tamaño de muestra)
```

La condición 2 es la que importa. Un closer que enfrenta la objeción de precio en el 80% de sus
llamadas y aun así cierra al 30% no tiene un problema con esa objeción — tiene un problema de
calificación aguas arriba, que es un hallazgo distinto y una recomendación distinta.

Cada debilidad detectada se enlaza al `objection_types.sop_id` correspondiente.

---

## Customer journey (§19)

| Métrica | Fórmula |
|---|---|
| Tiempo hasta el lead | `primer leadmagnet.requested − primer content.viewed/commented` |
| Tiempo hasta la agenda | `appointment.booked − primer contacto` |
| Tiempo hasta la compra | `deal.won − primer contacto` |
| Toques hasta la compra | `COUNT(*)` de journey events antes de `deal.won` |
| Lead magnets hasta la compra | `COUNT(*)` de `leadmagnet.requested` antes de `deal.won` |

**Reportar la mediana, no el promedio.** Un contacto que siguió la cuenta hace dos años y compró
ayer destruye el promedio. El brief pregunta "cuánto tarda una persona desde que entra en
contacto con la marca hasta que compra" — la respuesta útil es la mediana, con p25 y p75 al
lado.

---

## El job de rollup

```
Cada noche, 03:00 en el timezone de la cuenta:
  Para cada cuenta activa:
    Recalcular kpi_daily de los últimos 7 días  ← no solo de ayer
    Registrar computed_at
```

**Por qué 7 días y no solo ayer:** los datos llegan tarde. Una llamada del martes se registra el
jueves. Un webhook falla y se reprocesa. Recalcular una ventana móvil hace que los números se
auto-corrijan sin intervención.

El costo es trivial (7 días × N cuentas) y elimina toda una clase de "los números de la semana
pasada están mal".

---

## Contrato de la UI para números

1. **Todo número tiene su rango de fechas visible.** Un "CAC: $4,200" sin período no significa nada.
2. **Todo ratio muestra su denominador al pasar el mouse.** "Close Rate 26%" → "11 de 42 llamadas".
3. **Los tamaños de muestra chicos se marcan visualmente**, nunca se ocultan.
4. **Los datos atribuidos muestran su nivel de confianza** y cuántos eventos quedaron excluidos.
5. **Las comparaciones contra el período anterior son opt-in**, no el default. Un delta contra
   un período anterior ruidoso es ruido presentado como señal.
