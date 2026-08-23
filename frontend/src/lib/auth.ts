import { users } from '@/lib/data';
import type { Session, User } from '@/lib/types';

const KEY = 'yamil-os.session';

/** Copia sin la contraseña. Se construye explícitamente en vez de destructurar
 *  para no dejar una variable sin usar. */
const publicUser = (u: User): Omit<User, 'password'> => ({
  id: u.id,
  name: u.name,
  email: u.email,
  platformRole: u.platformRole,
  accountRole: u.accountRole,
  tenantIds: u.tenantIds,
});

/** Sesión de demostración. En producción esto lo emite el backend con un JWT. */
export function authenticate(email: string, password: string): Session | null {
  const found = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  );
  if (!found) return null;
  return { user: publicUser(found), activeTenantId: found.tenantIds[0] };
}

export function demoSession(): Session {
  const admin = users[0];
  return { user: publicUser(admin), activeTenantId: admin.tenantIds[0] };
}

/* ── Store externo para useSyncExternalStore ───────────────────
   localStorage es un store fuera de React. Leerlo en un efecto y llamar a
   setState provoca un render en cascada; useSyncExternalStore es la API
   pensada para esto y además resuelve la hidratación con su snapshot de
   servidor. */

const listeners = new Set<() => void>();
let cache: string | null = null;
let parsed: Session | null = null;

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    // Ventana privada o almacenamiento bloqueado.
    return null;
  }
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener('storage', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', fn);
  };
}

/** Devuelve la misma referencia mientras el string no cambie: si no,
 *  useSyncExternalStore entra en bucle. */
export function getSnapshot(): Session | null {
  const raw = read();
  if (raw !== cache) {
    cache = raw;
    try {
      parsed = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      parsed = null;
    }
  }
  return parsed;
}

export function getServerSnapshot(): Session | null {
  return null;
}

export function writeSession(session: Session | null) {
  try {
    if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* no bloquea la app */
  }
  cache = session ? JSON.stringify(session) : null;
  parsed = session;
  listeners.forEach((fn) => fn());
}
