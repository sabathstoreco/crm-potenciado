import type { TenantDataset } from '@/lib/types';

/**
 * VYMA MEDIA — agencia de implementación. Ticket alto, closers, pipeline completo.
 *
 * Los números reconcilian entre pantallas:
 *   467 agendas × 72% show = 336 llamadas × 33% cierre = 111 cierres
 *   $27,018 / 111 = $243 CAC · 111 × $3,243 = $359,973 revenue
 *   Σ ventas por ángulo = 77 atribuidas (de 111 totales; el resto sin atribuir)
 */
export const vyma: TenantDataset = {
  members: [
    { name: 'Mariana Soto', email: 'mariana@vyma.demo', role: 'owner', roleLabel: 'Owner', lastSeen: 'hace 12 min', mfa: true },
    { name: 'Yamil', email: 'admin@yamilos.demo', role: 'manager', roleLabel: 'Manager', lastSeen: 'ahora', mfa: true },
    { name: 'Bruno Iriarte', email: 'bruno@vyma.demo', role: 'editor', roleLabel: 'Editor', lastSeen: 'hace 3 h', mfa: false },
    { name: 'Lucía Ferrer', email: 'lucia@vyma.demo', role: 'community_manager', roleLabel: 'Community manager', lastSeen: 'hace 1 h', mfa: false },
    { name: 'Closer 1', email: 'closer1@vyma.demo', role: 'closer', roleLabel: 'Closer', lastSeen: 'hace 40 min', mfa: false },
    { name: 'Closer 2', email: 'closer2@vyma.demo', role: 'closer', roleLabel: 'Closer', lastSeen: 'ayer', mfa: false },
  ],
  content: {
    kpis: [
      { label: 'Piezas publicadas', value: '182', hint: 'en 5 cuentas' },
      { label: 'Retención 3 s', value: '61%', delta: { value: '5 pts', positive: true } },
      { label: 'Comentarios / vista', value: '0.74%', hint: 'el CTA está funcionando' },
      { label: 'Ventas atribuidas', value: '77', hint: 'de 111 totales', tone: 'highlight' },
    ],
    angles: [
      { name: 'Autoridad', value: 31, display: '31 ventas' },
      { name: 'Dolor directo', value: 22, display: '22 ventas' },
      { name: 'Prueba / caso', value: 15, display: '15 ventas' },
      { name: 'Comunidad', value: 9, display: '9 ventas' },
      { name: 'Contrario', value: 0, display: '0 ventas', tone: 'alert' },
    ],
    hcc: [
      { name: 'HOOK — 3 primeros s', value: 61, display: '61%' },
      { name: 'CONTEXTO — retención', value: 47, display: '47%' },
      { name: 'CTA — comentarios', value: 74, display: '0.74%' },
    ],
    pieces: [
      { id: 'p1', title: 'El sistema completo en 60s', channel: '@marca', angle: 'Autoridad', pain: 'No entiende el proceso', hook3s: 78, comments: 2576, sales: 9, revenue: 273600 },
      { id: 'p2', title: 'Por qué tu agencia no escala', channel: '@marca', angle: 'Dolor', pain: 'Techo operativo', hook3s: 72, comments: 1827, sales: 7, revenue: 210900 },
      { id: 'p3', title: 'Caso: de 25K a 80K', channel: '@marca', angle: 'Prueba', pain: 'Duda del resultado', hook3s: 69, comments: 1391, sales: 6, revenue: 176700 },
      { id: 'p4', title: 'Contratar sin quemar dinero', channel: '@equipo', angle: 'Autoridad', pain: 'Contrata mal', hook3s: 63, comments: 858, sales: 4, revenue: 116850 },
      { id: 'p5', title: 'La reunión que eliminé', channel: '@marca', angle: 'Comunidad', pain: 'Reuniones inútiles', hook3s: 44, comments: 348, sales: 1, revenue: 25650 },
    ],
  },

  calendar: {
    kpis: [
      { label: 'Programadas', value: '11', hint: 'esta semana' },
      { label: 'En edición', value: '3', hint: 'con el editor' },
      { label: 'Sin grabar', value: '2', hint: 'bloquean jueves y viernes', tone: 'alert' },
      { label: 'Guiones en banco', value: '15', hint: 'entregados al cliente' },
    ],
    week: [
      { label: 'LUN', slots: [
        { title: 'Guion 07 · precio', channel: '@principal', meta: 'autoridad · publicado', state: 'published' },
        { title: 'Historia · encuesta', channel: '@principal', meta: '', state: 'idle' },
      ]},
      { label: 'MAR', slots: [
        { title: 'Guion 08 · caso', channel: '@principal', meta: 'prueba · programado', state: 'scheduled' },
        { title: 'Repost', channel: '@secundaria', meta: '', state: 'idle' },
      ]},
      { label: 'MIÉ', slots: [
        { title: 'Guion 09 · error común', channel: '@secundaria', meta: 'dolor · en edición', state: 'editing' },
      ]},
      { label: 'JUE', slots: [
        { title: 'Guion 10 · sistema', channel: '@principal', meta: 'SIN GRABAR', state: 'blocked' },
        { title: 'Newsletter', channel: 'email', meta: '', state: 'idle' },
      ]},
      { label: 'VIE', slots: [
        { title: 'Guion 11 · pregunta', channel: '@principal', meta: 'SIN GRABAR', state: 'blocked' },
      ]},
      { label: 'SÁB', slots: [
        { title: 'Solo historias', channel: '@principal', meta: '', state: 'idle' },
      ]},
      { label: 'DOM', slots: [] },
    ],
    note: 'Antes de crear cualquier pieza el sistema pregunta a qué cuenta va. Sin ese campo, el calendario y las métricas de multicuenta no sirven.',
  },

  pipeline: {
    kpis: [
      { label: 'Leads activos', value: '843', hint: 'en pipeline' },
      { label: 'Agendas', value: '467', hint: 'en el periodo' },
      { label: 'Show rate', value: '72%', delta: { value: '17 pts', positive: true }, hint: 'tras los recordatorios' },
      { label: 'No reagendaron', value: '52', hint: 'recuperables' },
      { label: 'Cerrados', value: '111', hint: '$359,973', tone: 'highlight' },
    ],
    stages: [
      { name: 'Nuevo', cards: [{ name: '@estetica.lux', meta: '1/4 etiquetas · 5 días' }] },
      { name: 'Contactado', cards: [
        { name: '@franquicia.nube', meta: '3/4 etiquetas · 38 días' },
        { name: '@fitpro.center', meta: '2/4 etiquetas · 19 días' },
      ]},
      { name: 'Seguimiento', cards: [
        { name: '@grupo.altamar', meta: '4/4 etiquetas · 54 días', hot: true },
        { name: '@inmob.torres', meta: '4/4 etiquetas · 61 días', hot: true },
      ]},
      { name: 'Agendado', cards: [{ name: '@clinicas.vive', meta: '4/4 etiquetas · 97 días', hot: true }] },
      { name: 'Cerrado', cards: [
        { name: '@clinicas.vive', meta: 'Agencia $10K/mes' },
        { name: '@grupo.altamar', meta: 'Agencia $10K/mes' },
      ]},
    ],
    automations: [
      { stage: 'Lead nuevo', trigger: 'Recurso + etiqueta + tarea a 24 h', state: 'active' },
      { stage: 'Sin respuesta', trigger: 'Secuencia de 3 toques', state: 'active' },
      { stage: 'Agendado', trigger: 'Confirmación + 3 recordatorios', state: 'active' },
      { stage: 'No asistió', trigger: 'Mensaje de reagenda', state: 'unset' },
      { stage: 'Cerrado', trigger: 'Thank you page + accesos + llamada a +2 días', state: 'active' },
    ],
    confirmSequence: {
      steps: [
        { when: 'Al agendar', what: 'Pide confirmar al 100%' },
        { when: '5 h antes', what: 'Recordatorio' },
        { when: '1 h antes', what: 'Recordatorio' },
        { when: '5 min', what: 'Entra al link' },
      ],
      notes: [
        'Cuatro toques y no hace falta nada más. Va por SMS o email sin que nadie del equipo lo toque.',
        'Dictaste 12 h y lo corregiste a 5 h. Queda en 5 h.',
      ],
    },
  },

  leads: {
    kpis: [
      { label: 'Listos para reach out', value: '3', hint: 'tocaron todas las etiquetas', tone: 'highlight' },
      { label: 'Journey medio', value: '31 d', hint: 'de seguir a pagar' },
      { label: 'Recursos antes de comprar', value: '2.8', hint: 'media de los cerrados' },
      { label: 'Conversaciones', value: '4,013', hint: 'en el periodo' },
    ],
    rows: [
      { handle: '@grupo.altamar', enteredBy: 'Reel · sistema', tags: 4, tagsTotal: 4, resources: 4, days: 54, stage: 'Seguimiento', signal: 'reach-out' },
      { handle: '@clinicas.vive', enteredBy: 'Anuncio · dolor', tags: 4, tagsTotal: 4, resources: 4, days: 97, stage: 'Agendado', signal: 'reach-out' },
      { handle: '@inmob.torres', enteredBy: 'Caso 25K a 80K', tags: 4, tagsTotal: 4, resources: 3, days: 61, stage: 'Seguimiento', signal: 'reach-out' },
      { handle: '@franquicia.nube', enteredBy: 'Reel · contratar', tags: 3, tagsTotal: 4, resources: 2, days: 38, stage: 'Contactado', signal: 'hot' },
      { handle: '@fitpro.center', enteredBy: 'Reel · sistema', tags: 2, tagsTotal: 4, resources: 2, days: 19, stage: 'Contactado', signal: 'warming' },
      { handle: '@estetica.lux', enteredBy: 'Anuncio · caso', tags: 1, tagsTotal: 4, resources: 1, days: 5, stage: 'Nuevo', signal: 'cold' },
    ],
    note: 'La regla que ya usás, automatizada: si una persona tocó todas las etiquetas, sube arriba y el sistema avisa. Es el dinero que hoy está sobre la mesa sin que nadie lo vea.',
  },

  ads: {
    currency: 'USD',
    kpis: [
      { label: 'Inversión', value: '$27,018', hint: 'en el periodo' },
      { label: 'CTR', value: '2.9%', delta: { value: '0.3', positive: true } },
      { label: 'Costo por lead', value: '$4.02', hint: '6,729 leads' },
      { label: 'Costo por agenda', value: '$58', hint: '467 agendas' },
      { label: 'Costo por cliente', value: '$243', hint: 'ROAS 13.3x', tone: 'highlight' },
    ],
    campaigns: [
      { name: 'Sistema completo', angle: 'Autoridad', spend: 11742, ctr: 3.8, leads: 3146, bookings: 211, closes: 51 },
      { name: 'No escala', angle: 'Dolor', spend: 8578, ctr: 3.1, leads: 2029, bookings: 140, closes: 37 },
      { name: 'Caso 25K a 80K', angle: 'Prueba', spend: 4959, ctr: 2.4, leads: 1134, bookings: 88, closes: 23 },
      { name: 'Reuniones', angle: 'Comunidad', spend: 1739, ctr: 1.1, leads: 420, bookings: 28, closes: 0 },
    ],
    alert: 'La campaña "Reuniones" lleva $1,739 sin un solo cierre. El sistema avisa solo a los $500 sin conversión.',
  },

  calls: {
    kpis: [
      { label: 'Llamadas tomadas', value: '336', hint: 'diagnóstico + infoproducto' },
      { label: 'Cierre global', value: '33%', delta: { value: '4 pts', positive: true } },
      { label: 'Objeción dominante', value: '39%', hint: 'DINERO / PRECIO de las perdidas' },
      { label: 'Ticket medio', value: '$3,243', hint: 'mezcla de productos' },
    ],
    closers: [
      { name: 'Yamil', calls: 83, closes: 37, topObjection: 'Socio — 22%', action: { label: 'OK', tone: 'ok' } },
      { name: 'Closer 1', calls: 142, closes: 44, topObjection: 'Tiempo — 38%', action: { label: 'Seguimiento', tone: 'watch' } },
      { name: 'Closer 2', calls: 111, closes: 30, topObjection: 'Dinero — 52%', action: { label: 'Workbook precio', tone: 'alert' } },
    ],
    objections: [
      { name: 'Dinero / precio', value: 39, display: '39%', tone: 'alert' },
      { name: 'Tiempo', value: 31, display: '31%' },
      { name: 'Socio / pareja', value: 14, display: '14%' },
      { name: 'No es el momento', value: 11, display: '11%' },
      { name: 'Otra', value: 5, display: '5%' },
    ],
    recent: [
      { date: '21 AGO', prospect: '@clinicas.vive', product: 'Agencia $10K/mes', who: 'Closer 1', broughtBy: 'Reel sistema', result: 'won', resultLabel: 'Cerró' },
      { date: '21 AGO', prospect: '@inmob.torres', product: 'Agencia $4K/mes', who: 'Closer 2', broughtBy: 'Caso', result: 'objection', resultLabel: 'Objeción dinero' },
      { date: '20 AGO', prospect: '@grupo.altamar', product: 'Agencia $10K/mes', who: 'Yamil', broughtBy: 'Reel sistema', result: 'won', resultLabel: 'Cerró' },
      { date: '20 AGO', prospect: '@fitpro.center', product: 'Agencia $4K/mes', who: 'Closer 1', broughtBy: 'Anuncio dolor', result: 'follow-up', resultLabel: 'Seguimiento' },
      { date: '19 AGO', prospect: '@estetica.lux', product: 'Agencia $4K/mes', who: 'Closer 2', broughtBy: 'Caso', result: 'no-show', resultLabel: 'No asistió' },
    ],
    insight: 'Si la objeción de precio se repite en todo el equipo, el problema no es el closer: el contenido no está subiendo la conciencia antes de la llamada.',
  },

  team: {
    kpis: [
      { label: 'Roles activos', value: '3', hint: 'editor · CM · closer' },
      { label: 'Tareas abiertas', value: '7', hint: '2 vencidas', tone: 'alert' },
      { label: 'SOPs entregados', value: '12', hint: 'dentro del dashboard' },
      { label: 'Entregables del cliente', value: '2/4', hint: '2 pendientes', tone: 'alert' },
    ],
    columns: [
      { name: 'Cliente', cards: [
        { title: 'Grabar guiones 10 y 11', meta: 'Vencía ayer', overdue: true },
        { title: 'Enviar cifras de ventas', meta: 'Vence lunes' },
      ]},
      { name: 'Editor', cards: [
        { title: 'Guion 09 · corte final', meta: 'En revisión' },
        { title: 'Derivar carrusel', meta: 'Del reel del lunes' },
      ]},
      { name: 'Vyma', cards: [
        { title: 'Setear automatización "no asistió"', meta: 'En curso', highlight: true },
        { title: 'Conectar el pipeline', meta: 'Bloquea métricas de cierre' },
        { title: 'Workbook objeción precio', meta: 'Para el closer con más caídas' },
      ]},
      { name: 'Hecho', cards: [
        { title: 'Onboarding + estrategia', meta: 'Semana 1' },
        { title: '15 guiones entregados', meta: 'Semana 1' },
      ]},
    ],
    panels: [
      { role: 'Editor', metrics: [
        { label: 'Entregas a tiempo', display: '86%', pct: 86 },
        { label: 'Correcciones / pieza', display: '1.2', pct: 30 },
      ], note: 'Panel propio: qué edita, con qué formato, contra qué guion y con qué plazo.' },
      { role: 'Community manager', metrics: [
        { label: 'Respuesta < 1 h', display: '74%', pct: 74 },
        { label: 'Publicaciones a hora', display: '92%', pct: 92 },
      ], note: 'Publicación multicuenta, comentarios y respuesta de las conversaciones.' },
    ],
    sops: [
      'Cómo hacer un guion — hook · contexto · CTA',
      'Cómo hacer contenido — grabación y ritmo',
      'Cómo contratar — perfil, prueba y pago',
      'Cómo corregir — qué se revisa y cada cuánto',
    ],
    sopNote: 'Vyma ayuda a conseguir a esas personas y después entra solo como consultor.',
  },

  process: {
    capture: [
      { n: '01', title: 'Auditoría', detail: 'Posicionamiento, cliente ideal, negocio, validación del mercado', accent: true },
      { n: '02', title: 'Contenido', detail: 'Reels medidos por hook, contexto y CTA' },
      { n: '03', title: 'Publicación', detail: 'La misma pieza en todas las redes' },
      { n: '04', title: 'Comentario', detail: 'Nace el lead y su etiqueta' },
      { n: '05', title: 'Conversación', detail: 'Recurso, secuencia y etiquetas' },
      { n: '06', title: 'Setter', detail: 'Decide si vale agendar · hoy no existe', alert: true },
      { n: '07', title: 'Pipeline', detail: 'Dónde está y cuántas etiquetas tocó' },
      { n: '08', title: 'Agenda', detail: 'Diagnóstico $12K o infoproducto $5K', accent: true },
      { n: '09', title: 'Confirma', detail: 'Al agendar, 5 h, 1 h y 5 min' },
      { n: '10', title: 'Cierre', detail: 'Se desmenuza el negocio y se vende', accent: true },
    ],
    captureNote: 'El paso 06 es el único que hoy depende de alguien que no está contratado. Mientras tanto lo cubren la automatización y vos.',
    deliver: [
      { n: '11', title: 'Pago', detail: 'Dispara la thank you page' },
      { n: '12', title: 'Accesos', detail: 'Dashboard desde el minuto uno' },
      { n: '13', title: 'Plan de ruta', detail: '4 tareas y video con los entregables' },
      { n: '14', title: '+2 días', detail: 'El calendario bloquea 48 h para planificar la estrategia', alert: true },
      { n: '15', title: 'Onboarding', detail: 'Él llega con entregables, vos con la estructura', accent: true },
    ],
    deliverNote: 'Después del 15 el cliente entra al producto y todo lo que hace vuelve a alimentar estas mismas pantallas.',
    funnelByClient: [
      { label: 'Agencia', detail: 'implementación total, pipeline completo.' },
      { label: 'Consultoría', detail: 'diagnóstico y cierre en llamada.' },
      { label: 'Low ticket', detail: 'sin llamada: directo a la landing.' },
    ],
    funnelNote: 'El embudo se decide antes de montar el pipeline, no después.',
    missing: [
      'No hay setter contratado',
      'El closer no entra todavía en consultoría',
      'Atribución venta ↔ pieza exacta',
      'Plantilla de pipeline por tipo de embudo',
    ],
    openDecisions: [
      '¿Recordatorio de 12 h además del de 5 h?',
      '¿El cliente escribe aquí o solo Vyma?',
      '¿Multicuenta con filtro o vista por cuenta?',
      '¿El infoproducto entra en la fase 1?',
    ],
  },

  data: {
    kpis: [
      { label: 'Flujos activos', value: '3', hint: 'de 5 previstos' },
      { label: 'Registros unificados', value: '13,644', hint: 'en el periodo' },
      { label: 'Latencia de sync', value: '4 min', hint: 'lectura continua' },
      { label: 'Herramientas visibles', value: '0', hint: 'todo se ve aquí dentro', tone: 'highlight' },
    ],
    flows: [
      { name: 'Publicación', provides: 'Piezas, cuentas, alcance y retención', lastRead: 'hace 4 min', state: 'active' },
      { name: 'Conversaciones', provides: 'Mensajes, etiquetas y recursos entregados', lastRead: 'hace 4 min', state: 'active' },
      { name: 'Pauta', provides: 'Inversión, CTR y costo por resultado', lastRead: 'hace 22 min', state: 'active' },
      { name: 'Pipeline', provides: 'Etapas, llamadas y cierres', lastRead: null, state: 'disconnected' },
      { name: 'Pagos', provides: 'Cobros, PIF/PIH y facturación real', lastRead: null, state: 'pending' },
    ],
    buildOrder: [
      { n: 1, what: 'Contenido + ángulo y dolor', why: 'Es lo que ya decidís a diario y no está en ningún sitio' },
      { n: 2, what: 'Etiquetas y recursos por lead', why: 'Es el dinero que hoy queda en la mesa' },
      { n: 3, what: 'Pipeline y llamadas', why: 'Sin esto no hay costo por agenda ni cierre reales' },
      { n: 4, what: 'Inversión y costos', why: 'Cierra el cálculo de CAC' },
      { n: 5, what: 'Capa de preguntas', why: 'Solo sirve con los datos ya limpios' },
    ],
  },

  assistant: {
    placeholder: '¿Qué ángulo debo repetir este mes?',
    suggestions: [
      '¿Qué ángulo debo repetir?',
      '¿A quién le escribo hoy?',
      '¿Por qué subió el show rate?',
      '¿Qué campaña apago?',
      '¿Qué contenido vendió más?',
    ],
    note: 'Todo esto ya funciona en la fase MCP: lee las mismas fuentes conectadas, sin construir producto todavía.',
  },
};
