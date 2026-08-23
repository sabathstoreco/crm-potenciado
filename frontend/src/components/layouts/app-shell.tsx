'use client';

import { useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  CalendarDays,
  ChevronDown,
  Check,
  Database,
  Film,
  KanbanSquare,
  LogOut,
  Menu,
  MessageCircleQuestion,
  Phone,
  Route,
  Sun,
  Moon,
  UsersRound,
  X,
} from 'lucide-react';
import { AdsScreen, CallsScreen } from '@/components/screens/money';
import { CalendarScreen, ContentScreen } from '@/components/screens/content';
import { LeadsScreen, PipelineScreen } from '@/components/screens/crm';
import { AssistantScreen, DataScreen, ProcessScreen, TeamScreen } from '@/components/screens/ops';
import { getDataset, getTenant, tenants } from '@/lib/data';
import { onTenantColor } from '@/lib/format';
import { writeSession } from '@/lib/auth';
import type { Period, Session } from '@/lib/types';

const NAV = [
  { id: 'content', label: 'Contenido', icon: Film },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
  { id: 'leads', label: 'Leads', icon: UsersRound },
  { id: 'ads', label: 'Ads y costos', icon: BadgeDollarSign },
  { id: 'calls', label: 'Llamadas', icon: Phone },
  { id: 'team', label: 'Equipo y SOPs', icon: UsersRound },
  { id: 'assistant', label: 'Preguntar', icon: MessageCircleQuestion },
  { id: 'process', label: 'El proceso', icon: Route },
  { id: 'data', label: 'Datos', icon: Database },
] as const;

type ScreenId = (typeof NAV)[number]['id'];

const PERIODS: { id: Period; label: string }[] = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: 'year', label: 'Año' },
];

function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-label="Yamil OS" role="img">
      <rect width="48" height="48" rx="11.5" fill="#DB0F2A" />
      <g
        stroke="#FFFFFF"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M14.5 14.5 L24 26 L33.5 14.5" />
        <path d="M24 26 L24 34.5" />
      </g>
    </svg>
  );
}

export function AppShell({
  initialSession,
  onLogout,
}: {
  initialSession: Session;
  onLogout: () => void;
}) {
  const [session, setSession] = useState(initialSession);
  const [screen, setScreen] = useState<ScreenId>('content');
  const [period, setPeriod] = useState<Period>('90d');
  const [navOpen, setNavOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [light, setLight] = useState(false);

  const tenant = useMemo(() => getTenant(session.activeTenantId), [session.activeTenantId]);
  const data = useMemo(() => getDataset(session.activeTenantId), [session.activeTenantId]);
  const available = tenants.filter((t) => session.user.tenantIds.includes(t.id));

  // El color del tenant se usa solo como fondo; el texto encima se calcula por
  // luminancia y siempre supera 4.58:1 — DESIGN.md §13.2.
  const onTenant = onTenantColor(tenant.color);

  function switchTenant(id: string) {
    const next = { ...session, activeTenantId: id };
    setSession(next);
    writeSession(next);
    setPickerOpen(false);
    setNavOpen(false);
  }

  function toggleTheme() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle('light', next);
  }

  // Las llamadas no aplican a todos los embudos: el ítem se marca en vez de ocultarse,
  // porque desaparecer del menú confunde más que explicar por qué no aplica.
  const nav = NAV.map((n) => ({
    ...n,
    dim: n.id === 'calls' && !tenant.modules.calls,
  }));

  const screens: Record<ScreenId, React.ReactNode> = {
    content: <ContentScreen data={data.content} tenant={tenant} />,
    calendar: <CalendarScreen data={data.calendar} tenant={tenant} />,
    pipeline: <PipelineScreen data={data.pipeline} />,
    leads: <LeadsScreen data={data.leads} />,
    ads: <AdsScreen data={data.ads} />,
    calls: <CallsScreen data={data.calls} tenant={tenant} />,
    team: <TeamScreen data={data.team} />,
    assistant: <AssistantScreen data={data.assistant} tenant={tenant} />,
    process: <ProcessScreen data={data.process} />,
    data: <DataScreen data={data.data} />,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Franja de identidad del cliente — señal permanente de en qué cuenta estás */}
      <div className="h-1 w-full" style={{ background: tenant.color }} aria-hidden />

      <div className="flex">
        {/* ── Barra lateral (lg+) ─────────────────────────────── */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <div className="flex items-center gap-2.5 px-4 py-4">
            <Mark />
            <span className="font-display text-[17px] tracking-tight">
              YAMIL <span className="text-brand-text">OS</span>
            </span>
          </div>

          <TenantPicker
            tenant={tenant}
            available={available}
            open={pickerOpen}
            onToggle={() => setPickerOpen((v) => !v)}
            onPick={switchTenant}
            onTenant={onTenant}
          />

          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
            {nav.map((n) => (
              <NavItem
                key={n.id}
                {...n}
                active={screen === n.id}
                onClick={() => setScreen(n.id)}
              />
            ))}
          </nav>

          <div className="flex flex-col gap-0.5 border-t border-border p-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex min-h-[36px] cursor-pointer items-center gap-2.5 rounded-md px-3 text-[13px] text-fg-secondary transition-colors hover:bg-raised hover:text-foreground"
            >
              {light ? <Moon size={15} aria-hidden /> : <Sun size={15} aria-hidden />}
              {light ? 'Modo oscuro' : 'Modo claro'}
            </button>
            <button
              type="button"
              onClick={() => {
                writeSession(null);
                onLogout();
              }}
              className="flex min-h-[36px] cursor-pointer items-center gap-2.5 rounded-md px-3 text-[13px] text-fg-secondary transition-colors hover:bg-raised hover:text-foreground"
            >
              <LogOut size={15} aria-hidden /> Salir
            </button>
          </div>
        </aside>

        {/* ── Contenido ───────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barra superior */}
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 lg:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-label="Abrir navegación"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-fg-secondary transition-colors hover:bg-surface lg:hidden"
              >
                <Menu size={18} aria-hidden />
              </button>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-display text-[11px] lg:hidden"
                style={{ background: tenant.color, color: onTenant }}
                aria-hidden
              >
                {tenant.initials}
              </span>
              <span className="truncate text-[13px] font-bold lg:hidden">{tenant.name}</span>
              <span className="hidden text-[12px] text-fg-muted lg:inline">
                {tenant.funnelLabel} · {tenant.channels} cuentas
              </span>
            </div>

            <div
              className="flex shrink-0 items-center rounded-md border border-border p-0.5"
              role="group"
              aria-label="Periodo"
            >
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  aria-pressed={period === p.id}
                  className={`min-h-[30px] cursor-pointer rounded-sm px-2.5 text-[11px] font-bold uppercase tracking-[0.05em] transition-colors ${
                    period === p.id
                      ? 'bg-foreground text-background'
                      : 'text-fg-muted hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </header>

          <main className="min-w-0 px-4 py-6 pb-24 lg:px-6 lg:pb-10">{screens[screen]}</main>
        </div>
      </div>

      {/* ── Panel de navegación (móvil) ──────────────────────── */}
      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar navegación"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 cursor-pointer bg-black/70"
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-border bg-surface">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2.5">
                <Mark />
                <span className="font-display text-[17px]">
                  YAMIL <span className="text-brand-text">OS</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Cerrar"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-fg-secondary hover:bg-raised"
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            <TenantPicker
              tenant={tenant}
              available={available}
              open
              onToggle={() => undefined}
              onPick={switchTenant}
              onTenant={onTenant}
              alwaysOpen
            />

            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
              {nav.map((n) => (
                <NavItem
                  key={n.id}
                  {...n}
                  active={screen === n.id}
                  onClick={() => {
                    setScreen(n.id);
                    setNavOpen(false);
                  }}
                />
              ))}
            </nav>

            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-md px-3 text-[13px] text-fg-secondary hover:bg-raised"
              >
                {light ? <Moon size={15} aria-hidden /> : <Sun size={15} aria-hidden />}
                {light ? 'Modo oscuro' : 'Modo claro'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Selector de cuenta ────────────────────────────────────── */

function TenantPicker({
  tenant,
  available,
  open,
  onToggle,
  onPick,
  onTenant,
  alwaysOpen = false,
}: {
  tenant: (typeof tenants)[number];
  available: typeof tenants;
  open: boolean;
  onToggle: () => void;
  onPick: (id: string) => void;
  onTenant: string;
  alwaysOpen?: boolean;
}) {
  return (
    <div className="border-y border-border">
      {!alwaysOpen ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-raised"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-display text-[12px]"
            style={{ background: tenant.color, color: onTenant }}
            aria-hidden
          >
            {tenant.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold">{tenant.name}</span>
            <span className="block text-[11px] text-fg-muted">{tenant.funnelLabel}</span>
          </span>
          <ChevronDown
            size={15}
            className={`shrink-0 text-fg-muted transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      ) : null}

      {open ? (
        <ul className="flex flex-col gap-0.5 p-2">
          {available.map((t) => {
            const active = t.id === tenant.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onPick(t.id)}
                  className={`flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-left transition-colors ${
                    active ? 'bg-raised' : 'hover:bg-raised'
                  }`}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-display text-[11px]"
                    style={{ background: t.color, color: onTenantColor(t.color) }}
                    aria-hidden
                  >
                    {t.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold">{t.name}</span>
                    <span className="block text-[11px] text-fg-muted">{t.funnelLabel}</span>
                  </span>
                  {active ? <Check size={14} className="shrink-0 text-brand-text" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/* ── Ítem de navegación ────────────────────────────────────── */

function NavItem({
  label,
  icon: Icon,
  active,
  dim,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  active: boolean;
  dim?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-[38px] cursor-pointer items-center gap-2.5 rounded-md px-3 text-left text-[13px] transition-colors ${
        active
          ? 'bg-brand font-bold text-on-brand'
          : dim
            ? 'text-fg-disabled hover:bg-raised'
            : 'text-fg-secondary hover:bg-raised hover:text-foreground'
      }`}
    >
      <Icon size={15} aria-hidden />
      <span className="truncate">{label}</span>
      {dim ? <span className="ml-auto text-[10px] uppercase">n/a</span> : null}
    </button>
  );
}
