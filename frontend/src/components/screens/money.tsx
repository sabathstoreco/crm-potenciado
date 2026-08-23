'use client';

import { FileDown, LayoutGrid, PhoneOff, ScrollText, Sparkles } from 'lucide-react';
import {
  Badge,
  BarList,
  Button,
  Card,
  CardHead,
  EmptyState,
  KpiGrid,
  Note,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from '@/components/ui/primitives';
import { money, num, pct } from '@/lib/format';
import type { AdsData, CallRow, CallsData, Tenant } from '@/lib/types';

/* ═══ Ads y costos ════════════════════════════════════════════ */

export function AdsScreen({ data }: { data: AdsData }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ads y costos"
        lede="Cuánto entra, cuánto sale y cuánto cuesta cada paso del embudo. Todo en la misma unidad: dinero."
        actions={
          <>
            <Button variant="secondary">
              <LayoutGrid size={14} aria-hidden /> Por campaña
            </Button>
            <Button variant="primary">
              <FileDown size={14} aria-hidden /> Exportar P&amp;L
            </Button>
          </>
        }
      />

      <KpiGrid items={data.kpis} />

      <Card>
        <CardHead title="Campañas activas" aside="Ordenable" />
        <TableWrap>
          <thead>
            <tr>
              <Th>Campaña</Th>
              <Th>Ángulo</Th>
              <Th align="right">Gasto</Th>
              <Th align="right">CTR</Th>
              <Th align="right">Leads</Th>
              <Th align="right">Agendas</Th>
              <Th align="right">Cierres</Th>
              <Th align="right">CAC</Th>
            </tr>
          </thead>
          <tbody>
            {data.campaigns.map((c) => (
              <tr key={c.name} className="transition-colors hover:bg-raised">
                <Td strong>{c.name}</Td>
                <Td>{c.angle}</Td>
                <Td align="right" className="tabular">
                  {money(c.spend, data.currency)}
                </Td>
                <Td align="right" className="tabular">
                  {pct(c.ctr, 1)}
                </Td>
                <Td align="right" className="tabular">
                  {num(c.leads)}
                </Td>
                <Td align="right" className="tabular">
                  {c.bookings === null ? <span className="text-fg-disabled">—</span> : num(c.bookings)}
                </Td>
                <Td align="right" className="tabular" strong>
                  {c.closes}
                </Td>
                <Td align="right" className="tabular">
                  {c.closes === 0 ? (
                    <span className="text-fg-disabled">—</span>
                  ) : (
                    money(c.spend / c.closes, data.currency)
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        {data.alert ? (
          <div className="p-4">
            <Note tone="alert">{data.alert}</Note>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

/* ═══ Llamadas y closers ══════════════════════════════════════ */

const resultTone: Record<CallRow['result'], 'ok' | 'alert' | 'warn' | 'neutral'> = {
  won: 'ok',
  objection: 'alert',
  'follow-up': 'warn',
  'no-show': 'neutral',
};

export function CallsScreen({ data, tenant }: { data: CallsData | null; tenant: Tenant }) {
  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Llamadas y closers"
          lede="Cada llamada deja dos cosas: una decisión de venta y un dato sobre quién la tomó."
        />
        <EmptyState
          icon={<PhoneOff size={36} strokeWidth={1.5} aria-hidden />}
          title="Este embudo no agenda llamadas"
          body={`${tenant.name} vende por checkout directo: del contenido a la landing y de la landing al pago, sin que nadie del equipo intervenga. Por eso su costo por cliente es una fracción del de una cuenta con closers.`}
          action={
            <Button variant="secondary">
              <Sparkles size={14} aria-hidden /> Ver el embudo de esta cuenta
            </Button>
          }
        />
        <Note>
          No se muestran ceros porque no hay cero llamadas: no aplica la métrica. Mostrar
          &ldquo;0 cierres&rdquo; haría creer que algo va mal cuando el embudo funciona como fue
          diseñado.
        </Note>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Llamadas y closers"
        lede="Cada llamada deja dos cosas: una decisión de venta y un dato sobre quién la tomó."
        actions={
          <>
            <Button variant="secondary">
              <ScrollText size={14} aria-hidden /> Transcripciones
            </Button>
            <Button variant="primary">Auditar llamada</Button>
          </>
        }
      />

      <KpiGrid items={data.kpis} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Rendimiento por persona" />
          <TableWrap minW={460}>
            <thead>
              <tr>
                <Th>Quién</Th>
                <Th align="right">Calls</Th>
                <Th align="right">Cierre</Th>
                <Th>Objeción dominante</Th>
                <Th align="right">Acción</Th>
              </tr>
            </thead>
            <tbody>
              {data.closers.map((c) => (
                <tr key={c.name}>
                  <Td strong>{c.name}</Td>
                  <Td align="right" className="tabular">
                    {c.calls}
                  </Td>
                  <Td align="right" className="tabular" strong>
                    {pct(Math.round((c.closes / c.calls) * 100))}
                  </Td>
                  <Td>{c.topObjection}</Td>
                  <Td align="right">
                    <Badge
                      tone={
                        c.action.tone === 'ok' ? 'ok' : c.action.tone === 'watch' ? 'warn' : 'alert'
                      }
                    >
                      {c.action.label}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>

        <Card>
          <CardHead title="Dónde se cae la llamada" />
          <BarList rows={data.objections} />
          <div className="px-4 pb-4">
            <Note tone="alert">{data.insight}</Note>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="Últimas llamadas" />
        <TableWrap>
          <thead>
            <tr>
              <Th>Fecha</Th>
              <Th>Prospecto</Th>
              <Th>Producto</Th>
              <Th>Quién</Th>
              <Th>Trajo</Th>
              <Th align="right">Resultado</Th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((r, i) => (
              <tr key={`${r.prospect}-${i}`} className="transition-colors hover:bg-raised">
                <Td className="tabular">{r.date}</Td>
                <Td strong>{r.prospect}</Td>
                <Td>{r.product}</Td>
                <Td>{r.who}</Td>
                <Td>{r.broughtBy}</Td>
                <Td align="right">
                  <Badge tone={resultTone[r.result]}>{r.resultLabel}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
