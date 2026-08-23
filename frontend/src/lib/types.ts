/**
 * Formas de datos del dashboard.
 *
 * Los KPI usan una forma común en vez de campos fijos por pantalla: el tipo de
 * embudo cambia qué se mide. Un infoproducto no tiene agendas ni show rate, y
 * forzar esos campos obligaría a inventar ceros que el usuario leería como
 * "está en cero" en lugar de "no aplica".
 */

export type FunnelType = 'agency' | 'consulting' | 'infoproduct';
export type Period = '7d' | '30d' | '90d' | 'year';
export type PlatformRole = 'none' | 'admin' | 'dev';
export type AccountRole =
  | 'owner'
  | 'manager'
  | 'editor'
  | 'community_manager'
  | 'setter'
  | 'closer'
  | 'viewer';

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  /** Color de marca del cliente. Se usa SOLO como fondo — DESIGN.md §13.2 */
  color: string;
  funnelType: FunnelType;
  funnelLabel: string;
  currency: string;
  channels: number;
  /** Qué módulos aplican. Un infoproducto no tiene llamadas ni closers. */
  modules: { calls: boolean; closers: boolean; checkout: boolean };
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  platformRole: PlatformRole;
  accountRole: AccountRole;
  tenantIds: string[];
};

export type Session = { user: Omit<User, 'password'>; activeTenantId: string };

/** KPI de cabecera. `tone: 'highlight'` invierte el fondo para el número clave. */
export type Kpi = {
  label: string;
  value: string;
  hint?: string;
  delta?: { value: string; positive: boolean };
  tone?: 'default' | 'alert' | 'highlight';
};

/** Fila de barra horizontal comparativa. */
export type BarRow = {
  name: string;
  value: number;
  /** Texto a la derecha. Si falta se muestra el valor crudo. */
  display?: string;
  tone?: 'default' | 'alert';
};

/* ── Contenido ─────────────────────────────────────────────── */

export type ContentPiece = {
  id: string;
  title: string;
  channel: string;
  angle: string;
  pain: string;
  hook3s: number;
  comments: number;
  sales: number;
  revenue: number;
};

export type ContentData = {
  kpis: Kpi[];
  angles: BarRow[];
  hcc: BarRow[];
  pieces: ContentPiece[];
};

/* ── Calendario ────────────────────────────────────────────── */

export type SlotState = 'published' | 'scheduled' | 'editing' | 'blocked' | 'idle';
export type CalendarSlot = { title: string; channel: string; meta: string; state: SlotState };
export type CalendarDay = { label: string; slots: CalendarSlot[] };

export type CalendarData = {
  kpis: Kpi[];
  week: CalendarDay[];
  note: string;
};

/* ── Pipeline ──────────────────────────────────────────────── */

export type PipelineCard = { name: string; meta: string; hot?: boolean };
export type PipelineStage = { name: string; cards: PipelineCard[] };
export type Automation = { stage: string; trigger: string; state: 'active' | 'unset' };
export type ConfirmStep = { when: string; what: string };

export type PipelineData = {
  kpis: Kpi[];
  stages: PipelineStage[];
  automations: Automation[];
  /** null cuando el embudo no agenda llamadas. */
  confirmSequence: { steps: ConfirmStep[]; notes: string[] } | null;
};

/* ── Leads y journey ───────────────────────────────────────── */

export type LeadSignal = 'reach-out' | 'hot' | 'warming' | 'cold';

export type LeadRow = {
  handle: string;
  enteredBy: string;
  tags: number;
  tagsTotal: number;
  resources: number;
  days: number;
  stage: string;
  signal: LeadSignal;
};

export type LeadsData = { kpis: Kpi[]; rows: LeadRow[]; note: string };

/* ── Ads ───────────────────────────────────────────────────── */

export type Campaign = {
  name: string;
  angle: string;
  spend: number;
  ctr: number;
  leads: number;
  /** null cuando el embudo no agenda: se muestra "—". */
  bookings: number | null;
  closes: number;
};

export type AdsData = {
  kpis: Kpi[];
  campaigns: Campaign[];
  currency: string;
  alert: string | null;
};

/* ── Llamadas y closers ────────────────────────────────────── */

export type CloserRow = {
  name: string;
  calls: number;
  closes: number;
  topObjection: string;
  action: { label: string; tone: 'ok' | 'watch' | 'alert' };
};

export type CallRow = {
  date: string;
  prospect: string;
  product: string;
  who: string;
  broughtBy: string;
  result: 'won' | 'objection' | 'follow-up' | 'no-show';
  resultLabel: string;
};

export type CallsData = {
  kpis: Kpi[];
  closers: CloserRow[];
  objections: BarRow[];
  recent: CallRow[];
  insight: string;
};

/* ── Equipo y SOPs ─────────────────────────────────────────── */

export type TaskCard = { title: string; meta: string; overdue?: boolean; highlight?: boolean };
export type TaskColumn = { name: string; cards: TaskCard[] };
export type RolePanel = {
  role: string;
  metrics: { label: string; display: string; pct: number }[];
  note: string;
};

export type TeamData = {
  kpis: Kpi[];
  columns: TaskColumn[];
  panels: RolePanel[];
  sops: string[];
  sopNote: string;
};

/* ── Proceso ───────────────────────────────────────────────── */

export type ProcessStep = {
  n: string;
  title: string;
  detail: string;
  accent?: boolean;
  alert?: boolean;
};

export type ProcessData = {
  capture: ProcessStep[];
  captureNote: string;
  deliver: ProcessStep[];
  deliverNote: string;
  funnelByClient: { label: string; detail: string }[];
  funnelNote: string;
  missing: string[];
  openDecisions: string[];
};

/* ── Datos / integraciones ─────────────────────────────────── */

export type FlowRow = {
  name: string;
  provides: string;
  lastRead: string | null;
  state: 'active' | 'disconnected' | 'pending';
};

export type DataLayer = {
  kpis: Kpi[];
  flows: FlowRow[];
  buildOrder: { n: number; what: string; why: string }[];
};

/* ── Asistente ─────────────────────────────────────────────── */

export type AssistantData = { placeholder: string; suggestions: string[]; note: string };

/* ── El paquete completo por tenant ────────────────────────── */

export type TenantDataset = {
  content: ContentData;
  calendar: CalendarData;
  pipeline: PipelineData;
  leads: LeadsData;
  ads: AdsData;
  /** null cuando el embudo no tiene llamadas — la pantalla se degrada. */
  calls: CallsData | null;
  team: TeamData;
  process: ProcessData;
  data: DataLayer;
  assistant: AssistantData;
};
