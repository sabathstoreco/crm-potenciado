# 10 · Migración de Datos desde Notion, Sheets y GoHighLevel

## Principio

**La migración es un producto, no un script.** Un script que se corre una vez y funciona a
medias deja al cliente con datos parciales y sin forma de saber qué falta. El importador se
construye con las mismas garantías que el resto: idempotente, reversible, con reporte.

## Reglas duras

1. **Nada se importa sin un dry run** que muestre exactamente qué se va a crear, actualizar y
   omitir.
2. **Toda importación es idempotente.** Correrla dos veces produce el mismo estado.
3. **Se preservan los ids externos** en `contact_identities`, para poder reconciliar contra el
   sistema viejo.
4. **Nada se borra en el sistema origen** hasta que termine el período en paralelo.
5. **Toda importación produce un reporte**: creados, actualizados, omitidos, fallidos, con los
   motivos.

---

## Fuente 1 · GoHighLevel (CRM)

La migración más crítica: son leads reales con dinero real detrás.

### Qué se trae

| De GHL | A nuestro esquema | Notas |
|---|---|---|
| Contacts | `contacts` + `contact_identities` | Preservar el id de GHL como `kind='ghl_contact_id'` |
| Custom fields | `contacts.notes` o columnas dedicadas | Requiere mapeo manual; revisar caso por caso |
| Tags | `tags` + `contact_tags` | `applied_at` = fecha del import si GHL no la expone |
| Opportunities | `deals` | Mapear las etapas de GHL a `pipeline_stages` |
| Pipelines | `pipelines` + `pipeline_stages` | Recrear la estructura antes de importar deals |
| Notes | `contacts.notes` | Concatenadas con fecha |
| Appointments | `appointments` | Solo las futuras; las pasadas van como journey events |

### Lo que se pierde y hay que aceptar

Declararlo antes evita una discusión desagradable después:

- **El historial de conversaciones** (SMS, email dentro de GHL) no se migra. Se conserva
  exportando de GHL y archivando el export.
- **Las automatizaciones y workflows** no se migran. Se reconstruyen.
- **Las marcas de tiempo de aplicación de tags** casi seguro se pierden: GHL no siempre las
  expone. El historial de tags empieza de cero en el sistema nuevo.
- **Las grabaciones de llamada** se quedan donde están; se enlazan por URL.

### Procedimiento

```
1. Exportar todo de GHL (CSV o API). Archivar el export crudo.
2. Crear pipelines y etapas en el sistema nuevo, a mano, reflejando GHL.
3. Escribir el mapeo de etapas: etapa GHL → nuestra etapa. Revisado por la agencia.
4. Dry run del import → reporte.
5. La agencia revisa el reporte. En particular:
   - Contactos sin email ni teléfono (¿son basura o son reales?)
   - Deals sin monto
   - Deals en etapas que no mapearon
6. Import real.
7. Verificación: conteo de contactos, conteo de deals abiertos, suma de valor del pipeline.
   Los tres tienen que coincidir con GHL exactamente.
8. Período en paralelo de 2 a 4 semanas.
9. Apagar GHL.
```

El paso 7 no es opcional. Tres números que cuadran es la única evidencia real de que la
migración fue completa.

---

## Fuente 2 · Notion (creativos y contenido)

### Qué se trae

| De Notion | A nuestro esquema |
|---|---|
| Base de datos de creativos | `content_pieces` |
| Estado / columna de Kanban | `content_pieces.status` (requiere mapeo) |
| Guiones | `content_pieces.script` |
| Fechas de publicación | `content_publications.published_at` |
| Links a assets | `content_pieces.asset_url` |
| Responsable | `content_pieces.owner_user_id` (requiere mapeo de personas) |

### El problema real

Las bases de Notion son de forma libre. En la práctica van a aparecer:

- Estados que no mapean a nuestro flujo de 7 pasos.
- Contenido publicado sin URL registrada.
- Hook, contexto y CTA sin capturar — **casi seguro, porque Notion no los pedía**.
- Una pieza publicada en tres plataformas registrada como una sola fila sin distinción.

**Decisión recomendada:** importar solo el contenido de los últimos 90 días, y solo lo que esté
publicado o en producción activa. El histórico más viejo se archiva como export y se consulta
ahí si hace falta.

Importar dos años de contenido sin datos de hook/CTA llena la tabla de filas que no pueden
participar del análisis de §8 y que arruinan cualquier agregado por ángulo. **Datos incompletos
en una tabla analítica son peores que datos ausentes**, porque los agregados los incluyen en el
denominador.

Si el cliente insiste en el histórico completo, se importa con un flag
`excluded_from_analytics = true` y se filtra en todas las consultas.

---

## Fuente 3 · Google Sheets (datos de clientes, correos de onboarding)

Es la migración más simple y la que más limpieza necesita.

| De Sheets | A nuestro esquema |
|---|---|
| Datos del cliente | `accounts` + `business_profiles` |
| Respuestas de onboarding | `onboarding_submissions.payload` |
| Correos | `users.email` + invitaciones |
| Datos de facturación | Fuera de alcance en el MVP |

### Limpieza obligatoria antes del import

Las hojas de cálculo acumulan basura estructural. Antes de importar hay que resolver:

- Emails duplicados con distinta capitalización.
- Teléfonos en cinco formatos distintos → normalizar a E.164.
- Fechas como texto en formatos mezclados.
- Filas de encabezado en la mitad de la hoja.
- Celdas combinadas.
- "N/A", "-", "pendiente", "" como distintas formas de decir null.

**Esto es trabajo manual y hay que presupuestarlo.** Un importador que intente adivinar
producirá datos incorrectos con apariencia de correctos. Es preferible fallar la fila y pedir
corrección humana.

---

## Herramienta de importación

Un comando del binario del backend, no un script suelto:

```bash
./server -mode=import \
  --source=ghl \
  --account=<slug> \
  --file=export.csv \
  --mapping=mapping.yaml \
  --dry-run
```

- `--dry-run` es el default. Importar de verdad requiere `--commit` explícito.
- `--mapping` apunta a un YAML de mapeo de campos, versionado en el repo. El mapeo es
  documentación de qué se decidió.
- Salida: reporte legible + un CSV de las filas fallidas para corregir y reintentar.
- Toda importación escribe en `audit_log` con el conteo de filas y el hash del archivo fuente.

## Reversión

Cada corrida de importación recibe un `import_batch_id` que se guarda en cada fila creada. Una
importación se puede revertir por completo borrando por ese batch id, siempre y cuando no haya
habido escrituras posteriores del usuario sobre esas filas.

Después del período en paralelo, la reversión deja de estar disponible y se elimina el
`import_batch_id`. Antes de eso, es la red de seguridad que hace que una migración equivocada
cueste una hora en vez de una semana.
