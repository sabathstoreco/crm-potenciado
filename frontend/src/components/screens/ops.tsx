'use client';

import { useState } from 'react';
import { BookOpen, ChevronRight, Plus, Send } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHead,
  KpiGrid,
  Note,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from '@/components/ui/primitives';
import { num } from '@/lib/format';
import type { AssistantData, DataLayer, ProcessData, ProcessStep, TeamData, Tenant } from '@/lib/types';

/* ═══ Equipo y SOPs ═══════════════════════════════════════════ */

export function TeamScreen({ data }: { data: TeamData }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Equipo y SOPs"
        lede="No se le monta el equipo al cliente: se le entrega el sistema para que lo monte y se le corrige mientras lo hace."
        actions={
          <>
            <Button variant="secondary">
              <BookOpen size={14} aria-hidden /> Ver SOPs
            </Button>
            <Button variant="primary">
              <Plus size={14} aria-hidden /> Asignar tarea
            </Button>
          </>
        }
      />

      <KpiGrid items={data.kpis} />

      <Card>
        <CardHead title="Tareas" />
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {data.columns.map((col) => (
            <div key={col.name} className="flex min-h-[140px] flex-col gap-2 bg-surface p-3">
              <div className="flex items-center justify-between">
                <span className="overline text-fg-muted">{col.name}</span>
                <span className="tabular text-[11px] text-fg-disabled">{col.cards.length}</span>
              </div>
              {col.cards.map((c) => (
                <div
                  key={c.title}
                  className={`flex flex-col gap-1 rounded-md border bg-raised px-3 py-2.5 ${
                    c.overdue
                      ? 'border-danger'
                      : c.highlight
                        ? 'border-border-strong'
                        : 'border-border'
                  }`}
                >
                  <span className="text-[12px] font-semibold leading-snug text-foreground">
                    {c.title}
                  </span>
                  <span className={`text-[11px] ${c.overdue ? 'text-danger' : 'text-fg-muted'}`}>
                    {c.meta}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.panels.map((p) => (
          <Card key={p.role}>
            <CardHead title={p.role} />
            <div className="flex flex-col gap-3 p-4">
              {p.metrics.map((m) => (
                <div key={m.label} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] text-fg-secondary">{m.label}</span>
                    <span className="tabular text-[12px] font-bold text-foreground">
                      {m.display}
                    </span>
                  </div>
                  <span className="h-1.5 overflow-hidden rounded-full bg-raised">
                    <span
                      className="block h-full rounded-full bg-fg-secondary"
                      style={{ width: `${m.pct}%` }}
                    />
                  </span>
                </div>
              ))}
              <Note>{p.note}</Note>
            </div>
          </Card>
        ))}

        <Card>
          <CardHead title="SOPs disponibles" />
          <div className="flex flex-col gap-2 p-4">
            {data.sops.map((s) => (
              <button
                key={s}
                type="button"
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-fg-secondary transition-colors hover:bg-raised hover:text-foreground"
              >
                <ChevronRight size={13} className="shrink-0 text-fg-disabled" aria-hidden />
                {s}
              </button>
            ))}
            <Note>{data.sopNote}</Note>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══ Preguntar ═══════════════════════════════════════════════ */

export function AssistantScreen({ data, tenant }: { data: AssistantData; tenant: Tenant }) {
  const [value, setValue] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Preguntar"
        lede={`Responde con los datos de ${tenant.name} y con tu metodología detrás. No es un chat genérico: sabe cómo trabajás.`}
      />

      <Card className="p-4">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="sr-only" htmlFor="ask">
            Escribí tu pregunta
          </label>
          <input
            id="ask"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={data.placeholder}
            className="min-h-[44px] flex-1 rounded-md border border-border-strong bg-background px-3 text-foreground placeholder:text-fg-disabled"
          />
          <Button variant="primary" type="submit">
            <Send size={14} aria-hidden /> Preguntar
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {data.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue(s)}
              className="min-h-[36px] cursor-pointer rounded-md border border-border bg-raised px-3 text-[12px] text-fg-secondary transition-colors hover:border-border-strong hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      <Note>{data.note}</Note>
    </div>
  );
}

/* ═══ El proceso ══════════════════════════════════════════════ */

function StepGrid({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((s) => (
        <div
          key={s.n}
          className={`flex flex-col gap-1 rounded-md border px-3 py-3 ${
            s.alert
              ? 'border-danger bg-surface'
              : s.accent
                ? 'border-border-strong bg-raised'
                : 'border-border bg-surface'
          }`}
        >
          <span className="overline text-fg-muted">
            {s.n} · {s.title}
          </span>
          <span className="text-[11px] leading-relaxed text-fg-secondary">{s.detail}</span>
        </div>
      ))}
    </div>
  );
}

export function ProcessScreen({ data }: { data: ProcessData }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="El proceso"
        lede="El recorrido completo, de la auditoría inicial hasta que el cliente vive dentro del dashboard."
      />

      <Card>
        <CardHead title="Captación → venta" />
        <div className="flex flex-col gap-3 p-4">
          <StepGrid steps={data.capture} />
          <Note>{data.captureNote}</Note>
        </div>
      </Card>

      <Card>
        <CardHead title="Venta → entrega" />
        <div className="flex flex-col gap-3 p-4">
          <StepGrid steps={data.deliver} />
          <Note>{data.deliverNote}</Note>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHead title="Embudo según el cliente" />
          <div className="flex flex-col gap-2.5 p-4">
            {data.funnelByClient.map((f) => (
              <p key={f.label} className="text-[12px] text-fg-secondary">
                <span className="overline mr-1.5 text-foreground">{f.label}</span>
                {f.detail}
              </p>
            ))}
            <Note>{data.funnelNote}</Note>
          </div>
        </Card>

        <Card>
          <CardHead title="Lo que falta" />
          <div className="flex flex-col gap-2 p-4">
            {data.missing.map((m) => (
              <p key={m} className="flex gap-2 text-[12px] text-fg-secondary">
                <ChevronRight size={13} className="mt-0.5 shrink-0 text-danger" aria-hidden />
                {m}
              </p>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead title="Decisiones abiertas" />
          <div className="flex flex-col gap-2 p-4">
            {data.openDecisions.map((d) => (
              <p key={d} className="flex gap-2 text-[12px] text-fg-secondary">
                <ChevronRight size={13} className="mt-0.5 shrink-0 text-fg-disabled" aria-hidden />
                {d}
              </p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══ Datos ═══════════════════════════════════════════════════ */

export function DataScreen({ data }: { data: DataLayer }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Datos"
        lede="El cliente no entra a ninguna herramienta. La capa MCP las lee por debajo y todo se ve aquí, con el mismo lenguaje y las mismas unidades."
        actions={
          <Button variant="primary">
            <Plus size={14} aria-hidden /> Añadir flujo
          </Button>
        }
      />

      <KpiGrid items={data.kpis} />

      <Card>
        <CardHead title="Flujos de datos" aside="Capa MCP · lectura" />
        <TableWrap>
          <thead>
            <tr>
              <Th>Flujo</Th>
              <Th>Qué aporta al dashboard</Th>
              <Th>Última lectura</Th>
              <Th align="right">Estado</Th>
            </tr>
          </thead>
          <tbody>
            {data.flows.map((f) => (
              <tr key={f.name}>
                <Td strong>{f.name}</Td>
                <Td>{f.provides}</Td>
                <Td className="tabular">
                  {f.lastRead ?? <span className="text-fg-disabled">—</span>}
                </Td>
                <Td align="right">
                  <Badge
                    tone={f.state === 'active' ? 'ok' : f.state === 'disconnected' ? 'alert' : 'neutral'}
                  >
                    {f.state === 'active'
                      ? 'Activo'
                      : f.state === 'disconnected'
                        ? 'Sin conectar'
                        : 'Pendiente'}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Orden de construcción sugerido" />
          <TableWrap minW={440}>
            <thead>
              <tr>
                <Th align="right">#</Th>
                <Th>Qué se conecta</Th>
                <Th>Por qué primero</Th>
              </tr>
            </thead>
            <tbody>
              {data.buildOrder.map((b) => (
                <tr key={b.n}>
                  <Td align="right" className="tabular">
                    {num(b.n)}
                  </Td>
                  <Td strong>{b.what}</Td>
                  <Td>{b.why}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>

        <Card>
          <CardHead title="Fase 1 vs fase 2" />
          <div className="flex flex-col gap-3 p-4 text-[12px] leading-relaxed text-fg-secondary">
            <p>
              <span className="overline mr-1.5 text-foreground">Fase 1 — MCP</span>
              Sin registro, sin facturación, sin soporte. Solo lectura de lo que ya existe, para los
              clientes que ya están dentro. Sirve para validar el valor antes de construir producto.
            </p>
            <p>
              <span className="overline mr-1.5 text-foreground">Fase 2 — SaaS</span>
              Cuentas, permisos por cliente, panel propio y cobro. Se construye con lo que enseñe la
              fase 1.
            </p>
            <Note>
              Cada cliente tiene sus herramientas repartidas a lo loco. La capa no le obliga a
              cambiarlas ni se las enseña: las lee donde estén y aquí solo se ve el dato.
            </Note>
          </div>
        </Card>
      </div>
    </div>
  );
}
