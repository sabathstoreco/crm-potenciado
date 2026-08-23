import type { TenantDataset } from '@/lib/types';

/**
 * MÉTODO RAÍZ — infoproducto low ticket. Sin llamadas, sin closers, sin agendas.
 *
 * `calls: null` es intencional: el embudo no agenda. La pantalla de Llamadas se
 * degrada con una explicación en vez de mostrar ceros, que el usuario leería
 * como "está en cero" en lugar de "no aplica".
 *
 *   $8,940 / 11,420 leads = $0.78 CPL · 612 compras = $14.61 CAC
 *   612 × $97 = $59,364 revenue · ROAS 6.6x
 */
export const raiz: TenantDataset = {
  members: [
    { name: 'Tomás Vidal', email: 'tomas@raiz.demo', role: 'owner', roleLabel: 'Owner', lastSeen: 'hace 4 h', mfa: false },
    { name: 'Yamil', email: 'admin@yamilos.demo', role: 'manager', roleLabel: 'Manager', lastSeen: 'ahora', mfa: true },
    { name: 'Edu Paz', email: 'edu@raiz.demo', role: 'editor', roleLabel: 'Editor', lastSeen: 'hace 30 min', mfa: false },
    { name: 'Nadia Cruz', email: 'nadia@raiz.demo', role: 'editor', roleLabel: 'Editor', lastSeen: 'hace 1 h', mfa: false },
    { name: 'Soporte', email: 'soporte@raiz.demo', role: 'community_manager', roleLabel: 'Community manager', lastSeen: 'hace 6 min', mfa: false },
  ],
  content: {
    kpis: [
      { label: 'Piezas publicadas', value: '246', hint: 'en 4 cuentas' },
      { label: 'Retención 3 s', value: '67%', delta: { value: '8 pts', positive: true } },
      { label: 'Comentarios / vista', value: '2.40%', hint: 'la palabra clave funciona' },
      { label: 'Ventas atribuidas', value: '421', hint: 'de 612 totales', tone: 'highlight' },
    ],
    angles: [
      { name: 'Resultado rápido', value: 168, display: '168 ventas' },
      { name: 'Error común', value: 112, display: '112 ventas' },
      { name: 'Contrario', value: 84, display: '84 ventas' },
      { name: 'Historia personal', value: 57, display: '57 ventas' },
      { name: 'Tutorial largo', value: 0, display: '0 ventas', tone: 'alert' },
    ],
    hcc: [
      { name: 'HOOK — 3 primeros s', value: 67, display: '67%' },
      { name: 'CONTEXTO — retención', value: 39, display: '39%' },
      { name: 'CTA — comentarios', value: 240, display: '2.40%' },
    ],
    pieces: [
      { id: 'p1', title: 'El error que te cuesta 3 horas al día', channel: '@metodo', angle: 'Error común', pain: 'Pierde tiempo', hook3s: 84, comments: 9420, sales: 96, revenue: 9312 },
      { id: 'p2', title: 'Resultado en 7 días sin cambiar nada', channel: '@metodo', angle: 'Resultado rápido', pain: 'Ya probó de todo', hook3s: 81, comments: 8110, sales: 88, revenue: 8536 },
      { id: 'p3', title: 'Todo lo que te enseñaron está mal', channel: '@metodo', angle: 'Contrario', pain: 'Info contradictoria', hook3s: 76, comments: 6240, sales: 71, revenue: 6887 },
      { id: 'p4', title: 'Cómo empecé sin nada', channel: '@historia', angle: 'Historia personal', pain: 'Cree que no puede', hook3s: 62, comments: 3180, sales: 42, revenue: 4074 },
      { id: 'p5', title: 'Tutorial completo de 12 minutos', channel: '@metodo', angle: 'Tutorial largo', pain: 'Quiere el paso a paso', hook3s: 29, comments: 410, sales: 0, revenue: 0 },
    ],
  },

  calendar: {
    kpis: [
      { label: 'Programadas', value: '21', hint: 'esta semana' },
      { label: 'En edición', value: '6', hint: 'con el editor' },
      { label: 'Sin grabar', value: '4', hint: 'bloquean el fin de semana', tone: 'alert' },
      { label: 'Guiones en banco', value: '38', hint: 'entregados al cliente' },
    ],
    week: [
      { label: 'LUN', slots: [
        { title: 'Guion 41 · error', channel: '@metodo', meta: 'error común · publicado', state: 'published' },
        { title: 'Guion 42 · corto', channel: '@clips', meta: 'publicado', state: 'published' },
        { title: 'Historia · encuesta', channel: '@metodo', meta: '', state: 'idle' },
      ]},
      { label: 'MAR', slots: [
        { title: 'Guion 43 · resultado', channel: '@metodo', meta: 'programado', state: 'scheduled' },
        { title: 'Guion 44 · corto', channel: '@clips', meta: 'programado', state: 'scheduled' },
      ]},
      { label: 'MIÉ', slots: [
        { title: 'Guion 45 · contrario', channel: '@metodo', meta: 'en edición', state: 'editing' },
        { title: 'Guion 46 · corto', channel: '@clips', meta: 'en edición', state: 'editing' },
      ]},
      { label: 'JUE', slots: [
        { title: 'Guion 47 · historia', channel: '@historia', meta: 'programado', state: 'scheduled' },
        { title: 'Email · carrito', channel: 'email', meta: '', state: 'idle' },
      ]},
      { label: 'VIE', slots: [
        { title: 'Guion 48 · error', channel: '@metodo', meta: 'programado', state: 'scheduled' },
      ]},
      { label: 'SÁB', slots: [
        { title: 'Guion 49 · resultado', channel: '@metodo', meta: 'SIN GRABAR', state: 'blocked' },
      ]},
      { label: 'DOM', slots: [
        { title: 'Guion 50 · contrario', channel: '@metodo', meta: 'SIN GRABAR', state: 'blocked' },
      ]},
    ],
    note: 'Volumen diario en cuatro cuentas: el cuello de botella acá no es la idea, es la grabación. Cuatro guiones sin grabar bloquean el fin de semana entero.',
  },

  pipeline: {
    // Sin agendas ni show rate: el embudo va directo a checkout.
    kpis: [
      { label: 'Leads activos', value: '4,208', hint: 'en secuencia' },
      { label: 'Landing visitada', value: '2,946', hint: '70% de los leads' },
      { label: 'Checkout iniciado', value: '1,183', hint: '40% de las visitas' },
      { label: 'Carrito abandonado', value: '571', hint: 'recuperables', tone: 'alert' },
      { label: 'Compras', value: '612', hint: '$59,364', tone: 'highlight' },
    ],
    stages: [
      { name: 'Nuevo', cards: [
        { name: '@lead.90412', meta: 'lead magnet · 1 día' },
        { name: '@lead.90408', meta: 'lead magnet · 1 día' },
      ]},
      { name: 'Lead magnet', cards: [{ name: '@lead.90355', meta: 'descargó · 3 días' }] },
      { name: 'Landing', cards: [
        { name: '@lead.90287', meta: 'visitó 2 veces · 5 días', hot: true },
      ]},
      { name: 'Checkout', cards: [
        { name: '@lead.90201', meta: 'abandonó · 2 días', hot: true },
        { name: '@lead.90188', meta: 'abandonó · 4 días' },
      ]},
      { name: 'Comprado', cards: [
        { name: '@lead.90144', meta: 'Método Raíz · $97' },
        { name: '@lead.90132', meta: 'Método Raíz + bonus · $147' },
      ]},
    ],
    automations: [
      { stage: 'Lead nuevo', trigger: 'Entrega del recurso + secuencia de 5 emails', state: 'active' },
      { stage: 'Landing sin compra', trigger: 'Remarketing a 48 h', state: 'active' },
      { stage: 'Carrito abandonado', trigger: 'Email a 1 h + 24 h', state: 'unset' },
      { stage: 'Comprado', trigger: 'Accesos + secuencia de activación', state: 'active' },
      { stage: 'Sin abrir en 14 d', trigger: 'Reactivación', state: 'unset' },
    ],
    // Sin llamadas no hay secuencia de confirmación.
    confirmSequence: null,
  },

  leads: {
    kpis: [
      { label: 'Listos para upsell', value: '87', hint: 'completaron el método', tone: 'highlight' },
      { label: 'Journey medio', value: '6 d', hint: 'de seguir a pagar' },
      { label: 'Recursos antes de comprar', value: '1.2', hint: 'media de los compradores' },
      { label: 'Conversaciones', value: '18,940', hint: 'en el periodo' },
    ],
    rows: [
      { handle: '@lead.90287', enteredBy: 'Reel · error', tags: 2, tagsTotal: 2, resources: 2, days: 5, stage: 'Landing', signal: 'reach-out' },
      { handle: '@lead.90201', enteredBy: 'Anuncio · resultado', tags: 2, tagsTotal: 2, resources: 1, days: 2, stage: 'Checkout', signal: 'hot' },
      { handle: '@lead.90188', enteredBy: 'Reel · contrario', tags: 2, tagsTotal: 2, resources: 1, days: 4, stage: 'Checkout', signal: 'hot' },
      { handle: '@lead.90355', enteredBy: 'Reel · error', tags: 1, tagsTotal: 2, resources: 1, days: 3, stage: 'Lead magnet', signal: 'warming' },
      { handle: '@lead.90408', enteredBy: 'Anuncio · historia', tags: 1, tagsTotal: 2, resources: 1, days: 1, stage: 'Nuevo', signal: 'cold' },
      { handle: '@lead.90412', enteredBy: 'Reel · resultado', tags: 1, tagsTotal: 2, resources: 0, days: 1, stage: 'Nuevo', signal: 'cold' },
    ],
    note: 'Seis días de journey contra 31 de la agencia. En low ticket la decisión es impulsiva: si el lead no compra en la primera semana, casi nunca compra. La secuencia se concentra ahí.',
  },

  ads: {
    currency: 'USD',
    kpis: [
      { label: 'Inversión', value: '$8,940', hint: 'en el periodo' },
      { label: 'CTR', value: '4.6%', delta: { value: '1.1', positive: true } },
      { label: 'Costo por lead', value: '$0.78', hint: '11,420 leads' },
      { label: 'Costo por compra', value: '$14.61', hint: '612 compras' },
      { label: 'ROAS', value: '6.6x', hint: '$59,364 facturado', tone: 'highlight' },
    ],
    campaigns: [
      { name: 'Error de 3 horas', angle: 'Error común', spend: 3980, ctr: 5.4, leads: 5210, bookings: null, closes: 291 },
      { name: 'Resultado en 7 días', angle: 'Resultado rápido', spend: 2610, ctr: 4.8, leads: 3340, bookings: null, closes: 178 },
      { name: 'Todo está mal', angle: 'Contrario', spend: 1620, ctr: 4.1, leads: 2010, bookings: null, closes: 113 },
      { name: 'Mi historia', angle: 'Historia personal', spend: 730, ctr: 2.2, leads: 860, bookings: null, closes: 30 },
    ],
    alert: null,
  },

  // El embudo de infoproducto no agenda llamadas.
  calls: null,

  team: {
    kpis: [
      { label: 'Roles activos', value: '4', hint: '2 editores · CM · soporte' },
      { label: 'Tareas abiertas', value: '11', hint: '4 vencidas', tone: 'alert' },
      { label: 'SOPs entregados', value: '15', hint: 'dentro del dashboard' },
      { label: 'Entregables del cliente', value: '1/4', hint: '3 pendientes', tone: 'alert' },
    ],
    columns: [
      { name: 'Cliente', cards: [
        { title: 'Grabar guiones 49 y 50', meta: 'Vencía anteayer', overdue: true },
        { title: 'Grabar tanda de cortos', meta: 'Vencía ayer', overdue: true },
        { title: 'Aprobar oferta de upsell', meta: 'Vence jueves' },
      ]},
      { name: 'Editor', cards: [
        { title: 'Guion 45 · corte final', meta: 'En revisión' },
        { title: 'Guion 46 · corto', meta: 'En revisión' },
        { title: 'Derivar 8 cortos del largo', meta: 'Sin empezar' },
      ]},
      { name: 'Vyma', cards: [
        { title: 'Setear carrito abandonado', meta: 'Bloquea $571 recuperables', highlight: true },
        { title: 'Setear reactivación a 14 días', meta: 'En curso' },
      ]},
      { name: 'Hecho', cards: [
        { title: 'Onboarding + estrategia', meta: 'Semana 1' },
        { title: '38 guiones entregados', meta: 'Semana 1' },
        { title: 'Landing + checkout', meta: 'Semana 2' },
      ]},
    ],
    panels: [
      { role: 'Editores (2)', metrics: [
        { label: 'Entregas a tiempo', display: '71%', pct: 71 },
        { label: 'Correcciones / pieza', display: '2.1', pct: 52 },
      ], note: 'El volumen diario les gana: 71% de entregas a tiempo es el número más bajo de las tres cuentas.' },
      { role: 'Community manager', metrics: [
        { label: 'Respuesta < 1 h', display: '61%', pct: 61 },
        { label: 'Publicaciones a hora', display: '89%', pct: 89 },
      ], note: '18,940 conversaciones en el periodo. Sin automatización de primer toque este rol no escala más.' },
    ],
    sops: [
      'Cómo hacer un guion corto — hook en 2 segundos',
      'Cómo derivar cortos de una pieza larga',
      'Cómo responder comentarios en volumen',
      'Cómo montar una secuencia de carrito abandonado',
    ],
    sopNote: 'En volumen alto los SOPs valen más que el talento: lo que no está escrito se hace distinto cada día.',
  },

  process: {
    capture: [
      { n: '01', title: 'Auditoría', detail: 'Promesa, avatar y precio de entrada', accent: true },
      { n: '02', title: 'Contenido', detail: 'Volumen diario en cuatro cuentas' },
      { n: '03', title: 'Publicación', detail: 'Pieza larga + cortos derivados' },
      { n: '04', title: 'Comentario', detail: 'Palabra clave dispara el recurso' },
      { n: '05', title: 'Lead magnet', detail: 'Entrega automática por DM' },
      { n: '06', title: 'Secuencia', detail: '5 emails en 7 días' },
      { n: '07', title: 'Landing', detail: 'Una sola oferta, sin llamada', accent: true },
      { n: '08', title: 'Checkout', detail: 'Pago directo $97' },
      { n: '09', title: 'Carrito', detail: 'Recuperación a 1 h y 24 h', alert: true },
      { n: '10', title: 'Compra', detail: 'Accesos inmediatos', accent: true },
    ],
    captureNote: 'No hay paso de setter ni de closer. El embudo no toca a una persona en ningún momento — por eso el CAC es $14.61 y no $243.',
    deliver: [
      { n: '11', title: 'Accesos', detail: 'Plataforma desde el minuto uno' },
      { n: '12', title: 'Activación', detail: 'Secuencia de los primeros 7 días' },
      { n: '13', title: 'Uso', detail: 'Se mide quién completa el método' },
      { n: '14', title: 'Reactivación', detail: 'Sin abrir en 14 días', alert: true },
      { n: '15', title: 'Upsell', detail: '87 completaron y son candidatos', accent: true },
    ],
    deliverNote: 'Los 87 que completaron el método son el activo más valioso de la cuenta y hoy no se les está ofreciendo nada.',
    funnelByClient: [
      { label: 'Low ticket', detail: 'sin llamada: directo a la landing.' },
      { label: 'Agencia', detail: 'no aplica a esta cuenta.' },
      { label: 'Consultoría', detail: 'candidata para el upsell de los 87.' },
    ],
    funnelNote: 'Si el upsell arranca, esta cuenta pasa a tener dos embudos a la vez y el pipeline necesita una segunda plantilla.',
    missing: [
      'Automatización de carrito abandonado — $571 sobre la mesa',
      'Oferta de upsell para los 87 que completaron',
      'Atribución de la compra a la pieza exacta',
      'Reactivación a 14 días sin abrir',
    ],
    openDecisions: [
      '¿El upsell es consultoría o un producto de mayor ticket?',
      '¿Se sube el precio de $97 o se agrega un bonus?',
      '¿Los cortos van a una cuenta propia o a la principal?',
    ],
  },

  data: {
    kpis: [
      { label: 'Flujos activos', value: '4', hint: 'de 5 previstos' },
      { label: 'Registros unificados', value: '48,206', hint: 'en el periodo' },
      { label: 'Latencia de sync', value: '2 min', hint: 'lectura continua' },
      { label: 'Herramientas visibles', value: '0', hint: 'todo se ve aquí dentro', tone: 'highlight' },
    ],
    flows: [
      { name: 'Publicación', provides: 'Piezas, cuentas, alcance y retención', lastRead: 'hace 2 min', state: 'active' },
      { name: 'Conversaciones', provides: 'Mensajes, palabras clave y recursos', lastRead: 'hace 2 min', state: 'active' },
      { name: 'Pauta', provides: 'Inversión, CTR y costo por resultado', lastRead: 'hace 9 min', state: 'active' },
      { name: 'Checkout', provides: 'Compras, carritos y facturación real', lastRead: 'hace 3 min', state: 'active' },
      { name: 'Plataforma', provides: 'Uso, progreso y quién completa', lastRead: null, state: 'disconnected' },
    ],
    buildOrder: [
      { n: 1, what: 'Checkout y carritos', why: 'Es la conversión: sin esto no hay CAC real' },
      { n: 2, what: 'Contenido + ángulo', why: 'Con 246 piezas hay que saber cuál repetir' },
      { n: 3, what: 'Uso de la plataforma', why: 'Define quién es candidato al upsell' },
      { n: 4, what: 'Secuencias de email', why: 'Es donde ocurre la venta, hoy a ciegas' },
      { n: 5, what: 'Capa de preguntas', why: 'Solo sirve con los datos ya limpios' },
    ],
  },

  assistant: {
    placeholder: '¿A quién le ofrezco el upsell?',
    suggestions: [
      '¿A quién le ofrezco el upsell?',
      '¿Qué ángulo repito esta semana?',
      '¿Cuánto pierdo por carrito abandonado?',
      '¿Qué campaña escalo?',
      '¿Por qué no funciona el tutorial largo?',
    ],
    note: 'Responde solo con los datos de esta cuenta. No cruza información con otros clientes de la agencia.',
  },
};
