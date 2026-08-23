'use client';

import { Plus, Search } from 'lucide-react';
import {
  BarList,
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
import { money, num, pct } from '@/lib/format';
import type { CalendarData, ContentData, SlotState, Tenant } from '@/lib/types';

/* ═══ Contenido ═══════════════════════════════════════════════ */

export function ContentScreen({ data, tenant }: { data: ContentData; tenant: Tenant }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contenido"
        lede="Cada pieza lleva dolor, ángulo y tema. Sin esos tres campos no se sabe qué repetir cuando algo funciona."
        actions={
          <>
            <Button variant="secondary">
              <Search size={14} aria-hidden /> Buscar pieza
            </Button>
            <Button variant="primary">
              <Plus size={14} aria-hidden /> Nueva pieza
            </Button>
          </>
        }
      />

      <KpiGrid items={data.kpis} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Rendimiento por ángulo" aside="Ventas atribuidas" />
          <BarList rows={data.angles} />
        </Card>
        <Card>
          <CardHead title="Hook · Contexto · CTA" aside="Media del periodo" />
          <BarList rows={data.hcc} />
        </Card>
      </div>

      <Card>
        <CardHead title="Piezas del periodo" aside="Clic para ver detalle" />
        <TableWrap>
          <thead>
            <tr>
              <Th>Pieza</Th>
              <Th>Cuenta</Th>
              <Th>Ángulo</Th>
              <Th>Dolor</Th>
              <Th align="right">Hook 3s</Th>
              <Th align="right">Coment.</Th>
              <Th align="right">Ventas</Th>
              <Th align="right">Atribuido</Th>
            </tr>
          </thead>
          <tbody>
            {data.pieces.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-raised">
                <Td strong>{p.title}</Td>
                <Td>{p.channel}</Td>
                <Td>
                  <span className="inline-flex rounded-sm border border-border-strong px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.07em] text-fg-secondary">
                    {p.angle}
                  </span>
                </Td>
                <Td>{p.pain}</Td>
                <Td align="right" className="tabular">
                  {pct(p.hook3s)}
                </Td>
                <Td align="right" className="tabular">
                  {num(p.comments)}
                </Td>
                <Td align="right" className="tabular" strong>
                  {p.sales}
                </Td>
                <Td align="right" className="tabular">
                  {money(p.revenue, tenant.currency)}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}

/* ═══ Calendario ══════════════════════════════════════════════ */

const slotStyle: Record<SlotState, string> = {
  published: 'border-l-success',
  scheduled: 'border-l-info',
  editing: 'border-l-warning',
  blocked: 'border-l-danger',
  idle: 'border-l-border-strong',
};

export function CalendarScreen({ data, tenant }: { data: CalendarData; tenant: Tenant }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendario de publicación"
        lede="Todas las cuentas del cliente en una vista. Se programa desde aquí y sale a todas las redes a la vez."
        actions={
          <>
            <Button variant="secondary">Semana</Button>
            <Button variant="primary">Programar</Button>
          </>
        }
      />

      <KpiGrid items={data.kpis} />

      <Card>
        <CardHead title="Semana en curso" aside={`${tenant.channels} cuentas`} />
        {/* UX.md §5.3 — en móvil el mes no entra: se muestra agenda vertical. */}
        <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-4 lg:grid-cols-7">
          {data.week.map((day) => (
            <div key={day.label} className="flex min-h-[132px] flex-col gap-2 bg-surface p-3">
              <span className="overline text-fg-muted">{day.label}</span>
              {day.slots.length === 0 ? (
                <span className="text-[11px] text-fg-disabled">—</span>
              ) : (
                day.slots.map((s) => (
                  <div
                    key={s.title}
                    className={`flex flex-col gap-0.5 border-l-2 bg-raised px-2.5 py-2 ${slotStyle[s.state]}`}
                  >
                    <span className="text-[12px] font-semibold leading-snug text-foreground">
                      {s.title}
                    </span>
                    <span className="text-[11px] text-fg-muted">
                      {s.channel}
                      {s.meta ? ` · ` : ''}
                      {s.meta ? (
                        <span className={s.state === 'blocked' ? 'font-bold text-danger' : ''}>
                          {s.meta}
                        </span>
                      ) : null}
                    </span>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
        <div className="p-4">
          <Note>{data.note}</Note>
        </div>
      </Card>
    </div>
  );
}
