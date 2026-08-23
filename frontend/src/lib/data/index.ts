import type { Tenant, TenantDataset, User } from '@/lib/types';
import { vyma } from './vyma';
import { vive } from './vive';
import { raiz } from './raiz';

/**
 * Tres clientes con embudos distintos, no solo con números distintos.
 * Cambiar de cuenta cambia qué se mide, no únicamente cuánto.
 */
export const tenants: Tenant[] = [
  {
    id: 'vyma',
    slug: 'vyma-media',
    name: 'Vyma Media',
    initials: 'VM',
    color: '#1E40AF',
    funnelType: 'agency',
    funnelLabel: 'Agencia',
    currency: 'USD',
    channels: 5,
    modules: { calls: true, closers: true, checkout: false },
  },
  {
    id: 'vive',
    slug: 'clinicas-vive',
    name: 'Clínicas Vive',
    initials: 'CV',
    color: '#0F766E',
    funnelType: 'consulting',
    funnelLabel: 'Consultoría',
    currency: 'USD',
    channels: 3,
    modules: { calls: true, closers: true, checkout: false },
  },
  {
    id: 'raiz',
    slug: 'metodo-raiz',
    name: 'Método Raíz',
    initials: 'MR',
    color: '#B45309',
    funnelType: 'infoproduct',
    funnelLabel: 'Infoproducto',
    currency: 'USD',
    channels: 4,
    modules: { calls: false, closers: false, checkout: true },
  },
];

const datasets: Record<string, TenantDataset> = { vyma, vive, raiz };

export const getTenant = (id: string): Tenant =>
  tenants.find((t) => t.id === id) ?? tenants[0];

export const getDataset = (id: string): TenantDataset => datasets[id] ?? datasets.vyma;

/**
 * Usuarios de demostración.
 *
 * `platformRole` y `accountRole` son ejes independientes: el primero define qué
 * puede hacer alguien por encima de los tenants, el segundo qué puede hacer
 * dentro de uno. Ver docs/06.
 */
export const users: User[] = [
  {
    id: 'u-admin',
    name: 'Yamil',
    email: 'admin@yamilos.demo',
    password: 'Demo2026!',
    platformRole: 'admin',
    accountRole: 'owner',
    tenantIds: ['vyma', 'vive', 'raiz'],
  },
  {
    id: 'u-owner',
    name: 'Mariana Soto',
    email: 'mariana@vyma.demo',
    password: 'Demo2026!',
    platformRole: 'none',
    accountRole: 'owner',
    tenantIds: ['vyma'],
  },
  {
    id: 'u-closer',
    name: 'Diego Álvarez',
    email: 'diego@vive.demo',
    password: 'Demo2026!',
    platformRole: 'none',
    accountRole: 'closer',
    tenantIds: ['vive'],
  },
];

export { vyma, vive, raiz };
