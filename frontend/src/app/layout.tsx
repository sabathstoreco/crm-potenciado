import type { Metadata, Viewport } from 'next';
import { Fjalla_One, Nunito } from 'next/font/google';
import './globals.css';

const fjalla = Fjalla_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-fjalla',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Yamil OS',
  description:
    'Una capa central de información para negocios liderados por contenido: de la pieza al lead, del lead a la venta.',
};

// UX.md §3 — el zoom del usuario nunca se deshabilita.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fjalla.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
