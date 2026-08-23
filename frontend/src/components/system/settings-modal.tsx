'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Database,
  Monitor,
  Moon,
  Palette,
  Route,
  Search,
  ShieldCheck,
  Sun,
  UsersRound,
  X,
  Zap,
} from 'lucide-react';
import { DataScreen, ProcessScreen } from '@/components/screens/ops';
import { Badge, Note, TableWrap, Td, Th } from '@/components/ui/primitives';
import { onTenantColor } from '@/lib/format';
import type { Session, Tenant, TenantDataset } from '@/lib/types';

export type ThemeMode = 'system' | 'light' | 'dark';

type SectionId =
  | 'general'
  | 'brand'
  | 'members'
  | 'appearance'
  | 'integrations'
  | 'automations'
  | 'process'
  | 'platform';

type Section = {
  id: SectionId;
  label: string;
  icon: typeof Building2;
  group: 'Cuenta' | 'Plataforma';
  /** Solo visible para roles de plataforma. */
  platformOnly?: boolean;
  /** Palabras que hacen match en el buscador además del label. */
  keywords: string;
};

const SECTIONS: Section[] = [
  { id: 'general', label: 'General', icon: Building2, group: 'Cuenta', keywords: 'nombre slug embudo zona horaria moneda cuentas' },
  { id: 'brand', label: 'Marca', icon: Palette, group: 'Cuenta', keywords: 'logo color branding identidad tenant' },
  { id: 'members', label: 'Equipo y permisos', icon: UsersRound, group: 'Cuenta', keywords: 'miembros roles invitar mfa owner closer editor' },
  { id: 'appearance', label: 'Apariencia', icon: Sun, group: 'Cuenta', keywords: 'tema claro oscuro modo densidad' },
  { id: 'integrations', label: 'Datos e integraciones', icon: Database, group: 'Plataforma', keywords: 'flujos mcp sync webhooks metricool manychat' },
  { id: 'automations', label: 'Automatizaciones', icon: Zap, group: 'Plataforma', keywords: 'etapas disparos recordatorios secuencia' },
  { id: 'process', label: 'El proceso', icon: Route, group: 'Plataforma', keywords: 'captacion venta entrega embudo pasos' },
  { id: 'platform', label: 'Roles de plataforma', icon: ShieldCheck, group: 'Plataforma', platformOnly: true, keywords: 'admin dev impersonacion auditoria' },
];

export function SettingsModal({
  open,
  onClose,
  tenant,
  data,
  session,
  theme,
  onTheme,
}: {
  open: boolean;
  onClose: () => void;
  tenant: Tenant;
  data: TenantDataset;
  session: Session;
  theme: ThemeMode;
  onTheme: (t: ThemeMode) => void;
}) {
  const [wanted, setWanted] = useState<SectionId>('general');
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // En móvil el rail va arriba del contenido: al elegir sección hay que llevar
  // la vista al panel, o el usuario toca y no ve que pasó nada.
  function pick(id: SectionId) {
    setWanted(id);
    if (window.matchMedia('(max-width: 639px)').matches) {
      bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const isPlatform = session.user.platformRole !== 'none';

  // Dos filtros distintos a propósito: `allowed` es lo que el rol puede ver y
  // decide el panel activo; `visible` es lo que además pasa el buscador y solo
  // afecta al rail. Si el buscador decidiera el panel, escribir en él cambiaría
  // de sección sin que nadie lo pidiera.
  const allowed = useMemo(
    () => SECTIONS.filter((s) => !s.platformOnly || isPlatform),
    [isPlatform],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allowed;
    return allowed.filter(
      (s) => s.label.toLowerCase().includes(q) || s.keywords.includes(q),
    );
  }, [query, allowed]);

  // Estado derivado, no sincronizado: si el rol no alcanza la sección pedida se
  // cae a General en el propio render, sin un efecto que dispare otro render.
  const active: SectionId = allowed.some((s) => s.id === wanted) ? wanted : 'general';

  // Escape cierra; el foco vuelve a quedar dentro del diálogo.
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    searchRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onKey]);

  if (!open) return null;

  const groups: Section['group'][] = ['Cuenta', 'Plataforma'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar configuración"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-black/70"
      />

      {/* En móvil ocupa toda la pantalla (UX.md §5: los modales se vuelven hojas). */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative flex h-full w-full flex-col overflow-hidden border-border bg-overlay sm:h-[min(680px,90vh)] sm:max-w-[900px] sm:flex-row sm:rounded-xl sm:border"
      >
        {/* ── Rail izquierdo ───────────────────────────────── */}
        <div className="flex shrink-0 flex-col gap-3 border-b border-border bg-surface p-3 sm:w-[228px] sm:border-b-0 sm:border-r">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5">
            <Search size={14} className="shrink-0 text-fg-muted" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              aria-label="Buscar en configuración"
              className="min-h-[38px] w-full bg-transparent text-foreground outline-none placeholder:text-fg-disabled"
            />
          </div>

          <nav className="flex max-h-[30vh] flex-col gap-3 overflow-y-auto sm:max-h-none">
            {groups.map((g) => {
              const items = visible.filter((s) => s.group === g);
              if (items.length === 0) return null;
              return (
                <div key={g} className="flex flex-col gap-0.5">
                  <span className="overline px-2 py-1 text-fg-disabled">{g}</span>
                  {items.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => pick(s.id)}
                      aria-current={active === s.id ? 'true' : undefined}
                      className={`flex min-h-[38px] cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] transition-colors ${
                        active === s.id
                          ? 'bg-raised font-bold text-foreground'
                          : 'text-fg-secondary hover:bg-raised hover:text-foreground'
                      }`}
                    >
                      <s.icon size={15} aria-hidden />
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              );
            })}
            {visible.length === 0 ? (
              <p className="px-2 py-3 text-[12px] text-fg-muted">
                Nada coincide con «{query}».
              </p>
            ) : null}
          </nav>
        </div>

        {/* ── Panel derecho ────────────────────────────────── */}
        <div ref={bodyRef} className="relative flex min-w-0 flex-1 flex-col">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-raised hover:text-foreground"
          >
            <X size={17} aria-hidden />
          </button>

          <div className="min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <h2 id="settings-title" className="sr-only">
              Configuración de {tenant.name}
            </h2>
            <SectionBody
              id={active}
              tenant={tenant}
              data={data}
              session={session}
              theme={theme}
              onTheme={onTheme}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ Cuerpo de cada sección ═══════════════════════════════════ */

function SectionBody({
  id,
  tenant,
  data,
  session,
  theme,
  onTheme,
}: {
  id: SectionId;
  tenant: Tenant;
  data: TenantDataset;
  session: Session;
  theme: ThemeMode;
  onTheme: (t: ThemeMode) => void;
}) {
  switch (id) {
    case 'general':
      return <GeneralSection tenant={tenant} />;
    case 'brand':
      return <BrandSection tenant={tenant} />;
    case 'members':
      return <MembersSection data={data} />;
    case 'appearance':
      return <AppearanceSection theme={theme} onTheme={onTheme} />;
    case 'integrations':
      return (
        <Scoped title="Datos e integraciones">
          <DataScreen data={data.data} />
        </Scoped>
      );
    case 'automations':
      return <AutomationsSection data={data} />;
    case 'process':
      return (
        <Scoped title="El proceso">
          <ProcessScreen data={data.process} />
        </Scoped>
      );
    case 'platform':
      return <PlatformSection session={session} tenant={tenant} />;
  }
}

/** Reutiliza una pantalla completa dentro del modal, ocultando su cabecera propia. */
function Scoped({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 [&_h1]:hidden [&_header>div>p]:hidden">
      <SectionHead title={title} />
      {children}
    </div>
  );
}

function SectionHead({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className="flex flex-col gap-1 pr-10">
      <h3 className="text-[22px]">{title}</h3>
      {lede ? <p className="max-w-[60ch] text-[13px] text-fg-secondary">{lede}</p> : null}
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-foreground">{label}</span>
        {hint ? <span className="text-[12px] text-fg-muted">{hint}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

function Field({ value }: { value: string }) {
  return (
    <span className="tabular rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[13px] text-fg-secondary">
      {value}
    </span>
  );
}

/* ── General ─────────────────────────────────────────────── */

function GeneralSection({ tenant }: { tenant: Tenant }) {
  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title="General"
        lede="Lo que define a esta cuenta. El tipo de embudo decide qué módulos aplican y con qué plantilla se siembra el pipeline."
      />
      <div className="flex flex-col">
        <Row label="Nombre de la cuenta">
          <Field value={tenant.name} />
        </Row>
        <Row label="Identificador" hint="Aparece en la URL de la cuenta">
          <Field value={tenant.slug} />
        </Row>
        <Row label="Tipo de embudo" hint="Cambiarlo re-siembra las etapas del pipeline">
          <Badge>{tenant.funnelLabel}</Badge>
        </Row>
        <Row label="Zona horaria" hint="Todos los rollups diarios usan esta zona, no la del servidor">
          <Field value="America/Mexico_City" />
        </Row>
        <Row label="Moneda">
          <Field value={tenant.currency} />
        </Row>
        <Row label="Cuentas conectadas">
          <Field value={`${tenant.channels}`} />
        </Row>
        <Row label="Módulos activos" hint="Se derivan del tipo de embudo">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={tenant.modules.calls ? 'ok' : 'neutral'}>
              {tenant.modules.calls ? 'Llamadas' : 'Sin llamadas'}
            </Badge>
            <Badge tone={tenant.modules.closers ? 'ok' : 'neutral'}>
              {tenant.modules.closers ? 'Closers' : 'Sin closers'}
            </Badge>
            <Badge tone={tenant.modules.checkout ? 'ok' : 'neutral'}>
              {tenant.modules.checkout ? 'Checkout' : 'Sin checkout'}
            </Badge>
          </div>
        </Row>
      </div>
      <Note>
        La zona horaria no es un detalle cosmético: si los rollups corrieran en UTC, las
        conversiones de la tarde se asignarían al día equivocado y el cliente lo descubriría al
        comparar con su contabilidad.
      </Note>
    </div>
  );
}

/* ── Marca ───────────────────────────────────────────────── */

function BrandSection({ tenant }: { tenant: Tenant }) {
  const [color, setColor] = useState(tenant.color);
  const on = onTenantColor(color);

  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title="Marca"
        lede="Tu logo y tu color se superponen a Yamil OS, no lo reemplazan. El color se usa solo como fondo, así que tu marca queda exacta."
      />

      <div className="flex flex-col">
        <Row label="Color de marca" hint="Se usa en la franja de identidad, el avatar y los exports">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Color de marca"
            className="h-9 w-14 cursor-pointer rounded-md border border-border-strong bg-surface p-1"
          />
          <Field value={color.toUpperCase()} />
        </Row>
        <Row label="Logo claro" hint="SVG o PNG transparente, para fondos claros">
          <Badge tone="neutral">Sin cargar</Badge>
        </Row>
        <Row label="Logo oscuro" hint="SVG o PNG transparente, para fondos oscuros">
          <Badge tone="neutral">Sin cargar</Badge>
        </Row>
        <Row label="Marca cuadrada" hint="1:1, mínimo 256px. Avatar y favicon">
          <Badge tone="neutral">Sin cargar</Badge>
        </Row>
      </div>

      <div className="flex flex-col gap-2">
        <span className="overline text-fg-muted">Vista previa</span>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="h-1 w-full" style={{ background: color }} aria-hidden />
          <div className="flex items-center gap-3 bg-surface p-4">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-display text-[14px]"
              style={{ background: color, color: on }}
              aria-hidden
            >
              {tenant.initials}
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-bold">{tenant.name}</div>
              <div className="text-[11px] text-fg-muted">Cuenta activa</div>
            </div>
            <span
              className="ml-auto shrink-0 rounded-md px-3 py-1.5 text-[12px] font-bold"
              style={{ background: color, color: on }}
            >
              Tu marca
            </span>
          </div>
        </div>
      </div>

      <Note>
        El texto sobre tu color se calcula solo:{' '}
        <span className="tabular font-bold text-foreground">{on === '#000000' ? 'negro' : 'blanco'}</span>{' '}
        en este caso. Para cualquier color existe siempre uno de los dos que supera 4.58:1 de
        contraste, así que tu marca nunca se distorsiona para cumplir accesibilidad.
      </Note>
    </div>
  );
}

/* ── Equipo y permisos ───────────────────────────────────── */

function MembersSection({ data }: { data: TenantDataset }) {
  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title="Equipo y permisos"
        lede="El rol decide qué ve cada persona. Un editor no accede a los contactos: no tiene razón de negocio para ver datos personales de un lead."
      />
      <div className="rounded-lg border border-border">
        <TableWrap minW={480}>
          <thead>
            <tr>
              <Th>Persona</Th>
              <Th>Rol</Th>
              <Th align="right">MFA</Th>
              <Th align="right">Última vez</Th>
            </tr>
          </thead>
          <tbody>
            {data.members.map((m) => (
              <tr key={m.email}>
                <Td strong>
                  {m.name}
                  <span className="block text-[11px] font-normal text-fg-muted">{m.email}</span>
                </Td>
                <Td>
                  <Badge tone={m.role === 'owner' ? 'ok' : 'neutral'}>{m.roleLabel}</Badge>
                </Td>
                <Td align="right">
                  {m.mfa ? (
                    <Badge tone="ok">Activo</Badge>
                  ) : (
                    <Badge tone="warn">Sin activar</Badge>
                  )}
                </Td>
                <Td align="right" className="tabular">
                  {m.lastSeen}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
      <Note tone="alert">
        MFA es obligatorio para owner y manager antes de que entre el primer cliente real: esas
        cuentas pueden leer la información de contacto de todos los leads y cada peso de ingreso.
      </Note>
    </div>
  );
}

/* ── Apariencia ──────────────────────────────────────────── */

function AppearanceSection({
  theme,
  onTheme,
}: {
  theme: ThemeMode;
  onTheme: (t: ThemeMode) => void;
}) {
  const opts: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: 'system', label: 'Sistema', icon: Monitor },
    { id: 'light', label: 'Claro', icon: Sun },
    { id: 'dark', label: 'Oscuro', icon: Moon },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title="Apariencia"
        lede="El modo oscuro es el default del producto. El claro está completo, con sus propios valores verificados, no con los colores invertidos."
      />
      <div className="flex flex-col">
        <Row label="Tema">
          <div className="flex items-center rounded-md border border-border p-0.5" role="group" aria-label="Tema">
            {opts.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => onTheme(o.id)}
                aria-pressed={theme === o.id}
                title={o.label}
                className={`flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-sm px-2.5 text-[12px] font-bold transition-colors ${
                  theme === o.id
                    ? 'bg-foreground text-background'
                    : 'text-fg-muted hover:text-foreground'
                }`}
              >
                <o.icon size={14} aria-hidden />
                <span className="hidden sm:inline">{o.label}</span>
              </button>
            ))}
          </div>
        </Row>
        <Row label="Densidad" hint="La escala compacta es la que usa el dashboard">
          <Badge>Compacta</Badge>
        </Row>
        <Row label="Cifras tabulares" hint="Alinea los dígitos en columnas numéricas">
          <Badge tone="ok">Siempre activo</Badge>
        </Row>
      </div>
      <Note>
        «Sistema» sigue la preferencia del navegador. Si el sistema operativo está en claro, el
        dashboard se ve claro sin que haya que tocar nada.
      </Note>
    </div>
  );
}

/* ── Automatizaciones ────────────────────────────────────── */

function AutomationsSection({ data }: { data: TenantDataset }) {
  const sinSetear = data.pipeline.automations.filter((a) => a.state === 'unset').length;

  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title="Automatizaciones"
        lede="Cada cambio de etapa dispara algo. Lo que dispara se configura por cuenta, porque no todos venden lo mismo."
      />
      <div className="rounded-lg border border-border">
        <TableWrap minW={440}>
          <thead>
            <tr>
              <Th>Etapa</Th>
              <Th>Disparo</Th>
              <Th align="right">Estado</Th>
            </tr>
          </thead>
          <tbody>
            {data.pipeline.automations.map((a) => (
              <tr key={a.stage}>
                <Td strong>{a.stage}</Td>
                <Td>{a.trigger}</Td>
                <Td align="right">
                  <Badge tone={a.state === 'active' ? 'ok' : 'alert'}>
                    {a.state === 'active' ? 'Activa' : 'Sin setear'}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>

      {data.pipeline.confirmSequence ? (
        <div className="flex flex-col gap-2">
          <span className="overline text-fg-muted">Secuencia de confirmación</span>
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {data.pipeline.confirmSequence.steps.map((s, i) => (
              <li
                key={s.when}
                className={`flex flex-col gap-1 rounded-md border px-3 py-2.5 ${
                  i === 0 ? 'border-border-strong bg-raised' : 'border-border bg-surface'
                }`}
              >
                <span className="overline text-foreground">{s.when}</span>
                <span className="text-[11px] text-fg-muted">{s.what}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <Note>
          Este embudo no agenda llamadas, así que no hay secuencia de confirmación. Lo que ocupa
          su lugar es la recuperación de carrito.
        </Note>
      )}

      {sinSetear > 0 ? (
        <Note tone="alert">
          {sinSetear === 1
            ? 'Hay una automatización sin setear. Cada etapa sin disparo es trabajo que alguien tiene que hacer a mano.'
            : `Hay ${sinSetear} automatizaciones sin setear. Cada etapa sin disparo es trabajo que alguien tiene que hacer a mano.`}
        </Note>
      ) : null}
    </div>
  );
}

/* ── Roles de plataforma ─────────────────────────────────── */

function PlatformSection({ session, tenant }: { session: Session; tenant: Tenant }) {
  const role = session.user.platformRole;

  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title="Roles de plataforma"
        lede="Por encima de las cuentas hay dos roles con permisos distintos: admin opera el negocio, dev opera el sistema."
      />

      <div className="flex flex-col">
        <Row label="Tu rol de plataforma">
          <Badge tone="ok">{role === 'admin' ? 'Admin' : role === 'dev' ? 'Dev' : 'Ninguno'}</Badge>
        </Row>
        <Row label="Cuenta en la que estás" hint="Toda acción queda registrada con la cuenta activa">
          <Field value={tenant.name} />
        </Row>
        <Row label="MFA" hint="Obligatorio sin excepción para roles de plataforma">
          <Badge tone="ok">Activo</Badge>
        </Row>
      </div>

      <div className="rounded-lg border border-border">
        <TableWrap minW={420}>
          <thead>
            <tr>
              <Th>Puede</Th>
              <Th align="right">Admin</Th>
              <Th align="right">Dev</Th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Crear, editar y suspender cuentas', true, false],
              ['Invitar miembros y cambiar roles', true, false],
              ['Editar la estrategia y el branding', true, false],
              ['Facturación y planes', true, false],
              ['Leer payloads crudos de webhook', false, true],
              ['Reprocesar la bandeja y disparar syncs', false, true],
              ['Logs, trazas y feature flags', false, true],
              ['Impersonar, con auditoría', true, true],
            ].map(([what, admin, dev]) => (
              <tr key={what as string}>
                <Td strong>{what as string}</Td>
                <Td align="right">{admin ? '✓' : <span className="text-fg-disabled">—</span>}</Td>
                <Td align="right">{dev ? '✓' : <span className="text-fg-disabled">—</span>}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>

      <Note tone="alert">
        El admin no lee payloads crudos porque contienen información personal sin filtrar de los
        leads del cliente, y para operar comercialmente no hacen falta. El dev no toca facturación
        ni estrategia: son decisiones de negocio.
      </Note>

      <Note>
        Impersonar exige un motivo escrito, caduca a los 30 minutos, es de solo lectura por
        defecto y le llega un aviso al owner de la cuenta dentro de 24 h. Eso último no es
        cortesía: hace que el acceso sea auditable por el cliente, no solo por nosotros.
      </Note>
    </div>
  );
}
