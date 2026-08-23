'use client';

import { useState } from 'react';
import { authenticate } from '@/lib/auth';
import type { Session } from '@/lib/types';

export function LoginForm({ onAuthenticated }: { onAuthenticated: (s: Session) => void }) {
  const [email, setEmail] = useState('admin@yamilos.demo');
  const [password, setPassword] = useState('Demo2026!');
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const session = authenticate(email, password);
    if (!session) {
      setError('Ese correo y contraseña no coinciden. Revisá los datos e intentá de nuevo.');
      return;
    }
    setError(null);
    onAuthenticated(session);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-[380px] flex-col items-center gap-6">
        <svg viewBox="0 0 48 48" width={44} height={44} aria-label="Yamil OS" role="img">
          <rect width="48" height="48" rx="11.5" fill="#DB0F2A" />
          <g stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M14.5 14.5 L24 26 L33.5 14.5" />
            <path d="M24 26 L24 34.5" />
          </g>
        </svg>

        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-display text-[26px]">
            YAMIL <span className="text-brand-text">OS</span>
          </h1>
          <p className="text-[13px] text-fg-muted">Entrá a tu negocio</p>
        </div>

        <form onSubmit={submit} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="overline text-fg-muted">
              Correo
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[44px] rounded-md border border-border-strong bg-surface px-3 text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="overline text-fg-muted">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px] rounded-md border border-border-strong bg-surface px-3 text-foreground"
            />
          </div>

          {error ? (
            <p role="alert" className="text-[12px] text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="min-h-[44px] cursor-pointer rounded-md bg-brand font-bold text-on-brand transition-colors hover:bg-brand-hover"
          >
            Continuar
          </button>
        </form>

        <p className="text-center text-[11px] leading-relaxed text-fg-disabled">
          Demo con datos ficticios. Tres cuentas con embudos distintos:
          <br />
          agencia, consultoría e infoproducto.
        </p>
      </div>
    </main>
  );
}
