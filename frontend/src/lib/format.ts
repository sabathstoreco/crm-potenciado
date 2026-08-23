/** Formateo consistente. Todo número que se compare en columna usa tabular-nums. */

export const money = (n: number, currency = 'USD', decimals = 0) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    // Sin esto, es-MX desambigua y escribe "USD 273,600" en vez de "$273,600".
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);

export const num = (n: number) => new Intl.NumberFormat('es-MX').format(n);

export const pct = (n: number, decimals = 0) =>
  `${new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)}%`;

/**
 * Texto en blanco o negro sobre un color arbitrario del cliente.
 *
 * Umbral de luminancia 0.1791: es el punto donde el contraste con blanco y con
 * negro se igualan en 4.58:1. Por encima gana el negro, por debajo el blanco, y
 * cualquiera de los dos supera el 4.5:1 de AA. Ver DESIGN.md §13.2 — por eso el
 * color del tenant se usa solo como fondo y nunca hace falta derivarlo.
 */
export function onTenantColor(hex: string): '#000000' | '#FFFFFF' {
  const h = hex.replace('#', '');
  const ch = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
  return l > 0.1791 ? '#000000' : '#FFFFFF';
}
