import type { TenantDataset } from '@/lib/types';

/**
 * CLÍNICAS VIVE — consultoría de salud. Menos volumen, ticket más alto,
 * equipo chico. La objeción dominante es tiempo, no dinero.
 *
 *   198 agendas × 71% show = 141 llamadas × 31% cierre = 44 cierres
 *   $14,300 / 44 = $325 CAC · 44 × $5,800 = $255,200 revenue
 */
export const vive: TenantDataset = {
  content: {
    kpis: [
      { label: 'Piezas publicadas', value: '94', hint: 'en 3 cuentas' },
      { label: 'Retención 3 s', value: '54%', delta: { value: '2 pts', positive: false } },
      { label: 'Comentarios / vista', value: '1.12%', hint: 'audiencia muy activa' },
      { label: 'Ventas atribuidas', value: '38', hint: 'de 44 totales', tone: 'highlight' },
    ],
    angles: [
      { name: 'Educativo', value: 14, display: '14 ventas' },
      { name: 'Miedo / riesgo', value: 11, display: '11 ventas' },
      { name: 'Testimonio', value: 8, display: '8 ventas' },
      { name: 'Detrás de escena', value: 5, display: '5 ventas' },
      { name: 'Mito', value: 0, display: '0 ventas', tone: 'alert' },
    ],
    hcc: [
      { name: 'HOOK — 3 primeros s', value: 54, display: '54%' },
      { name: 'CONTEXTO — retención', value: 51, display: '51%' },
      { name: 'CTA — comentarios', value: 112, display: '1.12%' },
    ],
    pieces: [
      { id: 'p1', title: 'Lo que nadie te dice del diagnóstico', channel: '@clinica', angle: 'Educativo', pain: 'Miedo al procedimiento', hook3s: 71, comments: 1840, sales: 6, revenue: 34800 },
      { id: 'p2', title: 'Señales que no hay que ignorar', channel: '@clinica', angle: 'Miedo', pain: 'Posterga la consulta', hook3s: 68, comments: 1522, sales: 5, revenue: 29000 },
      { id: 'p3', title: 'Antes y después: 8 semanas', channel: '@clinica', angle: 'Testimonio', pain: 'Duda del resultado', hook3s: 64, comments: 1104, sales: 4, revenue: 23200 },
      { id: 'p4', title: 'Un día en consulta', channel: '@equipo', angle: 'Detrás de escena', pain: 'Desconfía del lugar', hook3s: 49, comments: 612, sales: 2, revenue: 11600 },
      { id: 'p5', title: 'Tres mitos del tratamiento', channel: '@clinica', angle: 'Mito', pain: 'Info equivocada', hook3s: 38, comments: 287, sales: 0, revenue: 0 },
    ],
  },

  calendar: {
    kpis: [
      { label: 'Programadas', value: '6', hint: 'esta semana' },
      { label: 'En edición', value: '2', hint: 'con el editor' },
      { label: 'Sin grabar', value: '0', hint: 'la semana está cubierta' },
      { label: 'Guiones en banco', value: '9', hint: 'entregados al cliente' },
    ],
    week: [
      { label: 'LUN', slots: [{ title: 'Guion 04 · señales', channel: '@clinica', meta: 'educativo · publicado', state: 'published' }] },
      { label: 'MAR', slots: [
        { title: 'Guion 05 · testimonio', channel: '@clinica', meta: 'testimonio · programado', state: 'scheduled' },
        { title: 'Historia · pregunta', channel: '@clinica', meta: '', state: 'idle' },
      ]},
      { label: 'MIÉ', slots: [{ title: 'Guion 06 · mito', channel: '@equipo', meta: 'mito · en edición', state: 'editing' }] },
      { label: 'JUE', slots: [{ title: 'Guion 07 · consulta', channel: '@clinica', meta: 'educativo · programado', state: 'scheduled' }] },
      { label: 'VIE', slots: [
        { title: 'Guion 08 · riesgo', channel: '@clinica', meta: 'miedo · programado', state: 'scheduled' },
        { title: 'Newsletter', channel: 'email', meta: '', state: 'idle' },
      ]},
      { label: 'SÁB', slots: [] },
      { label: 'DOM', slots: [] },
    ],
    note: 'Tres cuentas activas. El contenido de salud pasa por revisión clínica antes de programarse: ese paso vive como estado propio en el flujo.',
  },

  pipeline: {
    kpis: [
      { label: 'Leads activos', value: '312', hint: 'en pipeline' },
      { label: 'Agendas', value: '198', hint: 'en el periodo' },
      { label: 'Show rate', value: '71%', delta: { value: '9 pts', positive: true }, hint: 'tras los recordatorios' },
      { label: 'No reagendaron', value: '24', hint: 'recuperables' },
      { label: 'Cerrados', value: '44', hint: '$255,200', tone: 'highlight' },
    ],
    stages: [
      { name: 'Nuevo', cards: [
        { name: '@paciente.4821', meta: '1/3 etiquetas · 2 días' },
        { name: '@paciente.4833', meta: '1/3 etiquetas · 1 día' },
      ]},
      { name: 'Contactado', cards: [{ name: '@paciente.4790', meta: '2/3 etiquetas · 11 días' }] },
      { name: 'Seguimiento', cards: [{ name: '@paciente.4712', meta: '3/3 etiquetas · 28 días', hot: true }] },
      { name: 'Agendado', cards: [
        { name: '@paciente.4688', meta: '3/3 etiquetas · 34 días', hot: true },
        { name: '@paciente.4701', meta: '2/3 etiquetas · 21 días' },
      ]},
      { name: 'Cerrado', cards: [{ name: '@paciente.4655', meta: 'Programa 12 semanas' }] },
    ],
    automations: [
      { stage: 'Lead nuevo', trigger: 'Guía de preparación + etiqueta', state: 'active' },
      { stage: 'Sin respuesta', trigger: 'Secuencia de 2 toques', state: 'active' },
      { stage: 'Agendado', trigger: 'Confirmación + 2 recordatorios', state: 'active' },
      { stage: 'No asistió', trigger: 'Mensaje de reagenda', state: 'active' },
      { stage: 'Cerrado', trigger: 'Bienvenida + accesos + control a +7 días', state: 'unset' },
    ],
    confirmSequence: {
      steps: [
        { when: 'Al agendar', what: 'Confirmación + qué llevar' },
        { when: '24 h antes', what: 'Recordatorio' },
        { when: '2 h antes', what: 'Recordatorio + ubicación' },
      ],
      notes: [
        'Tres toques. El de 24 h existe porque la consulta es presencial y hay que reservar el traslado.',
        'Sin recordatorio de 5 min: no hay link, hay dirección.',
      ],
    },
  },

  leads: {
    kpis: [
      { label: 'Listos para reach out', value: '1', hint: 'tocó todas las etiquetas', tone: 'highlight' },
      { label: 'Journey medio', value: '19 d', hint: 'de seguir a pagar' },
      { label: 'Recursos antes de comprar', value: '1.6', hint: 'media de los cerrados' },
      { label: 'Conversaciones', value: '1,247', hint: 'en el periodo' },
    ],
    rows: [
      { handle: '@paciente.4712', enteredBy: 'Reel · señales', tags: 3, tagsTotal: 3, resources: 3, days: 28, stage: 'Seguimiento', signal: 'reach-out' },
      { handle: '@paciente.4688', enteredBy: 'Anuncio · riesgo', tags: 3, tagsTotal: 3, resources: 2, days: 34, stage: 'Agendado', signal: 'hot' },
      { handle: '@paciente.4701', enteredBy: 'Reel · testimonio', tags: 2, tagsTotal: 3, resources: 2, days: 21, stage: 'Agendado', signal: 'hot' },
      { handle: '@paciente.4790', enteredBy: 'Reel · señales', tags: 2, tagsTotal: 3, resources: 1, days: 11, stage: 'Contactado', signal: 'warming' },
      { handle: '@paciente.4821', enteredBy: 'Anuncio · educativo', tags: 1, tagsTotal: 3, resources: 1, days: 2, stage: 'Nuevo', signal: 'cold' },
      { handle: '@paciente.4833', enteredBy: 'Reel · mito', tags: 1, tagsTotal: 3, resources: 0, days: 1, stage: 'Nuevo', signal: 'cold' },
    ],
    note: 'El journey acá es la mitad de largo que en una agencia: el dolor es físico y la decisión no pasa por un socio. Menos recursos consumidos, más urgencia.',
  },

  ads: {
    currency: 'USD',
    kpis: [
      { label: 'Inversión', value: '$14,300', hint: 'en el periodo' },
      { label: 'CTR', value: '2.1%', delta: { value: '0.4', positive: false } },
      { label: 'Costo por lead', value: '$6.56', hint: '2,180 leads' },
      { label: 'Costo por agenda', value: '$72', hint: '198 agendas' },
      { label: 'Costo por paciente', value: '$325', hint: 'ROAS 17.8x', tone: 'highlight' },
    ],
    campaigns: [
      { name: 'Señales de alerta', angle: 'Miedo', spend: 6420, ctr: 2.8, leads: 980, bookings: 92, closes: 21 },
      { name: 'Guía de preparación', angle: 'Educativo', spend: 4310, ctr: 2.3, leads: 690, bookings: 61, closes: 14 },
      { name: 'Antes y después', angle: 'Testimonio', spend: 2480, ctr: 1.9, leads: 372, bookings: 33, closes: 9 },
      { name: 'Mitos', angle: 'Mito', spend: 1090, ctr: 0.9, leads: 138, bookings: 12, closes: 0 },
    ],
    alert: 'El CTR global bajó 0.4 puntos. La campaña "Mitos" arrastra el promedio con 0.9% y cero cierres.',
  },

  calls: {
    kpis: [
      { label: 'Llamadas tomadas', value: '141', hint: 'diagnóstico presencial' },
      { label: 'Cierre global', value: '31%', delta: { value: '3 pts', positive: true } },
      { label: 'Objeción dominante', value: '34%', hint: 'TIEMPO / AGENDA de las perdidas' },
      { label: 'Ticket medio', value: '$5,800', hint: 'programa completo' },
    ],
    closers: [
      { name: 'Yamil', calls: 61, closes: 23, topObjection: 'Tiempo — 29%', action: { label: 'OK', tone: 'ok' } },
      { name: 'Closer 1', calls: 80, closes: 21, topObjection: 'Tiempo — 41%', action: { label: 'Seguimiento', tone: 'watch' } },
    ],
    objections: [
      { name: 'Tiempo / agenda', value: 34, display: '34%', tone: 'alert' },
      { name: 'Dinero / precio', value: 27, display: '27%' },
      { name: 'Miedo al proceso', value: 22, display: '22%' },
      { name: 'Consultar en casa', value: 12, display: '12%' },
      { name: 'Otra', value: 5, display: '5%' },
    ],
    recent: [
      { date: '21 AGO', prospect: '@paciente.4655', product: 'Programa 12 semanas', who: 'Yamil', broughtBy: 'Reel señales', result: 'won', resultLabel: 'Cerró' },
      { date: '21 AGO', prospect: '@paciente.4688', product: 'Programa 12 semanas', who: 'Closer 1', broughtBy: 'Anuncio riesgo', result: 'follow-up', resultLabel: 'Seguimiento' },
      { date: '20 AGO', prospect: '@paciente.4701', product: 'Programa 8 semanas', who: 'Closer 1', broughtBy: 'Testimonio', result: 'objection', resultLabel: 'Objeción tiempo' },
      { date: '20 AGO', prospect: '@paciente.4712', product: 'Programa 12 semanas', who: 'Yamil', broughtBy: 'Reel señales', result: 'won', resultLabel: 'Cerró' },
      { date: '19 AGO', prospect: '@paciente.4790', product: 'Programa 8 semanas', who: 'Closer 1', broughtBy: 'Reel señales', result: 'no-show', resultLabel: 'No asistió' },
    ],
    insight: 'La objeción es tiempo, no precio. Con ticket alto y cierre del 31%, el problema no es la oferta: es que el horario de consulta no entra en la agenda del paciente. Probá franjas fuera de horario laboral antes de tocar el precio.',
  },

  team: {
    kpis: [
      { label: 'Roles activos', value: '2', hint: 'editor · CM' },
      { label: 'Tareas abiertas', value: '4', hint: 'ninguna vencida' },
      { label: 'SOPs entregados', value: '8', hint: 'dentro del dashboard' },
      { label: 'Entregables del cliente', value: '4/4', hint: 'al día' },
    ],
    columns: [
      { name: 'Cliente', cards: [{ title: 'Aprobar guiones 09 y 10', meta: 'Vence miércoles' }] },
      { name: 'Editor', cards: [
        { title: 'Guion 06 · corte final', meta: 'En revisión' },
        { title: 'Subtítulos de la serie', meta: 'Pendiente' },
      ]},
      { name: 'Vyma', cards: [{ title: 'Setear cierre + control a 7 días', meta: 'En curso', highlight: true }] },
      { name: 'Hecho', cards: [
        { title: 'Onboarding + estrategia', meta: 'Semana 1' },
        { title: '9 guiones entregados', meta: 'Semana 2' },
        { title: 'Revisión clínica como estado', meta: 'Semana 2' },
      ]},
    ],
    panels: [
      { role: 'Editor', metrics: [
        { label: 'Entregas a tiempo', display: '94%', pct: 94 },
        { label: 'Correcciones / pieza', display: '0.8', pct: 20 },
      ], note: 'Menos correcciones que la media: el guion clínico va muy cerrado desde el origen.' },
      { role: 'Community manager', metrics: [
        { label: 'Respuesta < 1 h', display: '88%', pct: 88 },
        { label: 'Publicaciones a hora', display: '97%', pct: 97 },
      ], note: 'Las consultas por DM llegan con dudas médicas: el CM deriva y nunca responde clínicamente.' },
    ],
    sops: [
      'Cómo hacer un guion clínico — qué se puede afirmar',
      'Revisión clínica — quién aprueba y en qué plazo',
      'Cómo derivar una consulta médica por DM',
      'Cómo pedir y usar un testimonio con consentimiento',
    ],
    sopNote: 'El SOP de consentimiento no es opcional: publicar un testimonio sin él expone a la clínica.',
  },

  process: {
    capture: [
      { n: '01', title: 'Auditoría', detail: 'Especialidad, paciente ideal, zona y competencia', accent: true },
      { n: '02', title: 'Contenido', detail: 'Educativo y testimonial con revisión clínica' },
      { n: '03', title: 'Revisión', detail: 'Aprobación médica antes de publicar', alert: true },
      { n: '04', title: 'Publicación', detail: 'Tres cuentas, misma pieza' },
      { n: '05', title: 'Consulta por DM', detail: 'Nace el lead con su etiqueta' },
      { n: '06', title: 'Recepción', detail: 'Deriva y agenda · lo cubre el CM' },
      { n: '07', title: 'Pipeline', detail: 'Etapa y etiquetas del paciente' },
      { n: '08', title: 'Agenda', detail: 'Diagnóstico presencial', accent: true },
      { n: '09', title: 'Confirma', detail: 'Al agendar, 24 h y 2 h' },
      { n: '10', title: 'Cierre', detail: 'Se propone el programa y se vende', accent: true },
    ],
    captureNote: 'El paso 03 no existe en una agencia y acá es obligatorio: nada se publica sin aprobación clínica.',
    deliver: [
      { n: '11', title: 'Pago', detail: 'Primera cuota o pago completo' },
      { n: '12', title: 'Accesos', detail: 'Plan y material del programa' },
      { n: '13', title: 'Primera sesión', detail: 'Dentro de los 7 días' },
      { n: '14', title: 'Control', detail: 'Seguimiento a los 7 días', alert: true },
      { n: '15', title: 'Alta', detail: 'Cierre del programa y testimonio', accent: true },
    ],
    deliverNote: 'El testimonio del paso 15 vuelve a entrar como contenido en el paso 02. Es el único bucle cerrado del sistema.',
    funnelByClient: [
      { label: 'Consultoría', detail: 'diagnóstico presencial y cierre en consulta.' },
      { label: 'Agencia', detail: 'no aplica a esta cuenta.' },
      { label: 'Low ticket', detail: 'no aplica a esta cuenta.' },
    ],
    funnelNote: 'Esta cuenta usa el embudo de consultoría. Las etapas del pipeline se sembraron con esa plantilla.',
    missing: [
      'Confirmación de asistencia por WhatsApp',
      'Atribución del testimonio a la venta que produjo',
      'Automatización de cierre + control a 7 días',
    ],
    openDecisions: [
      '¿El control a 7 días lo agenda el sistema o la recepción?',
      '¿Se abre una franja fuera de horario laboral?',
      '¿Los testimonios entran con rostro o anonimizados?',
    ],
  },

  data: {
    kpis: [
      { label: 'Flujos activos', value: '4', hint: 'de 5 previstos' },
      { label: 'Registros unificados', value: '5,918', hint: 'en el periodo' },
      { label: 'Latencia de sync', value: '6 min', hint: 'lectura continua' },
      { label: 'Herramientas visibles', value: '0', hint: 'todo se ve aquí dentro', tone: 'highlight' },
    ],
    flows: [
      { name: 'Publicación', provides: 'Piezas, cuentas, alcance y retención', lastRead: 'hace 6 min', state: 'active' },
      { name: 'Conversaciones', provides: 'Mensajes, etiquetas y recursos entregados', lastRead: 'hace 6 min', state: 'active' },
      { name: 'Pauta', provides: 'Inversión, CTR y costo por resultado', lastRead: 'hace 18 min', state: 'active' },
      { name: 'Agenda', provides: 'Citas, asistencia y reagendas', lastRead: 'hace 11 min', state: 'active' },
      { name: 'Pagos', provides: 'Cuotas, programa y facturación real', lastRead: null, state: 'pending' },
    ],
    buildOrder: [
      { n: 1, what: 'Agenda y asistencia', why: 'El show rate es la métrica que más mueve el resultado acá' },
      { n: 2, what: 'Contenido + revisión clínica', why: 'Sin el estado de aprobación el calendario miente' },
      { n: 3, what: 'Etiquetas por paciente', why: 'Distingue duda médica de intención de compra' },
      { n: 4, what: 'Inversión y costos', why: 'Cierra el cálculo de costo por paciente' },
      { n: 5, what: 'Capa de preguntas', why: 'Solo sirve con los datos ya limpios' },
    ],
  },

  assistant: {
    placeholder: '¿Por qué se pierden las consultas?',
    suggestions: [
      '¿Por qué se pierden las consultas?',
      '¿Qué contenido trae pacientes?',
      '¿Cuánto tarda un paciente en decidir?',
      '¿Qué campaña apago?',
      '¿Qué horario conviene abrir?',
    ],
    note: 'Responde solo con los datos de esta cuenta. No cruza información con otros clientes de la agencia.',
  },
};
