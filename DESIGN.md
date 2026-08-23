# Yamil OS — Sistema de Diseño

> Documento normativo. Los valores de acá son tokens, no sugerencias.
> Ningún componente escribe un color, un tamaño o un radio en crudo.

**Producto:** dashboard de operaciones denso en datos.
**Modo primario:** oscuro. El claro existe y es completo, pero el oscuro es el default.

---

## 1 · Principios

| Principio | Qué significa en la práctica |
|---|---|
| **Densidad con aire** | Es un dashboard: cabe mucho dato por pantalla. Pero el aire va entre *grupos*, no dentro de ellos. Escala de espaciado compacta, agrupación clara. |
| **El dato es el héroe** | El cromo (bordes, fondos, sombras) se apaga para que los números resalten. Si un borde compite con una cifra, el borde pierde. |
| **El rojo se gana su lugar** | La marca es roja y saturada. Usarla en todos lados la vuelve ruido. Se reserva para acción primaria, estado activo y pérdida. |
| **Oscuro primero, claro completo** | El claro no es un afterthought con los colores invertidos: tiene sus propios valores derivados y verificados. |
| **Nunca solo color** | Todo estado que se comunica con color lleva además ícono o texto. Requisito WCAG 1.4.1, y además el 8% de los hombres no distingue rojo de verde. |

---

## 2 · Color

### 2.1 · Marca

| Token | Hex | Uso |
|---|---|---|
| `brand` | `#DB0F2A` | Identidad, acción primaria, estado activo |
| `ink` | `#2B2929` | Gris de marca, base de las superficies elevadas |
| `black` | `#000000` | Ancla del modo oscuro |
| `white` | `#FFFFFF` | Ancla del modo claro |

### 2.2 · ⚠️ Restricción crítica del rojo

Verifiqué la paleta contra WCAG 2.1. El resultado cambia cómo se puede usar `#DB0F2A`:

| Combinación | Ratio | Texto normal | Texto grande |
|---|---:|:---:|:---:|
| `#DB0F2A` sobre `#000000` | **4.11:1** | ❌ falla | ✅ AA |
| `#DB0F2A` sobre `#2B2929` | **2.83:1** | ❌ falla | ❌ falla |
| `#DB0F2A` sobre `#FFFFFF` | 5.10:1 | ✅ AA | ✅ AAA |
| `#FFFFFF` sobre `#DB0F2A` | 5.10:1 | ✅ AA | ✅ AAA |

**Lectura:** el rojo de marca **no se puede usar como color de texto sobre fondos oscuros**.
Sobre el gris de marca ni siquiera alcanza para titulares.

Pero funciona perfecto **como fondo** con texto blanco encima (5.10:1), y como texto en modo
claro (5.10:1).

**Solución:** un rojo aclarado exclusivo para el modo oscuro, derivado mezclando la marca con
blanco hasta alcanzar 4.5:1 sobre la superficie elevada.

```
brand         #DB0F2A   ← identidad, fondos, y texto SOLO en modo claro
brand-on-dark #E86577   ← texto y bordes en modo oscuro   (4.52:1 sobre #2B2929
                                                            6.56:1 sobre #000000)
brand-strong  #AF0C22   ← texto AAA en modo claro         (7.25:1 sobre blanco)
```

> [!IMPORTANT]
> `#DB0F2A` como color de texto en modo oscuro es un bug de accesibilidad, no una
> decisión estética. Usá `brand-on-dark`. El rojo puro sigue siendo el fondo del
> botón primario, donde el texto blanco encima sí cumple.

### 2.3 · Superficies — modo oscuro

No es negro puro en todo. El negro absoluto en superficies grandes cansa la vista y elimina
la posibilidad de jerarquía por elevación.

| Token | Hex | Rol | Contraste c/ blanco |
|---|---|---|---:|
| `bg` | `#0A0A0A` | Canvas de la app | 19.80:1 |
| `surface` | `#151414` | Cards, paneles, tablas | 18.39:1 |
| `raised` | `#2B2929` | Popovers, dropdowns, tooltips | 14.46:1 |
| `overlay` | `#3A3838` | Modales, sheets | 11.65:1 |
| `border` | `#3A3838` | Divisiones, bordes de card | — |
| `border-strong` | `#4D4A4A` | Bordes de input, foco | — |

### 2.4 · Texto — modo oscuro

| Token | Hex | Sobre `bg` | Sobre `surface` | Uso |
|---|---|---:|---:|---|
| `fg` | `#F5F3F3` | 17.91:1 | 16.63:1 | Texto principal, cifras |
| `fg-secondary` | `#B8B4B4` | 9.64:1 | 8.95:1 | Etiquetas, descripciones |
| `fg-muted` | `#8A8585` | 5.44:1 | 5.06:1 | Metadatos, placeholders |
| `fg-disabled` | `#5C5858` | 2.82:1 | 2.62:1 | Deshabilitado |

`fg-disabled` no cumple 4.5:1 **a propósito**: WCAG exceptúa los controles deshabilitados, y
la baja legibilidad es la señal. Nunca usarlo para texto que se deba leer.

### 2.5 · Superficies y texto — modo claro

| Token | Hex | Rol |
|---|---|---|
| `bg` | `#FFFFFF` | Canvas |
| `surface` | `#F7F6F6` | Cards |
| `raised` | `#EFEDED` | Popovers |
| `border` | `#DEDBDB` | Divisiones |

| Token | Hex | Sobre `bg` | Sobre `surface` |
|---|---|---:|---:|
| `fg` | `#1A1818` | 17.68:1 | 16.39:1 |
| `fg-secondary` | `#4D4A4A` | 8.77:1 | 8.13:1 |
| `fg-muted` | `#6E6A6A` | 5.34:1 | 4.95:1 |
| `fg-disabled` | `#A39F9F` | 2.62:1 | 2.43:1 |

El gris del modo claro es cálido (tiene rojo), no neutro. Deriva del `#2B2929` de marca y
mantiene la familia cromática en los dos modos.

### 2.6 · Colores funcionales

Cada uno tiene un valor por modo, verificado sobre su superficie.

| Semántica | Oscuro | Ratio | Claro | Ratio |
|---|---|---:|---|---:|
| `success` | `#3FD68A` | 9.80:1 | `#0F7A45` | 5.00:1 |
| `warning` | `#F5B33C` | 9.98:1 | `#8A5A00` | 5.49:1 |
| `info` | `#5AA9FF` | 7.49:1 | `#0B5ED7` | 5.41:1 |
| `danger` | `#E86577` | 5.74:1 | `#B3121F` | 6.44:1 |

> [!WARNING]
> **La marca es roja y el error también.** Es un conflicto real: el usuario no puede
> distinguir "esto es Yamil OS" de "esto está roto" solo por el color.
>
> **Regla que lo resuelve:** el rojo como *fondo sólido* siempre es marca (botón primario,
> badge activo). El rojo como *texto, borde o ícono* siempre es error o pérdida. Y todo
> estado de error lleva ícono + texto, nunca color solo.

---

## 3 · Color en datos

### 3.1 · El rojo está prohibido como serie

En un dashboard financiero el rojo significa **pérdida**. Graficar "Revenue" en rojo de marca
le dice al usuario que el ingreso es un problema. La marca no puede ganarle a esa convención.

```
✅ Rojo permitido en datos:  deltas negativos, churn, deals perdidos,
                              objeciones, barras de caída del funnel
❌ Rojo prohibido en datos:  cualquier serie categórica, revenue, leads,
                              cualquier métrica que crecer sea bueno
```

### 3.2 · Paleta categórica

Seis series, ordenadas por separación de matiz. Todas superan 3:1 (WCAG 1.4.11, objetos
gráficos) sobre su superficie.

| # | Oscuro | Ratio | Claro | Ratio |
|---|---|---:|---|---:|
| 1 | `#4CC9F0` cian | 9.56:1 | `#0E7490` | 4.97:1 |
| 2 | `#F5B33C` ámbar | 9.98:1 | `#B45309` | 4.66:1 |
| 3 | `#A78BFA` violeta | 6.76:1 | `#6D28D9` | 6.59:1 |
| 4 | `#3FD68A` verde | 9.80:1 | `#0F7A45` | 5.00:1 |
| 5 | `#FF8FA3` rosa | 8.50:1 | `#BE185D` | 5.60:1 |
| 6 | `#9AE6E6` turquesa | 12.99:1 | `#0F766E` | 5.07:1 |

**Reglas duras**

1. **Máximo 6 series por gráfico.** Más allá de eso ningún ojo las distingue. Si hacen falta
   más, agrupá en "Otros" o cambiá de tipo de gráfico.
2. **Más de 3 series → agregar codificación no cromática**: patrón de línea (sólida, guiones,
   puntos), marcador distinto, o etiqueta directa sobre la serie.
3. **Series 2 (ámbar) y 4 (verde) no van adyacentes** en gráficos apilados: bajo deuteranopía
   se acercan.
4. **Etiqueta directa sobre leyenda** cuando hay espacio. Una leyenda obliga a saltar la vista
   entre el gráfico y la referencia; la etiqueta directa no.
5. **Nunca color como único portador de significado.** Todo gráfico necesita tooltip con el
   valor y la serie en texto.

### 3.3 · Deltas

```
▲ +12.4%   success   crecimiento
▼ −8.1%    danger    caída
—  0.0%    fg-muted  sin cambio
```

La flecha va **siempre**. Un daltónico ve la flecha; el color solo es refuerzo.

---

## 4 · Tipografía

### 4.1 · Las dos familias

```css
@import url('https://fonts.googleapis.com/css2?family=Fjalla+One&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap');
```

| Familia | Rol | Pesos disponibles |
|---|---|---|
| **Fjalla One** | Títulos, cifras KPI grandes, etiquetas de sección | **400 únicamente** — no tiene más |
| **Nunito** | Todo el resto: cuerpo, UI, tablas, formularios | Variable 200–1000, con itálica |

### 4.2 · Restricciones de Fjalla One

Es una display condensada de un solo peso. Eso impone límites reales:

| Restricción | Consecuencia |
|---|---|
| Un solo peso (400) | No existe "Fjalla bold". Para jerarquía dentro de títulos se usa **tamaño**, no peso. |
| Condensada | A menos de 20px se apretuja y pierde legibilidad. **Piso: 20px.** |
| Sin itálica | Para énfasis dentro de un título, cambiar de familia o de color. |
| Alta en mayúsculas | Rinde muy bien en `uppercase` con tracking positivo. Es su mejor uso. |

> [!CAUTION]
> **No usar Fjalla One para texto en negrita chico.** El impulso de "esto tiene que ser más
> grueso" en una etiqueta de 13px se resuelve con **Nunito 700–800**, no con Fjalla One.
> Nunito llega hasta 1000 de peso — hay recorrido de sobra.

### 4.3 · Escala tipográfica

Escala compacta, apropiada para densidad de dashboard.

| Token | Tamaño / interlineado | Familia | Peso | Uso |
|---|---|---|---|---|
| `display` | 40 / 44 | Fjalla One | 400 | Cifra KPI hero, pantallas vacías |
| `h1` | 32 / 38 | Fjalla One | 400 | Título de página |
| `h2` | 24 / 30 | Fjalla One | 400 | Título de sección |
| `h3` | 20 / 26 | Fjalla One | 400 | Título de card |
| `h4` | 16 / 22 | **Nunito** | 700 | Subtítulo — bajo el piso de Fjalla |
| `body` | 14 / 21 | Nunito | 400 | Texto por defecto de la UI |
| `body-lg` | 16 / 24 | Nunito | 400 | Lectura larga: SOPs, estrategia |
| `label` | 13 / 18 | Nunito | 600 | Etiquetas de formulario, headers de tabla |
| `caption` | 12 / 16 | Nunito | 400 | Metadatos, timestamps, ayudas |
| `overline` | 11 / 14 | Nunito | 700 | `uppercase`, `tracking: 0.08em` |
| `mono` | 13 / 20 | ui-monospace | 400 | IDs, tokens, fragmentos de código |

`body` a 14px es deliberado: es un dashboard, no un blog. Para lectura larga (docs de
estrategia, SOPs) se sube a `body-lg` 16px.

### 4.4 · Cifras tabulares — obligatorio

```css
.tabular { font-variant-numeric: tabular-nums; }
```

Se aplica **sin excepción** a: columnas numéricas de tabla, cifras KPI, montos, porcentajes,
ejes de gráfico y cualquier número que se compare verticalmente.

Sin esto, `$12,400` y `$8,190` no alinean sus dígitos y la columna se ve rota. Es el detalle
que más separa un dashboard profesional de uno amateur.

### 4.5 · Resolviendo la tensión entre las dos fuentes

Nunito es redondeada y cálida. Fjalla One es condensada e industrial. No son parientes — y
esa distancia es justamente lo que las hace funcionar: nunca se confunden entre sí.

Para que la mezcla se lea intencional y no accidental:

- Fjalla One **siempre** en títulos y cifras grandes. Nunca en cuerpo.
- Títulos en Fjalla One con `letter-spacing: -0.01em` — al ser condensada, un poquito de
  tracking negativo la compacta como bloque y la vuelve más deliberada.
- `overline` en Nunito 700 uppercase con tracking `+0.08em`, no en Fjalla One. Mantiene la
  redondez en los tamaños chicos y evita el choque.
- Nunca dos familias en la misma línea de texto.

---

## 5 · Espaciado y layout

Escala densa (base 4px), calibrada para dashboard.

| Token | px | Uso |
|---|---:|---|
| `space-0.5` | 2 | Separación de íconos |
| `space-1` | 4 | Padding interno mínimo |
| `space-2` | 8 | Gap entre elementos relacionados |
| `space-3` | 12 | Padding de celda de tabla |
| `space-4` | 16 | Padding de card, gap de grid |
| `space-6` | 24 | Separación entre secciones |
| `space-8` | 32 | Separación entre bloques mayores |
| `space-12` | 48 | Padding superior de página |
| `space-16` | 64 | Padding de estados vacíos |

**Regla de agrupación:** el espacio *dentro* de un grupo siempre es menor que el espacio
*entre* grupos. Si una etiqueta y su valor están a 8px, el siguiente par tiene que estar a
16px o más. Sin eso el ojo no puede segmentar.

### Grilla

| Breakpoint | Ancho | Layout |
|---|---|---|
| `sm` | 375px | 1 columna, nav inferior, cards apiladas |
| `md` | 768px | 2 columnas, sidebar colapsable |
| `lg` | 1024px | 3 columnas, sidebar fija 240px |
| `xl` | 1440px | 4 columnas, contenido máx 1440px centrado |

Sidebar: 240px expandida, 64px colapsada (solo íconos con tooltip).

---

## 6 · Elevación

> [!IMPORTANT]
> **Las sombras casi no funcionan en modo oscuro.** Una sombra negra sobre un fondo casi
> negro es invisible. La jerarquía en oscuro se comunica con **luminosidad de superficie**,
> no con sombra.

| Nivel | Oscuro | Claro |
|---|---|---|
| 0 — canvas | `bg` `#0A0A0A` | `bg` `#FFFFFF` |
| 1 — card | `surface` `#151414` + borde `#3A3838` | `surface` `#F7F6F6` + sombra sutil |
| 2 — popover | `raised` `#2B2929` + borde `#4D4A4A` | `raised` `#EFEDED` + sombra media |
| 3 — modal | `overlay` `#3A3838` + backdrop 70% | `#FFFFFF` + sombra fuerte + backdrop 50% |

En oscuro **el borde hace el trabajo de la sombra**. Cada card lleva `1px solid border`.
En claro el borde se atenúa y la sombra toma el relevo.

```css
/* solo modo claro */
--shadow-1: 0 1px 2px rgb(0 0 0 / .06), 0 1px 3px rgb(0 0 0 / .10);
--shadow-2: 0 4px 6px rgb(0 0 0 / .05), 0 10px 15px rgb(0 0 0 / .10);
--shadow-3: 0 10px 15px rgb(0 0 0 / .04), 0 20px 25px rgb(0 0 0 / .10);
```

### Radios

| Token | px | Uso |
|---|---:|---|
| `radius-sm` | 4 | Badges, tags, checkbox |
| `radius-md` | 6 | Botones, inputs, celdas |
| `radius-lg` | 8 | Cards, paneles |
| `radius-xl` | 12 | Modales, sheets |
| `radius-full` | 9999 | Avatares, pills, indicadores |

Radios contenidos a propósito. Las esquinas muy redondeadas suavizan y restan seriedad; un
dashboard financiero necesita leerse preciso.

---

## 7 · Componentes

Base shadcn/ui, personalizada. Toda variante nueva se agrega acá antes de usarse.

### Botones

| Variante | Oscuro | Claro | Cuándo |
|---|---|---|---|
| `primary` | fondo `#DB0F2A`, texto blanco | igual | Una sola acción primaria por vista |
| `secondary` | fondo `raised`, borde `border-strong`, texto `fg` | análogo | Acción alternativa |
| `ghost` | transparente, texto `fg-secondary`, hover `surface` | igual | Acciones terciarias, barras de íconos |
| `destructive` | borde `#E86577`, texto `#E86577` | borde/texto `#B3121F` | Borrar, revocar — **contorno, no relleno** |
| `link` | texto `brand-on-dark`, subrayado en hover | texto `brand` | Navegación inline |

`destructive` va con contorno y no relleno **precisamente** porque el relleno rojo es el botón
primario. Si borrar se viera igual que confirmar, alguien va a borrar por accidente.

**Alturas:** `sm` 32px · `md` 36px (default) · `lg` 40px
**Target táctil:** mínimo 44×44px de área clickeable, aunque el botón se vea de 36px. En
móvil se usa padding invisible para llegar.

### Inputs

```
reposo     borde border-strong · fondo surface · texto fg
hover      borde #5C5858
foco       borde brand-on-dark · ring 2px brand-on-dark @ 40% · sin outline por defecto
error      borde danger + ícono + mensaje debajo
disabled   fondo bg · texto fg-disabled · cursor not-allowed
```

Etiqueta **siempre visible arriba** del campo. Nunca placeholder como etiqueta: desaparece al
escribir y deja al usuario sin contexto.

### Cards

```
fondo surface · borde 1px border · radius-lg · padding space-4
título h3 (Fjalla One 20px) · cuerpo body (Nunito 14px)
```

### Tablas de datos

```
header    overline (Nunito 700 uppercase 11px) · fg-muted · fondo bg · sticky
celda     body 14px · padding space-3 · tabular-nums en columnas numéricas
fila      hover fondo raised · borde inferior 1px border
zebra     NO — el hover ya da la referencia y el zebra ensucia en denso
```

Numéricas alineadas a la derecha, texto a la izquierda, fechas a la izquierda.

### Tablero de pipeline

Columna: ancho fijo 300px, header sticky con nombre de etapa y contador.
Card de deal: `surface`, borde izquierdo 3px del color de la etapa, drag con `dnd-kit`.
Durante el arrastre: card al 90% de opacidad, columna destino con borde `brand-on-dark`.

### Badges de estado

| Estado | Tratamiento |
|---|---|
| Activo / ganado | fondo `success` @ 15%, texto `success`, punto sólido |
| Pendiente | fondo `warning` @ 15%, texto `warning` |
| Perdido / error | fondo `danger` @ 15%, texto `danger` |
| Neutro | fondo `raised`, texto `fg-secondary` |

Fondo translúcido + texto sólido: se lee en los dos modos sin duplicar tokens.

---

## 8 · Estados de datos

Cada vista que carga datos necesita los cuatro. Que falte uno es un bug, no un pendiente.

| Estado | Tratamiento |
|---|---|
| **Cargando** | Skeleton con la forma del contenido real, no un spinner. Reserva la altura exacta → CLS = 0. |
| **Vacío** | Ícono + qué es esto + **una acción primaria**. Nunca "No hay datos" a secas. |
| **Error** | Qué falló + qué puede hacer el usuario + botón de reintentar. Nunca un código de error crudo. |
| **Parcial** | Mostrar lo que hay + banner de qué falta. Un dashboard con métricas incompletas debe **decirlo**, no dibujar un cero. |

El estado parcial es el que más se olvida y el que más daño hace: un CAC que se ve normal
pero le falta el gasto de la semana pasada es peor que no mostrar CAC.

---

## 9 · Movimiento

| Interacción | Duración | Easing |
|---|---:|---|
| Hover / cambio de color | 150ms | `ease-out` |
| Dropdown, tooltip | 180ms | `ease-out` |
| Modal, sheet | 240ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Transición de página | 200ms | `ease-in-out` |
| Entrada de gráfico | 400ms | `ease-out`, escalonado 40ms |

**Reglas**
- Nada por encima de 400ms. En una herramienta de trabajo, la animación lenta es fricción.
- Animar solo `transform` y `opacity`. Animar `width`/`height` provoca reflow y jank.
- La salida es más rápida que la entrada (≈70%): irse debe sentirse inmediato.
- El movimiento comunica relación espacial. Un dropdown baja desde su disparador; un modal
  escala desde el centro. Movimiento decorativo: no.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
```

No es opcional.

---

## 10 · Iconografía

**Lucide React**, 1.5px de trazo, tamaños 16 / 20 / 24px.

- **Nada de emoji como ícono.** Renderizan distinto por SO, no heredan color, no escalan bien.
- Todo botón que sea solo ícono lleva `aria-label` y tooltip.
- Los íconos heredan `currentColor`; nunca se les pone color en crudo.
- Un concepto, un ícono, en todo el producto.

---

## 11 · Checklist de accesibilidad

Se corre antes de cada release de fase.

- [ ] Texto normal ≥ 4.5:1 · texto grande ≥ 3:1 · objetos gráficos ≥ 3:1
- [ ] `#DB0F2A` no aparece como color de texto en modo oscuro
- [ ] Ningún estado se comunica solo con color (ícono o texto siempre)
- [ ] Todo lo interactivo alcanzable por teclado, con foco visible
- [ ] Anillo de foco ≥ 3:1 contra el fondo adyacente (verificado: 5.74:1 oscuro, 4.73:1 claro)
- [ ] Targets táctiles ≥ 44×44px
- [ ] Todo input con etiqueta visible asociada
- [ ] Errores anunciados con `aria-live`
- [ ] Drag and drop con alternativa por teclado (pipeline y calendario)
- [ ] Gráficos con tabla de datos alternativa o resumen textual
- [ ] `prefers-reduced-motion` respetado
- [ ] Verificado a 375 / 768 / 1024 / 1440px sin scroll horizontal
- [ ] Pasada de axe-core en CI sin violaciones

El pipeline y el calendario son los dos componentes con drag and drop y **los que más se
rompen** para lectores de pantalla. Cada uno necesita su ruta por teclado explícita.

---

## 12 · Implementación

Tailwind CSS v4 es CSS-first: **no existe `tailwind.config.ts`**. Todo vive en `globals.css`.

```css
/* app/globals.css */
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Fjalla+One&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap');

/* El oscuro es el default en :root, así que el variant que se define es `light:`.
   Definir `dark:` sería inútil: no existe ninguna clase .dark en este sistema. */
@custom-variant light (&:where(.light, .light *));

@theme inline {
  --font-display: "Fjalla One", Impact, "Arial Narrow Bold", sans-serif;
  --font-sans:    "Nunito", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    ui-monospace, "SF Mono", Menlo, monospace;

  --color-brand:          var(--brand);
  --color-brand-hover:    var(--brand-hover);
  --color-on-brand:       var(--on-brand);
  --color-background:     var(--bg);
  --color-surface:        var(--surface);
  --color-raised:         var(--raised);
  --color-overlay:        var(--overlay);
  --color-border:         var(--border);
  --color-border-strong:  var(--border-strong);
  --color-foreground:     var(--fg);
  --color-fg-secondary:   var(--fg-secondary);
  --color-fg-muted:       var(--fg-muted);
  --color-fg-disabled:    var(--fg-disabled);
  --color-success:        var(--success);
  --color-warning:        var(--warning);
  --color-info:           var(--info);
  --color-danger:         var(--danger);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-chart-6: var(--chart-6);

  --radius-sm: 4px;  --radius-md: 6px;  --radius-lg: 8px;  --radius-xl: 12px;
}

/* ── Oscuro: el default ─────────────────────────────────────── */
:root {
  --brand:         #DB0F2A;
  --brand-hover:   #F01732;
  --on-brand:      #FFFFFF;
  --brand-text:    #E86577;   /* el rojo puro NO cumple como texto en oscuro */

  --bg:            #0A0A0A;
  --surface:       #151414;
  --raised:        #2B2929;
  --overlay:       #3A3838;
  --border:        #3A3838;
  --border-strong: #4D4A4A;

  --fg:            #F5F3F3;
  --fg-secondary:  #B8B4B4;
  --fg-muted:      #8A8585;
  --fg-disabled:   #5C5858;

  --success: #3FD68A;  --warning: #F5B33C;
  --info:    #5AA9FF;  --danger:  #E86577;

  --chart-1: #4CC9F0;  --chart-2: #F5B33C;  --chart-3: #A78BFA;
  --chart-4: #3FD68A;  --chart-5: #FF8FA3;  --chart-6: #9AE6E6;
}

/* ── Claro ──────────────────────────────────────────────────── */
.light {
  --brand:         #DB0F2A;
  --brand-hover:   #AF0C22;
  --on-brand:      #FFFFFF;
  --brand-text:    #DB0F2A;   /* acá sí cumple: 5.10:1 sobre blanco */

  --bg:            #FFFFFF;
  --surface:       #F7F6F6;
  --raised:        #EFEDED;
  --overlay:       #FFFFFF;
  --border:        #DEDBDB;
  --border-strong: #C4C0C0;

  --fg:            #1A1818;
  --fg-secondary:  #4D4A4A;
  --fg-muted:      #6E6A6A;
  --fg-disabled:   #A39F9F;

  --success: #0F7A45;  --warning: #8A5A00;
  --info:    #0B5ED7;  --danger:  #B3121F;

  --chart-1: #0E7490;  --chart-2: #B45309;  --chart-3: #6D28D9;
  --chart-4: #0F7A45;  --chart-5: #BE185D;  --chart-6: #0F766E;
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, .display {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: -0.01em;
}

.tabular { font-variant-numeric: tabular-nums; }

.overline {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Por qué el oscuro va en `:root` y el claro en `.light`

Al revés de lo habitual. El modo oscuro es el default del producto, así que va en la cascada
base: si el JS del theme toggle falla o tarda, la app pinta oscuro, que es lo correcto. Con
el patrón inverso (`:root` claro, `.dark` oscuro) el usuario ve un flash blanco en cada carga
— molesto siempre, agresivo en una app que se usa de noche.

`<html class="light">` cuando el usuario elige claro. Sin clase, oscuro.

### Reglas de uso

1. **Ningún hex en un componente.** Solo tokens. Un `#DB0F2A` en un `.tsx` es un bug de
   revisión.
2. **Ningún px de espaciado arbitrario.** Solo la escala.
3. **Token nuevo → primero acá, después el código.**
4. Componentes de shadcn: se personalizan al agregarlos, no después.

---

## 13 · Branding de tenant

**Yamil OS es la marca del software.** Cada cliente carga su logo y su color en el onboarding,
y esa identidad se superpone a la de Yamil OS — no la reemplaza.

### 13.1 · Qué es de Yamil OS y qué es del tenant

| Zona | Marca | Por qué |
|---|---|---|
| Login, sidebar, topbar | **Yamil OS** | Es el producto. Un admin que salta entre cuentas necesita un chrome estable. |
| Botón primario, foco, error | **Yamil OS** | Semántica de interacción. Si cambiara por cuenta, "confirmar" se vería distinto en cada tenant. |
| Franja de identidad de cuenta | **Tenant** | Señal permanente de en qué cuenta estás parado. |
| Avatar / marca de la cuenta | **Tenant** | Su logo, en el selector y el header. |
| Reportes y exports | **Tenant** | Es lo que el cliente le muestra a *sus* clientes. Acá su marca manda. |
| Gráficos y series | **Ninguna** | Paleta categórica del sistema. Ver §3. |

> [!IMPORTANT]
> El color del tenant **no re-tematiza la aplicación**. Es una banda de identidad, no un tema.
>
> Si cada cuenta recoloreara toda la UI, un admin de la agencia que pasa de la cuenta A a la B
> tendría que reaprender qué botón es cuál. Peor: el rojo de "borrar" en una cuenta podría ser
> el verde de "confirmar" en otra. Eso no es personalización, es una trampa.
>
> Al mismo tiempo, la franja de color **sí** resuelve el error más caro del multi-tenant:
> editar los datos del cliente equivocado. Un borde de color persistente y un logo visible
> hacen que sea imposible confundirse.

### 13.2 · La regla que elimina la derivación

El color del tenant se usa **solo como fondo**, nunca como texto ni como borde sobre
superficies del sistema.

Eso no es una limitación arbitraria — es lo que preserva su marca intacta:

```
Para CUALQUIER color, siempre existe blanco o negro encima que supera 4.58:1.

  Umbral:  L > 0.1791  →  texto negro
           L ≤ 0.1791  →  texto blanco

  En el punto exacto de cruce ambas opciones dan 4.58:1, por encima del 4.5 de AA.
```

Verificado sobre 12 colores hostiles (amarillo neón, rosa pastel, blanco puro, negro puro,
cian, magenta…). **Peor caso: 5.10:1.** Siempre cumple.

| Color del cliente | Texto automático | Ratio |
|---|---|---:|
| `#FFEE00` amarillo neón | `#000000` | 17.48:1 |
| `#FFD1DC` rosa pastel | `#000000` | 15.41:1 |
| `#FFFFFF` blanco puro | `#000000` | 21.00:1 |
| `#000000` negro puro | `#FFFFFF` | 21.00:1 |
| `#808080` gris medio | `#000000` | 5.32:1 |
| `#FF00FF` magenta | `#000000` | 6.70:1 |

```ts
// Una función, cero configuración, siempre accesible.
export function onTenantColor(hex: string): "#000000" | "#FFFFFF" {
  return relativeLuminance(hex) > 0.1791 ? "#000000" : "#FFFFFF";
}
```

### 13.3 · Por qué NO derivamos el color del tenant

La alternativa —aclarar u oscurecer su color hasta que cumpla como texto— destruye la marca:

| Color del cliente | Derivado para modo claro | Resultado |
|---|---|---|
| `#FFEE00` amarillo neón | `#7A7200` | Un oliva apagado. **No es su color.** |
| `#FFFFFF` blanco | `#707070` | Gris. Su marca desapareció. |
| `#FFD1DC` rosa pastel | `#826B70` | Marrón grisáceo. Irreconocible. |

Un cliente que ve su amarillo neón convertido en oliva abre un ticket de soporte, y tiene
razón. **Usar su color solo como fondo evita el problema por completo.**

Si en algún momento hace falta el color del tenant como acento funcional, la derivación queda
disponible como fallback — pero **se le muestra el resultado en el onboarding y él lo aprueba**.
Nunca se distorsiona su marca en silencio.

### 13.4 · Tokens

```css
/* Inyectados en runtime en el wrapper de la cuenta, no en :root */
[data-tenant] {
  --tenant-brand:    #1E40AF;   /* exacto, como lo cargó el cliente */
  --tenant-on-brand: #FFFFFF;   /* calculado por luminancia */
}
```

```tsx
<div
  data-tenant={account.slug}
  style={{
    "--tenant-brand":    account.branding.color,
    "--tenant-on-brand": onTenantColor(account.branding.color),
  } as React.CSSProperties}
>
```

Los tokens de Yamil OS quedan en `:root` y son inmutables. Los del tenant viven en un scope
más abajo y no pueden pisarlos.

### 13.5 · Logos

Un solo archivo casi nunca funciona en los dos modos: la mayoría de los clientes sube un PNG
pensado para fondo blanco, que en modo oscuro desaparece.

| Campo | Requisito | Uso |
|---|---|---|
| `logo_light` | SVG o PNG transparente | Sobre superficies claras |
| `logo_dark` | SVG o PNG transparente | Sobre superficies oscuras |
| `logo_mark` | Cuadrado 1:1, mín 256px | Avatar, favicon, selector de cuenta |

**Fallback automático:** si el cliente sube un solo logo, se renderiza dentro de un contenedor
blanco con `radius-md` y `space-2` de padding. Se ve intencional, no roto, y funciona en los
dos modos sin pedirle un segundo archivo.

Si no sube nada: monograma con las iniciales de la cuenta sobre `--tenant-brand`, con el
texto calculado por luminancia.

### 13.6 · Onboarding de marca

```
1. El cliente sube su logo        → se detecta si tiene transparencia
2. Elige su color                 → color picker + campo hex
3. Vista previa EN VIVO           → se muestra la franja, el avatar y un
                                     export de ejemplo, en oscuro y en claro
4. Confirma
```

El paso 3 no es opcional. Es donde el cliente ve cómo queda su marca de verdad, en lugar de
descubrirlo después y pedir cambios.

---

## 14 · Pendientes

| # | Pregunta | Necesario para | Estado |
|---|---|---|---|
| D1 | ¿Existe logotipo de Yamil OS, o hay que diseñarlo? | Header, favicon, login | **Abierto** |
| D2 | ¿Marca blanca por cliente o marca única? | Arquitectura de tokens | ✅ **Resuelto** — ver §13: Yamil OS es el chrome, el tenant aporta logo y color como capa superpuesta |
| D3 | ¿Densidad "cómoda" además de la compacta, como toggle? | Escala de espaciado | **Abierto** |
| D4 | ¿Identidad de marca previa de Yamil OS a respetar? | Consistencia | **Abierto** |
| D5 | ¿El cliente puede elegir el modo claro como su default, o lo fuerza Yamil OS a oscuro? | Preferencia de usuario vs de cuenta | **Abierto** |

**D1 pasa a ser el más urgente.** El sistema de diseño está definido, pero el chrome necesita
una marca visual concreta —logotipo, monograma, favicon— y hoy no existe. Sin eso, el header
y la pantalla de login no se pueden terminar.
