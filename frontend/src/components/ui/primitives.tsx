import type { ReactNode } from 'react';
import type { BarRow, Kpi } from '@/lib/types';

/* ── Cabecera de pantalla ──────────────────────────────────── */

export function PageHeader({
  title,
  lede,
  actions,
}: {
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] leading-tight md:text-[32px]">{title}</h1>
        {lede ? (
          <p className="max-w-[68ch] text-[13px] leading-relaxed text-fg-secondary">{lede}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/* ── Botones ───────────────────────────────────────────────── */

type BtnProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  type?: 'button' | 'submit';
};

export function Button({ children, variant = 'secondary', onClick, type = 'button' }: BtnProps) {
  const base =
    'inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md px-3.5 text-[13px] font-bold transition-colors duration-150 cursor-pointer';
  const styles = {
    primary: 'bg-brand text-on-brand hover:bg-brand-hover',
    secondary: 'border border-border-strong bg-raised text-foreground hover:border-fg-muted',
    ghost: 'text-fg-secondary hover:bg-surface',
  }[variant];
  return (
    <button type={type} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

/* ── Superficies ───────────────────────────────────────────── */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 rounded-lg border border-border bg-surface ${className}`}>{children}</div>
  );
}

export function CardHead({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <span className="overline text-fg-muted">{title}</span>
      {aside ? <span className="overline text-fg-disabled">{aside}</span> : null}
    </div>
  );
}

/* ── KPI ───────────────────────────────────────────────────── */

export function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
      {items.map((k) => (
        <KpiCard key={k.label} kpi={k} />
      ))}
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const highlight = kpi.tone === 'highlight';
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border p-4 ${
        highlight
          ? 'border-border-strong bg-raised'
          : 'border-border bg-surface'
      }`}
    >
      <span className="overline text-fg-muted">{kpi.label}</span>
      <span className="tabular font-display text-[32px] leading-none">{kpi.value}</span>
      <span className="flex flex-wrap items-baseline gap-1.5 text-[12px]">
        {kpi.delta ? (
          <span
            className={`tabular font-bold ${kpi.delta.positive ? 'text-success' : 'text-danger'}`}
          >
            {kpi.delta.positive ? '▲' : '▼'} {kpi.delta.value}
          </span>
        ) : null}
        {kpi.hint ? (
          <span className={kpi.tone === 'alert' ? 'text-danger' : 'text-fg-muted'}>{kpi.hint}</span>
        ) : null}
      </span>
    </div>
  );
}

/* ── Barras comparativas ───────────────────────────────────── */

export function BarList({ rows }: { rows: BarRow[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {rows.map((r) => (
        <div key={r.name} className="grid grid-cols-[minmax(112px,1.35fr)_2.2fr_auto] items-center gap-3">
          <span className="text-[12px] leading-snug text-fg-secondary">{r.name}</span>
          <span className="h-2 overflow-hidden rounded-full bg-raised" role="presentation">
            <span
              className={`block h-full rounded-full ${r.tone === 'alert' ? 'bg-danger' : 'bg-fg-secondary'}`}
              style={{ width: `${Math.max((r.value / max) * 100, r.value > 0 ? 3 : 1.5)}%` }}
            />
          </span>
          <span className="tabular w-[72px] text-right text-[12px] text-fg-muted">
            {r.display ?? r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Badges ────────────────────────────────────────────────── */

type Tone = 'neutral' | 'ok' | 'warn' | 'alert' | 'info';

const toneMap: Record<Tone, string> = {
  neutral: 'border-border-strong text-fg-secondary',
  ok: 'border-success/45 text-success',
  warn: 'border-warning/45 text-warning',
  alert: 'border-danger/55 text-danger',
  info: 'border-info/45 text-info',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.07em] ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── Tabla ─────────────────────────────────────────────────── */

export function TableWrap({
  children,
  minW = 640,
}: {
  children: ReactNode;
  /** Ancho mínimo antes de scrollear. Bajarlo en tarjetas a media anchura. */
  minW?: number;
}) {
  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" style={{ minWidth: minW }}>
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      scope="col"
      className={`overline whitespace-nowrap border-b border-border px-4 py-2.5 text-fg-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  strong = false,
  className = '',
}: {
  children: ReactNode;
  align?: 'left' | 'right';
  strong?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-border px-4 py-3 ${align === 'right' ? 'text-right' : 'text-left'} ${
        strong ? 'font-semibold text-foreground' : 'text-fg-secondary'
      } ${className}`}
    >
      {children}
    </td>
  );
}

/* ── Nota al pie de una sección ────────────────────────────── */

export function Note({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'alert' }) {
  return (
    <p
      className={`border-l-2 py-1 pl-3 text-[12px] leading-relaxed ${
        tone === 'alert' ? 'border-danger text-fg-secondary' : 'border-border-strong text-fg-muted'
      }`}
    >
      {children}
    </p>
  );
}

/* ── Estado vacío / degradado ──────────────────────────────── */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span className="text-fg-disabled">{icon}</span>
      <h2 className="text-[22px]">{title}</h2>
      <p className="max-w-[46ch] text-[13px] leading-relaxed text-fg-muted">{body}</p>
      {action}
    </Card>
  );
}
