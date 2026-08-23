'use client';

import { useSyncExternalStore } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { AppShell } from '@/components/layouts/app-shell';
import { getServerSnapshot, getSnapshot, subscribe, writeSession } from '@/lib/auth';

export default function Home() {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!session) {
    return <LoginForm onAuthenticated={(s) => writeSession(s)} />;
  }

  return <AppShell initialSession={session} onLogout={() => writeSession(null)} />;
}
