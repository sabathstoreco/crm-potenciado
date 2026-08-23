'use client';

import { Download, Plus, Search, Zap } from 'lucide-react';
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
import type { LeadSignal, LeadsData, PipelineData } from '@/lib/types';

/* ═══ Pipeline ════════════════════════════════════════════════ */

export function PipelineScreen({ data }: { data: PipelineData }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pipeline"
        lede="Cada cambio de etapa dispara algo. Lo que dispara se setea por cliente, porque no todos venden lo mismo."
        actions={
          <>
            <Button variant="secondary">
              <Zap size={14} aria-hidden /> Automatizaciones
            </Button>
            <Button variant="primary">
              <Plus size={14} aria-hidden /> Nuevo lead
            </Button>
          </>
        }
      />

      <KpiGrid items={data.kpis} />

      <Card>
        <CardHead title="Tablero" aside={`${data.stages.length} etapas`} />
        {/* UX.md §5.2 — en móvil el kanban horizontal es inusable con drag táctil:
            las etapas se apilan. En md+ vuelven las columnas. */}
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
          {data.stages.map((stage) => (
            <div key={stage.name} className="flex min-h-[150px] flex-col gap-2 bg-surface p-3">
              <div className="flex items-center justify-between">
                <span className="overline text-fg-muted">{stage.name}</span>
                <span className="tabular text-[11px] text-fg-disabled">{stage.cards.length}</span>
              </div>
              {stage.cards.map((c) => (
                <div
                  key={c.name}
                  className={`flex flex-col gap-1 rounded-md border bg-raised px-3 py-2.5 ${
                    c.hot ? 'border-brand-text' : 'border-border-strong'
                  }`}
                >
                  <span className="text-[12px] font-semibold text-foreground">{c.name}</span>
                  <span className="tabular text-[11px] text-fg-muted">{c.meta}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Automatización por etapa" />
          <TableWrap minW={420}>
            <thead>
              <tr>
                <Th>Etapa</Th>
                <Th>Disparo</Th>
                <Th align="right">Estado</Th>
              </tr>
            </thead>
            <tbody>
              {data.automations.map((a) => (
                <tr key={a.stage}>
                  <Td strong>{a.stage}</Td>
                  <Td>{a.trigger}</Td>
                  <Td align="right">
                    <Badge tone={a.state === 'active' ? 'neutral' : 'alert'}>
                      {a.state === 'active' ? 'Activa' : 'Sin setear'}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>

        <Card>
          <CardHead title="Secuencia de confirmación" />
          {data.confirmSequence ? (
            <div className="flex flex-col gap-4 p-4">
              <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {data.confirmSequence.steps.map((s, i) => (
                  <li
                    key={s.when}
                    className={`flex flex-col gap-1 rounded-md border px-3 py-2.5 ${
                      i === 0 ? 'border-border-strong bg-raised' : 'border-border'
                    }`}
                  >
                    <span className="overline text-foreground">{s.when}</span>
                    <span className="text-[11px] text-fg-muted">{s.what}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-col gap-2">
                {data.confirmSequence.notes.map((n) => (
                  <Note key={n}>{n}</Note>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <Note>
                Este embudo no agenda llamadas, así que no hay secuencia de confirmación. Lo que
                sustituye a los recordatorios es la recuperación de carrito, que vive en las
                automatizaciones de la izquierda.
              </Note>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ═══ Leads y customer journey ════════════════════════════════ */

const signalMap: Record<LeadSignal, { label: string; tone: 'alert' | 'warn' | 'info' | 'neutral' }> =
  {
    'reach-out': { label: 'Reach out ya', tone: 'alert' },
    hot: { label: 'Caliente', tone: 'warn' },
    warming: { label: 'Calentando', tone: 'info' },
    cold: { label: 'Frío', tone: 'neutral' },
  };

export function LeadsScreen({ data }: { data: LeadsData }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leads y customer journey"
        lede="Cuántos recursos pidió, cuánto contenido consumió y cuánto tardó desde que te siguió hasta que pagó."
        actions={
          <>
            <Button variant="secondary">
              <Search size={14} aria-hidden /> Buscar lead
            </Button>
            <Button variant="primary">
              <Download size={14} aria-hidden /> Exportar segmento
            </Button>
          </>
        }
      />

      <KpiGrid items={data.kpis} />

      <Card>
        <CardHead title="Leads" aside="Clic en una fila para ver el journey" />
        <TableWrap>
          <thead>
            <tr>
              <Th>Lead</Th>
              <Th>Entró por</Th>
              <Th align="right">Etiquetas</Th>
              <Th align="right">Recursos</Th>
              <Th align="right">Días</Th>
              <Th>Etapa</Th>
              <Th align="right">Señal</Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => {
              const sig = signalMap[r.signal];
              const complete = r.tags === r.tagsTotal;
              return (
                <tr key={r.handle} className="transition-colors hover:bg-raised">
                  <Td strong>{r.handle}</Td>
                  <Td>{r.enteredBy}</Td>
                  <Td align="right">
                    <span className={`tabular ${complete ? 'font-bold text-foreground' : ''}`}>
                      {r.tags}/{r.tagsTotal}
                    </span>
                  </Td>
                  <Td align="right" className="tabular">
                    {r.resources}
                  </Td>
                  <Td align="right" className="tabular">
                    {r.days}
                  </Td>
                  <Td>
                    <Badge>{r.stage}</Badge>
                  </Td>
                  <Td align="right">
                    <Badge tone={sig.tone}>{sig.label}</Badge>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
        <div className="p-4">
          <Note>{data.note}</Note>
        </div>
      </Card>
    </div>
  );
}
