# Yamil OS — UI/UX Responsive

> Complemento de [DESIGN.md](DESIGN.md). Ese documento define **cómo se ve**; este define
> **cómo se comporta y cómo se reorganiza** según el tamaño de pantalla.

---

## 1 · Qué significa mobile-first acá

Mobile-first es una **metodología**, no una promesa de que todo funcione igual en un teléfono.

```
Se diseña la restricción primero        →  después se enriquece hacia arriba
375px · una columna · pulgar · 4G malo     1440px · varias columnas · mouse · fibra
```

La razón no es estética: **lo que sobrevive a 375px es lo esencial**. Diseñar primero el
escritorio y después "achicar" produce pantallas donde todo cabe y nada importa. Diseñar
primero el teléfono obliga a decidir qué es lo primero, y esa decisión mejora también la
versión grande.

Lo que mobile-first **no** significa: que un tablero de pipeline con 5,000 deals o un funnel
de ROI de seis pasos tengan que caber en un teléfono. Algunos análisis necesitan pantalla.
Ver §9.

---

## 2 · Quién trabaja en qué dispositivo

Esta matriz define las prioridades de todo el resto del documento. No es una suposición: sale
de los perfiles de [00 · Visión de producto](docs/00-vision-de-producto.md#usuarios-principales).

| Rol | Dónde está de verdad | Dispositivo primario | Su tarea crítica |
|---|---|---|---|
| **Closer** | Entre llamadas, de pie, una mano | 📱 **Teléfono** | Registrar el resultado de la llamada recién terminada |
| **Setter** | Trabajando leads, en movimiento | 📱 **Teléfono** | Contactar y mover el lead de etapa |
| **Editor** | Grabando o editando | 📱 **Teléfono** | Leer el guion, marcar el estado |
| **Dueño del cliente** | Café de la mañana / escritorio | 📱 vistazo · 🖥️ análisis | Ver si el mes va bien |
| **Admin de agencia** | Escritorio, varias cuentas | 🖥️ **Escritorio** | Escribir estrategia, operar cuentas |
| **Dev de plataforma** | Escritorio, terminal al lado | 🖥️ **Escritorio** | Logs, webhooks, integraciones |

### La conclusión que ordena el producto

> **El trabajo operativo pasa en el teléfono. El análisis y la autoría pasan en el escritorio.**

Tres de los seis roles son móvil-primario, y son justamente los que **usan la herramienta
todos los días**. El admin entra a configurar una vez por cliente; el closer entra ocho veces
por día.

Eso invierte la intuición habitual de "un CRM es una app de escritorio". Los módulos que más
cuidado móvil necesitan son **Llamadas, CRM y Contenido**, en ese orden. El dashboard
financiero puede ser un vistazo en el teléfono y el análisis serio en el escritorio.

---

## 3 · Breakpoints

Cuatro. Más son inmanejables y no aportan.

| Nombre | Ancho | Dispositivo real | Columnas |
|---|---|---|---|
| *(base)* | 375–767 | Teléfono | 1 |
| `md` | 768–1023 | Tablet, teléfono horizontal | 2 |
| `lg` | 1024–1439 | Laptop | 3 + barra lateral fija |
| `xl` | ≥ 1440 | Monitor | 4 + contenido máx. 1440 centrado |

**375px es el piso de diseño**, no 320. Un iPhone SE de 2016 no es el usuario de este
producto, y diseñar para 320 penaliza al 99% restante con densidad innecesaria.

Regla de escritura: **nunca `max-width` en media queries**. Los estilos base son los del
teléfono y cada breakpoint agrega, no resta.

```css
/* ✅ correcto: móvil es la base */
.grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }

/* ❌ incorrecto: escritorio primero, móvil como parche */
.grid { grid-template-columns: repeat(4, 1fr); }
@media (max-width: 767px) { .grid { grid-template-columns: 1fr; } }
```

---

## 4 · Navegación

### Teléfono — barra inferior

Cinco destinos como máximo. Es un límite duro: con seis, los targets bajan de 44px en un
iPhone SE y empiezan los toques fallidos.

```
┌─────────────────────────────────┐
│  ☰  Acme Consulting        🔔 ⚙ │  ← barra superior, 52px
├─────────────────────────────────┤
│                                 │
│         contenido               │
│                                 │
├─────────────────────────────────┤
│  ⌂      ✓      👥     📞    ⋯   │  ← barra inferior, 56px + safe area
│ Inicio Tareas Leads Llamadas Más│
└─────────────────────────────────┘
```

- **Los cinco destinos cambian según el rol.** Un closer ve `Inicio · Llamadas · Leads ·
  Tareas · Más`. Un editor ve `Inicio · Contenido · Calendario · Tareas · Más`. Poner los
  trece módulos para todos es lo mismo que no priorizar nada.
- **«Más»** abre una hoja con el resto de los módulos que el rol tiene permitidos.
- La barra inferior lleva `padding-bottom: env(safe-area-inset-bottom)` — sin eso, en iPhones
  con indicador de inicio los botones quedan tapados.
- La barra superior **no** es sticky: en un teléfono cada píxel vertical cuenta. La inferior sí.

### Escritorio — barra lateral

- `lg`: barra lateral fija de 240px, todos los módulos visibles.
- Colapsable a 64px (solo íconos con tooltip). El estado se recuerda por usuario.
- `md`: barra lateral oculta por defecto, se abre como panel superpuesto.

### Cambio de cuenta

El selector de cuenta es del admin y del owner con varias cuentas.

- **Teléfono:** en la barra superior, abre una hoja a pantalla completa con búsqueda.
- **Escritorio:** arriba de la barra lateral, dropdown con búsqueda.

Siempre visible el logo y el color del tenant ([DESIGN.md §13](DESIGN.md#13--branding-de-tenant)).
En un teléfono, donde se ve menos contexto a la vez, esa señal importa **más**, no menos.

---

## 5 · Los cuatro patrones de transformación

Cuatro componentes concentran toda la dificultad responsive del producto. El resto son cards
y texto, que se apilan solos.

### 5.1 · Tabla → tarjetas

Una tabla de 8 columnas a 375px es scroll horizontal, y el scroll horizontal en una lista es
un fracaso: el usuario pierde la columna de referencia.

```
ESCRITORIO ─ tabla
┌────────────┬─────────┬──────────┬────────┬──────────┬─────────┐
│ Contacto   │ Etapa   │ Origen   │ Valor  │ Closer   │ Últ.act │
├────────────┼─────────┼──────────┼────────┼──────────┼─────────┤
│ Juan Pérez │ Agendó  │ Reel #12 │ 12,000 │ Carlos   │ hace 2h │
└────────────┴─────────┴──────────┴────────┴──────────┴─────────┘

TELÉFONO ─ tarjeta
┌─────────────────────────────────┐
│ Juan Pérez              12,000  │  ← identificador + el número que importa
│ Agendó · Reel #12               │  ← estado + contexto
│ Carlos · hace 2h            →   │  ← metadato + entrada al detalle
└─────────────────────────────────┘
```

**La regla de los tres campos.** En la tarjeta caben tres líneas útiles, no ocho. Se eligen:

1. **El identificador** — cómo el usuario reconoce la fila (el nombre).
2. **El campo que está buscando** — depende de la vista: en CRM es la etapa, en Ventas el
   monto, en Contenido el estado.
3. **El desempate** — lo que decide entre dos filas parecidas (última actividad, responsable).

Todo lo demás vive en el detalle, a un toque.

Elegir mal el campo 2 es el error frecuente: si el usuario escanea buscando etapa y la tarjeta
muestra la fecha de creación, tiene que abrir cada tarjeta. La tabla se volvió más lenta que
antes.

### 5.2 · Tablero de pipeline

El caso más difícil. Un Kanban de 10 columnas no entra en 375px, y el scroll horizontal con
drag and drop en táctil es directamente inusable — arrastrar una tarjeta a una columna que no
se ve no funciona.

```
TELÉFONO
┌─────────────────────────────────┐
│ ◄  Agendó · 14        Etapas ▾  │  ← selector de etapa con conteo
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Juan Pérez          12,000  │ │
│ │ Reel #12 · hace 2h          │ │  ← swipe → avanza de etapa
│ └─────────────────────────────┘ │  ← swipe ← posterga
│ ┌─────────────────────────────┐ │
│ │ Ana Ruiz             8,500  │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│      ● ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← posición en el pipeline
└─────────────────────────────────┘
```

- **Una etapa a la vez**, elegida con un selector que muestra el conteo de cada una.
- **Deslizar la tarjeta** avanza a la etapa siguiente o la posterga. Con confirmación
  deshacible (toast con «Deshacer», 5 segundos), no con un diálogo.
- **Los puntos de abajo** dan la posición dentro del pipeline: sin ellos el usuario pierde la
  noción de en qué parte del funnel está mirando.
- **Toda acción por gesto necesita su equivalente por botón.** El swipe es un atajo, nunca la
  única forma: es invisible para lectores de pantalla y para quien no lo descubre.

En `md` y arriba vuelve el Kanban horizontal con drag and drop.

### 5.3 · Calendario

Una grilla de mes a 375px da celdas de ~50px. Con tres plataformas por día, ilegible.

| Breakpoint | Vista |
|---|---|
| Teléfono | **Agenda**: lista vertical agrupada por día, con tira de semana arriba para navegar |
| `md` | Semana |
| `lg`+ | Mes completo, con la semana como alternativa |

```
TELÉFONO ─ agenda
┌─────────────────────────────────┐
│  L   M   M   J   V   S   D      │  ← tira de semana, el día activo marcado
│ 22  [23] 24  25  26  27  28     │
├─────────────────────────────────┤
│ MARTES 23                       │
│ ┌─────────────────────────────┐ │
│ │ Reel #01                    │ │
│ │ ▣ Instagram ▣ TikTok ▣ YT   │ │  ← una pieza, tres publicaciones
│ │ Programado · Carlos         │ │
│ └─────────────────────────────┘ │
│ MIÉRCOLES 24                    │
│ ...                             │
└─────────────────────────────────┘
```

La agrupación por pieza (y no una fila por publicación) mantiene el modelo de datos visible:
un reel en tres plataformas es **una** idea, no tres.

### 5.4 · Gráficos

| | Teléfono | Escritorio |
|---|---|---|
| Series máximas | **3** | 6 |
| Tooltip | Al **tocar**, y persiste | Al pasar el mouse |
| Etiquetas de eje | Una de cada dos o tres | Todas |
| Leyenda | Debajo, en dos columnas | Al costado o etiqueta directa |
| Alto | 180–220px | 280–360px |

**No existe el hover en táctil.** Un gráfico cuyo único acceso al valor exacto es el hover no
tiene acceso al valor exacto en un teléfono. El tooltip se abre al tocar y se queda hasta el
próximo toque fuera.

**Alternativa en tabla, siempre.** Un botón «Ver datos» que abre los mismos números como
tabla. Sirve para móvil, para lectores de pantalla y para quien quiere copiar una cifra —
tres problemas con una sola solución.

Los KPI se apilan de a uno en el teléfono, de a dos en `md`, de a cuatro en `lg`.

---

## 6 · Formularios

Donde más se sufre en móvil y donde más barato es arreglarlo.

### Teclado correcto — no es opcional

```html
<input type="email"  inputmode="email"    autocomplete="email">
<input type="tel"    inputmode="tel"      autocomplete="tel">
<input type="text"   inputmode="numeric"  pattern="[0-9]*">   <!-- montos -->
<input type="text"   inputmode="decimal">                     <!-- porcentajes -->
<input type="url"    inputmode="url">
```

Un setter cargando un teléfono con el teclado alfabético hace el doble de toques y comete el
doble de errores. Son cinco atributos y cambian la experiencia por completo.

### ⚠️ El zoom de iOS

> [!CAUTION]
> Safari en iOS **hace zoom automático** al enfocar un input con `font-size` menor a 16px.
> El texto base de [DESIGN.md §4.3](DESIGN.md#43--escala-tipográfica) es 14px, así que los
> inputs **deben subir a 16px en móvil**. Es una excepción explícita al sistema tipográfico.

```css
input, select, textarea { font-size: 16px; }
@media (min-width: 1024px) { input, select, textarea { font-size: 14px; } }
```

Sin esto, cada vez que el usuario toca un campo la pantalla salta y hay que volver a
encuadrar. Es de los defectos móviles que más se notan y más rápido se corrigen.

### Reglas

- **Una columna siempre**, en todos los breakpoints. Los formularios de dos columnas rompen el
  orden de tabulación y no aportan nada.
- **Etiqueta visible arriba** del campo, nunca placeholder como etiqueta.
- **Botón de envío pegado abajo** (`position: sticky`) en formularios largos, como el de
  onboarding. Que el usuario tenga que scrollear hasta el fondo para guardar es fricción pura.
- **Selects con más de 7 opciones → hoja con buscador**, no un `<select>` nativo. Elegir un
  contacto entre 400 en un select nativo es imposible.
- **Validación al salir del campo**, no mientras se escribe. Marcar en rojo un email a medio
  tipear es hostil.
- **El error va debajo del campo**, con ícono y texto. Nunca solo un borde rojo — ver
  [DESIGN.md §2.6](DESIGN.md#26--colores-funcionales).
- **Autoguardado en formularios largos.** Perder el formulario de onboarding por una llamada
  entrante es motivo de abandono.

---

## 7 · Zona del pulgar

En un teléfono de 6 pulgadas sostenido con una mano, la parte superior de la pantalla **no se
alcanza** sin reacomodar el agarre.

```
┌─────────────────────────────────┐
│░░░░░░░░ DIFÍCIL ░░░░░░░░░░░░░░░░│  título, filtros, ajustes
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────┤
│▒▒▒▒▒▒▒▒ ALCANZABLE ▒▒▒▒▒▒▒▒▒▒▒▒▒│  contenido, listas
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
├─────────────────────────────────┤
│█████████ CÓMODO ████████████████│  acción primaria, navegación
└─────────────────────────────────┘
```

| Zona | Qué va ahí |
|---|---|
| **Cómodo** (abajo) | Acción primaria, barra de navegación, botón de guardar |
| **Alcanzable** (medio) | Contenido, listas, tarjetas |
| **Difícil** (arriba) | Título, filtros, ajustes, cerrar |

**Lo destructivo no va en la zona cómoda.** Suena contraintuitivo, pero un «Eliminar» al
alcance del pulgar se toca por accidente. Va arriba, o dentro de un menú, o con confirmación.

Corolario: en una hoja modal, el botón de confirmar va abajo y ancho completo; el de cancelar
arriba a la izquierda o como toque fuera de la hoja.

---

## 8 · Los tres flujos móviles críticos

Si estos tres funcionan bien en un teléfono, el producto funciona. Merecen diseño dedicado,
no ser una consecuencia del layout responsive.

### 8.1 · El closer registra una llamada

**Contexto real:** acaba de colgar, está de pie, tiene una mano libre y 60 segundos antes de
la próxima. Si el formulario es largo, no lo llena — y sin ese dato todo el módulo de
performance de closers ([09 · Analítica](docs/09-analitica-y-metricas.md)) queda vacío.

```
┌─────────────────────────────────┐
│ ←   Juan Pérez · 32 min         │
├─────────────────────────────────┤
│ RESULTADO                       │
│ ┌────────┐┌────────┐            │
│ │ Ganada ││Perdida │            │  ← 4 botones grandes, 56px de alto
│ ├────────┤├────────┤            │
│ │Segui-  ││ No se  │            │
│ │miento  ││presentó│            │
│ └────────┘└────────┘            │
│                                 │
│ OBJECIONES  (toca las que salieron)
│ ⬤ Dinero  ○ Timing  ○ Confianza │  ← chips, no un select múltiple
│ ○ Decisión  ○ Otra              │
│                                 │
│ MONTO                           │
│ [ $ 12,000            ]         │  ← teclado numérico
│                                 │
│ PRÓXIMO PASO                    │
│ ○ Propuesta  ○ Reagendar  ○ ... │
├─────────────────────────────────┤
│ ████████ Guardar ███████████    │  ← pegado abajo, ancho completo
└─────────────────────────────────┘
```

- **Chips en vez de select múltiple** para objeciones. Un toque por objeción, todas visibles
  al mismo tiempo. Un select múltiple nativo en móvil son tres toques y un scroll.
- **Nada obligatorio salvo el resultado.** Pedir el motivo de pérdida antes de dejar guardar
  produce datos inventados, que es peor que datos faltantes.
- **Cabe sin scroll** en una pantalla de 812px de alto. Ese es el objetivo de diseño.
- **Se puede completar después**: la llamada queda marcada como «sin registrar» en la lista de
  hoy hasta que se llene.

### 8.2 · El setter trabaja un lead

```
┌─────────────────────────────────┐
│ Juan Pérez                      │
│ Agendó · hace 2h                │
│ ───────────────────────────     │
│ Comentó Reel #12                │
│ Pidió Plantilla de contenido    │  ← el journey, resumido
│ Agendó para mañana 16:00        │
│ ───────────────────────────     │
│ ┌─────┐┌─────┐┌─────┐┌─────┐    │
│ │ 📞  ││ 💬  ││ ✉   ││ ⋯   │    │  ← tel: · wa.me · mailto:
│ └─────┘└─────┘└─────┘└─────┘    │
└─────────────────────────────────┘
```

- **Enlaces nativos:** `tel:`, `https://wa.me/<e164>`, `mailto:`. Abren la app real del
  teléfono. Reimplementar la llamada dentro de la web app es trabajo desperdiciado y peor
  experiencia.
- **El journey resumido arriba.** El setter necesita saber de dónde viene la persona antes de
  escribirle. Es la ventaja concreta de este producto sobre GoHighLevel, y en móvil hay que
  mostrarla en tres líneas.
- **Registrar el contacto es un toque**, no un formulario: al volver de la llamada, la app
  pregunta «¿contactaste a Juan?» con Sí / No responde / Reagendar.

### 8.3 · El editor lee un guion

**Contexto real:** está grabando, el teléfono en un trípode a un brazo de distancia, o
leyendo antes de la toma.

- **Texto grande:** `body-lg` 16px como piso, con control para subir a 20 y 24px. Se recuerda
  la preferencia.
- **Alto contraste**, sin superficies intermedias: `fg` sobre `bg`.
- **Mantener la pantalla encendida** mientras el guion está abierto (Screen Wake Lock API).
  Que la pantalla se apague a mitad de la toma arruina la toma.
- **Hook, contexto y CTA visualmente separados**, porque son tres bloques distintos de
  interpretación.
- **Avanzar de estado desde la misma pantalla**: un botón «Grabado» al pie.

---

## 9 · Lo que no va a un teléfono

Ser honesto acá vale más que forzar todo. Estas vistas se **degradan a propósito**:

| Vista | En teléfono |
|---|---|
| Dashboard financiero completo | Resumen: 4 KPI + un gráfico. El funnel completo pide pantalla. |
| Autoría de estrategia | Solo lectura. Se edita en escritorio. |
| Configuración de pipelines | Solo lectura. |
| Escritura de SOPs | Lectura sí, edición no. |
| Importación de datos | No disponible. |
| Vistas transversales de admin | No disponible. |
| Comparación de closers | Solo el resumen; el detalle en escritorio. |

**Cómo se comunica.** Nunca una pantalla rota ni un scroll horizontal infinito:

```
┌─────────────────────────────────┐
│                                 │
│           🖥️                    │
│                                 │
│  Esta vista necesita una        │
│  pantalla más grande            │
│                                 │
│  El análisis de funnel completo │
│  no entra bien en un teléfono.  │
│  Abrilo desde una computadora.  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Ver resumen del mes      │  │  ← siempre hay una alternativa útil
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

La regla: **la degradación siempre ofrece una acción alternativa**. Un callejón sin salida no
es una degradación, es un error.

---

## 10 · Red y rendimiento

Un closer en un estacionamiento con una barra de señal es un usuario real y frecuente.

| Requisito | Objetivo |
|---|---|
| Primer pintado con contenido | < 1.8 s en 4G |
| Interactivo | < 3.0 s en 4G |
| Peso de la ruta inicial | < 200 KB comprimido |
| CLS | < 0.1 |
| Respuesta al toque | < 100 ms de feedback visual |

### Reglas

- **Escrituras optimistas** en cambio de etapa, marcar tarea y registrar llamada. La UI
  responde de inmediato y revierte con un toast si el servidor rechaza.
- **Cola sin conexión** para esas tres escrituras. Se guardan localmente y se envían al
  recuperar red, con indicador de «pendiente de sincronizar».
- **Skeletons, nunca spinners.** Reservan la altura exacta y el layout no salta
  ([DESIGN.md §8](DESIGN.md#8--estados-de-datos)).
- **Virtualizar listas** de más de 50 elementos. Un pipeline con 800 deals no renderiza 800
  nodos.
- **Imágenes en WebP/AVIF**, con `loading="lazy"` y `width`/`height` declarados.
- **Code splitting por ruta.** El módulo de analítica con sus gráficos no debe descargarse
  cuando el closer abre la lista de llamadas.
- **Paginación por cursor**, nunca `OFFSET`. En móvil se carga de a 20 con scroll infinito.

---

## 11 · Gestos y feedback táctil

| Gesto | Dónde | Alternativa obligatoria |
|---|---|---|
| Deslizar tarjeta → | Pipeline: avanzar etapa | Botón en el menú de la tarjeta |
| Deslizar tarjeta ← | Pipeline: posponer | Botón en el menú de la tarjeta |
| Tirar para refrescar | Listas | Botón de refrescar en la barra |
| Mantener presionado | Selección múltiple | Botón «Seleccionar» |
| Pellizcar | Solo gráficos | Botones de zoom |

**Todo gesto tiene equivalente visible.** Un gesto es un atajo para quien lo descubre, nunca
la única ruta: es invisible para lectores de pantalla y para el usuario nuevo.

**Feedback inmediato.** Todo toque produce respuesta visual en menos de 100 ms — cambio de
fondo, escala al 98%, o ripple. Sin eso el usuario vuelve a tocar y dispara la acción dos veces.

**`overscroll-behavior: contain`** en contenedores con scroll propio, para que el rebote no
dispare el refresco de la página por accidente.

---

## 12 · Checklist responsive

Se corre antes de cada release de fase, en las cuatro anchuras.

**Layout**
- [ ] Sin scroll horizontal en 375, 768, 1024 y 1440px
- [ ] Contenido ancho (tablas, gráficos, código) con `overflow-x: auto` en su propio contenedor
- [ ] Sin anchos fijos en px en contenedores
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">`
- [ ] Zoom del usuario **no** deshabilitado
- [ ] `env(safe-area-inset-*)` respetado en barras fijas

**Táctil**
- [ ] Todos los targets ≥ 44 × 44px
- [ ] Separación ≥ 8px entre targets adyacentes
- [ ] Feedback visual en < 100 ms
- [ ] Todo gesto con alternativa por botón
- [ ] Nada depende de hover

**Formularios**
- [ ] `inputmode` y `autocomplete` correctos en cada campo
- [ ] Inputs a 16px en móvil (evita el zoom de iOS)
- [ ] Una columna en todos los breakpoints
- [ ] Envío pegado abajo en formularios largos
- [ ] Selects de más de 7 opciones como hoja con buscador

**Contenido**
- [ ] Las tablas se transforman en tarjetas por debajo de `md`
- [ ] Los gráficos bajan a 3 series y tooltip por toque
- [ ] Toda vista degradada ofrece una acción alternativa
- [ ] Estados de carga, vacío, error y parcial verificados en móvil

**Rendimiento**
- [ ] Ruta inicial < 200 KB comprimido
- [ ] Interactivo < 3 s en 4G simulado
- [ ] Listas de más de 50 elementos virtualizadas
- [ ] Escrituras optimistas en las tres acciones críticas

**Verificación en dispositivo real**
- [ ] Un iPhone y un Android reales, no solo el simulador del navegador
- [ ] Con una mano
- [ ] Con conexión lenta simulada
- [ ] Bajo el sol, para verificar el contraste del modo oscuro en la calle

El último punto no es un chiste: el modo oscuro con brillo automático al aire libre es el peor
escenario de contraste, y es exactamente donde va a estar un closer entre reuniones.
