import { describe, expect, it } from 'vitest';
import { authenticate } from '@/lib/auth';
import { getDataset, tenants } from '@/lib/data';
import { onTenantColor } from '@/lib/format';

describe('autenticación', () => {
  it('acepta credenciales válidas y no expone la contraseña', () => {
    const s = authenticate('admin@yamilos.demo', 'Demo2026!');
    expect(s).not.toBeNull();
    expect(s!.user).not.toHaveProperty('password');
  });

  it('rechaza una contraseña incorrecta', () => {
    expect(authenticate('admin@yamilos.demo', 'mala')).toBeNull();
  });

  it('ignora mayúsculas en el correo', () => {
    expect(authenticate('ADMIN@YamilOS.demo', 'Demo2026!')).not.toBeNull();
  });
});

describe('datos por cliente', () => {
  it('cada cliente tiene su propio dataset', () => {
    const vistos = new Set(tenants.map((t) => getDataset(t.id).content.kpis[0].value));
    expect(vistos.size).toBe(tenants.length);
  });

  it('el infoproducto no tiene llamadas ni secuencia de confirmación', () => {
    const raiz = getDataset('raiz');
    expect(raiz.calls).toBeNull();
    expect(raiz.pipeline.confirmSequence).toBeNull();
  });

  it('los embudos con llamadas sí las tienen', () => {
    expect(getDataset('vyma').calls).not.toBeNull();
    expect(getDataset('vive').calls).not.toBeNull();
  });

  it('las ventas por ángulo suman las ventas atribuidas de cada cliente', () => {
    for (const t of tenants) {
      const d = getDataset(t.id);
      const suma = d.content.angles.reduce((a, x) => a + x.value, 0);
      const kpi = d.content.kpis.find((k) => k.label === 'Ventas atribuidas');
      expect(Number(kpi!.value.replace(/,/g, ''))).toBe(suma);
    }
  });

  it('el gasto de las campañas suma la inversión declarada', () => {
    for (const t of tenants) {
      const d = getDataset(t.id);
      const suma = d.ads.campaigns.reduce((a, c) => a + c.spend, 0);
      const kpi = d.ads.kpis.find((k) => k.label === 'Inversión');
      expect(Number(kpi!.value.replace(/[$,]/g, ''))).toBe(suma);
    }
  });
});

describe('color del tenant', () => {
  it('elige texto legible sobre cualquier color de marca', () => {
    expect(onTenantColor('#FFEE00')).toBe('#000000');
    expect(onTenantColor('#1E40AF')).toBe('#FFFFFF');
    expect(onTenantColor('#FFFFFF')).toBe('#000000');
    expect(onTenantColor('#000000')).toBe('#FFFFFF');
  });

  it('todos los colores de cliente reciben un texto definido', () => {
    for (const t of tenants) {
      expect(['#000000', '#FFFFFF']).toContain(onTenantColor(t.color));
    }
  });
});
