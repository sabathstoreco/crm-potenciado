# 06 · Multi-tenancy, Auth y RBAC

## Modelo de tenancy

**Base compartida, esquema compartido, `account_id` en cada fila.**

Alternativas descartadas:

| Modelo | Por qué no |
|---|---|
| Una base por tenant | Migraciones sobre N bases; el reporteo transversal de la agencia se vuelve un problema de ETL; la agencia necesita vistas entre cuentas desde el día uno |
| Un esquema por tenant | Mismo dolor de migración; Postgres se degrada con cientos de esquemas; el pooling de conexiones se complica |
| Sin aislamiento, filtrar en código | Un `WHERE` olvidado filtra los ingresos de un cliente a otro cliente. Inaceptable. |

Tres capas de enforcement:

```
1. Ruta           /api/v1/accounts/{accountSlug}/...     explícito en la URL
2. Middleware     verifica que el usuario del JWT tenga membresía en esa cuenta
3. RLS Postgres   SET LOCAL app.current_account_id — la DB rechaza filas de otro tenant
```

Para que haya una fuga tienen que fallar las tres al mismo tiempo.

### La trampa del pooling

`pgxpool` reutiliza conexiones entre requests. Un `SET app.current_account_id` a nivel sesión
persiste en la conexión y **va** a filtrarse al request siguiente. Dos reglas, ambas testeadas:

- Siempre `SET LOCAL`, dentro de una transacción, nunca `SET` pelado.
- Todo handler con scope de tenant corre dentro de una transacción abierta por el middleware
  `tx`. Un handler que toca datos de tenant fuera de una transacción es un bug que debería
  detectar el linter.

**Test a escribir en la Fase 1:** disparar N requests concurrentes para la cuenta A y la cuenta
B contra el mismo pool chico; verificar que ninguna respuesta contenga datos de la otra cuenta.

---

## Tipos de actor

| Actor | Alcance | Cómo se autentica |
|---|---|---|
| **Rol de plataforma** (`admin`, `dev`) | Todas las cuentas | `users.platform_role` |
| **Miembro de cuenta** | Una o más cuentas, con un rol en cada una | `account_memberships` |
| **Servicio** (Hermes, workers) | Token de servicio con alcance limitado | Token de máquina, nunca un JWT de usuario |

Un actor de plataforma entra a una cuenta por las mismas rutas; no se le da una UI distinta.
Eso mantiene un único camino de código de autorización en lugar de dos.

---

## Roles de plataforma

Dos roles por encima de los tenants: **`admin`** y **`dev`**. Un usuario puede tener uno, los
dos, o ninguno (`platform_role = 'none'`, que es el default de todo usuario cliente).

```
users.platform_role  ∈  { none, admin, dev, admin_dev }
```

### Por qué dos y no uno

Un booleano `is_platform_admin` mezcla dos trabajos distintos que necesitan permisos
distintos. Separarlos es mínimo privilegio aplicado:

| | `admin` — operación de negocio | `dev` — operación técnica |
|---|---|---|
| Quién | Yamil y el equipo de la agencia | Quien mantiene el sistema |
| Crear / editar / suspender tenants | ✅ | ❌ |
| Invitar y remover miembros de cualquier cuenta | ✅ | ❌ |
| Configurar el branding de un tenant | ✅ | ❌ |
| Editar la estrategia de cualquier cuenta | ✅ | ❌ |
| Facturación y planes | ✅ | ❌ |
| Biblioteca global de SOPs | ✅ | ❌ |
| Ver dashboards de todas las cuentas | ✅ | ✅ lectura |
| Leer payloads crudos de webhook | ❌ | ✅ |
| Reprocesar la bandeja de webhooks | ❌ | ✅ |
| Disparar sincronizaciones manualmente | ❌ | ✅ |
| Ver logs y trazas del sistema | ❌ | ✅ |
| Feature flags | ❌ | ✅ |
| Correr migraciones | ❌ | ✅ |
| Impersonar a un usuario | ✅ auditado | ✅ auditado |
| Ver el log de auditoría de plataforma | ✅ | ✅ |
| Exportar datos de un tenant | ✅ | ❌ |

**El admin no lee payloads crudos.** Contienen PII sin filtrar de los leads del cliente, y
para operar comercialmente no hacen falta. **El dev no toca facturación ni estrategia**: son
decisiones de negocio.

Quien necesite ambas cosas lleva `admin_dev` explícitamente, y esa combinación es la que más
se audita.

### Gestión de tenants (`admin`)

| Acción | Efecto | Reversible |
|---|---|---|
| Crear cuenta | Provisiona tenant, pipeline por tipo de funnel, perfil de Hermes, token de servicio | — |
| Editar cuenta | Nombre, slug, timezone, moneda, tipo de funnel, branding | ✅ |
| Suspender | La cuenta queda en solo lectura. Los datos se conservan, los jobs se pausan | ✅ |
| Archivar | Borrado lógico. Invisible para todos menos plataforma | ✅ 90 días |
| Eliminar | Borrado físico. **Operación offline, con backup previo verificado y doble confirmación** | ❌ |

Cambiar el `slug` de una cuenta rompe todas las URLs guardadas de sus usuarios. Se permite,
pero deja un redirect permanente y avisa antes.

### Impersonación

Es la funcionalidad más peligrosa del sistema y necesita reglas explícitas.

```
1. El actor pide impersonar y DEBE escribir un motivo
2. Se emite un token de sesión de impersonación, expira en 30 minutos
3. La UI muestra una franja fija arriba:
   ⚠ Estás viendo como <usuario> en <cuenta> · Salir
4. Toda escritura queda registrada con actor real Y usuario impersonado
5. Al owner de la cuenta se le notifica por email dentro de las 24 h
```

- La impersonación es **de solo lectura por defecto**. Escribir requiere activarlo
  explícitamente dentro de la sesión, y eso se registra aparte.
- Nunca se puede impersonar a otro actor de plataforma.
- Una sesión de impersonación no puede iniciar otra.

La notificación al owner no es cortesía: es lo que hace que el acceso sea auditable *por el
cliente*, no solo por nosotros. Un sistema donde el proveedor puede entrar a los datos sin
que el dueño se entere es un problema de confianza, no de permisos.

---

## Roles de cuenta

Siete roles dentro de cada tenant, independientes de los roles de plataforma de arriba.
El brief listaba cinco; se agregan `owner` y `viewer` porque "quién puede borrar
la cuenta" y "stakeholder de solo lectura" son casos reales que los cinco no cubrían.

| Rol | Quién | Resumen |
|---|---|---|
| `owner` | El cliente que compró | Todo dentro de su cuenta, incluyendo facturación y gestión de miembros |
| `manager` | Líder de operaciones del cliente | Todo salvo borrar la cuenta y cambiar al owner |
| `editor` | Editor de video | Solo contenido y calendario |
| `community_manager` | Encargado de redes | Contenido, calendario y contactos entrantes |
| `setter` | Agendador | Contactos del CRM, tags, agendamiento |
| `closer` | Cerrador de ventas | Sus propias llamadas y deals |
| `viewer` | Inversionista, socio | Dashboards de solo lectura, sin PII |

## Matriz de permisos de cuenta

`—` sin acceso · `R` leer · `W` crear/actualizar · `D` borrar · `prop` solo registros propios

| Recurso | owner | manager | editor | community_manager | setter | closer | viewer |
|---|---|---|---|---|---|---|---|
| Configuración de cuenta | RWD | R | — | — | — | — | — |
| Miembros y roles | RWD | RW | — | — | — | — | — |
| Perfil del negocio | RW | RW | R | R | R | R | R |
| Estrategia | R | R | R | R | R | R | R |
| Piezas de contenido | RWD | RWD | RW | RW | R | R | R |
| Guiones | RWD | RWD | RW | R | — | — | — |
| Calendario | RWD | RWD | RW | RW | R | R | R |
| Métricas de contenido | RW | RW | R | RW | R | R | R |
| Contactos (PII completa) | RWD | RWD | — | R | RW | R prop | — |
| Contactos (anonimizados) | — | — | — | — | — | — | R |
| Tags | RWD | RWD | — | RW | RW | R | — |
| Pipelines y etapas | RWD | RWD | — | — | R | R | R |
| Deals | RWD | RWD | — | — | RW | RW prop | R |
| Citas | RWD | RWD | — | — | RW | RW prop | R |
| Registros de llamada | RWD | RWD | — | — | R | RW prop | — |
| Grabaciones de llamada | R | R | — | — | — | R prop | — |
| Objeciones | RW | RW | — | — | — | RW prop | — |
| Performance de closers (todos) | R | R | — | — | — | — | R |
| Performance de closer (propia) | R | R | — | — | — | R | — |
| Lead magnets | RWD | RWD | R | RW | R | R | R |
| Dashboard financiero | R | R | — | — | — | — | R |
| Registros de gasto | RW | RW | — | — | — | — | — |
| Tareas | RWD | RWD | RW prop | RW prop | RW prop | RW prop | R |
| Equipo | RW | RW | R | R | R | R | R |
| SOPs | RW | RW | R | R | R | R | R |
| Asistente de IA | RW | RW | RW | RW | RW | RW | — |
| Integraciones | RWD | RW | — | — | — | — | — |
| Log de auditoría | R | R | — | — | — | — | — |

### Notas sobre celdas específicas

- **El closer solo ve sus propias llamadas.** Que los closers comparen sus números entre sí sin
  que nadie lo decida es una decisión de management, no un default. `manager` y `owner` ven a
  todos.
- **El editor no puede ver contactos.** Un editor no tiene razón de negocio para ver PII de
  leads. Mínimo privilegio; además reduce la superficie de GDPR/LFPDPPP.
- **El viewer no recibe PII.** El rol viewer existe para inversionistas y socios; nombres,
  emails y teléfonos se eliminan en la capa de DTO, no solo se ocultan en la UI.
- **La estrategia es de solo lectura para todos dentro de la cuenta.** La escribe la agencia. Un
  cliente que quiera un cambio lo pide a la agencia — ese es el servicio que se vende.
- **Las grabaciones de llamada son el activo más sensible.** Restringidas a owner, manager y el
  closer que corrió la llamada.

### Implementación

Los permisos se declaran por ruta, no se chequean ad hoc dentro de los handlers:

```go
r.GET("/accounts/:slug/contacts",
    rbac.Require(perm.ContactsRead),
    h.ListContacts)
```

La matriz de arriba vive como un único mapa de Go, y hay un test que falla si existe una ruta
sin permiso declarado. Los chequeos faltantes los encuentra CI, no un incidente.

---

## Autenticación

- **Access token:** JWT, 15 minutos, `HS256` con secreto rotativo. Claims: `sub`, `email`,
  `platform_role`, `memberships` (account id → rol), `exp`, `jti`, y `act` (actor real)
  cuando la sesión es de impersonación.
- **Refresh token:** valor opaco aleatorio de 256 bits, hasheado con SHA-256 antes de
  guardarse, expira a 30 días, **rota en cada uso**.
- **Detección de reuso:** presentar un refresh token ya rotado revoca toda la cadena y obliga a
  volver a iniciar sesión. Eso es lo que convierte un token robado en un incidente detectado en
  vez de acceso persistente silencioso.
- **Transporte:** refresh token en cookie `HttpOnly`, `Secure`, `SameSite=Strict`. El access
  token vive en memoria en el frontend — **nunca** en `localStorage`.
- **Contraseña:** bcrypt costo 12. Mínimo 12 caracteres, verificada contra una lista de
  contraseñas comprometidas. Sin reglas de composición (producen `Password1!` y nada más).
- **Invitaciones:** token firmado de un solo uso, expira en 7 días, enviado por Resend.
- **MFA:** TOTP. **Obligatorio sin excepción para `platform_role` distinto de `none`** —
  esas cuentas pueden leer la PII de *todos* los tenants. Para `owner` y `manager` de cuenta
  es obligatorio antes de que entre el primer cliente real; opcional para el resto en Fase 1.
  Un actor de plataforma sin MFA no puede impersonar.

## Autenticación de servicios (Hermes y workers)

Hermes no debe tener un JWT de usuario.

- Una tabla `service_tokens` con el token hasheado, una lista de alcances permitidos y un
  `account_id`.
- Hermes recibe un token **por cuenta, mayormente de lectura**, con una lista explícita de
  alcances.
- Los tokens de servicio se rechazan en cualquier endpoint de escritura fuera de su alcance.
- Cada request con token de servicio se loggea con su alcance y la cuenta resuelta.

Ver [08](08-hermes-capa-ia.md).

## Auditoría de sesión y de acceso a datos

Cada lectura de una grabación de llamada, cada exportación de contactos y cada acción
transversal de admin escribe en `audit_log`. Eso es lo que hace respondible la pregunta "¿alguien
exportó nuestra lista de contactos?".
