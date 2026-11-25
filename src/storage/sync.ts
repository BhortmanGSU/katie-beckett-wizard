// Client-side bridge to the built-in local web server (electron/server.cjs).
// When the app is served statically (e.g. GitHub Pages), `detectServer()` returns
// `{ mode: 'static' }` and storage falls back to IndexedDB automatically.

export interface LanAddress {
  label: string;
  ip: string;
  url: string;
  pairUrl: string;
}

export interface ServerInfo {
  port: number;
  pin: string;
  addresses: LanAddress[];
}

export type ServerStatus =
  | { mode: 'static' }
  | { mode: 'local-server'; unlocked: boolean; isLocalhost: boolean };

const PIN_KEY = 'kb_helper_family_pin';
const CLIENT_ID = Math.random().toString(36).slice(2, 10);

let serverMode: 'unknown' | 'static' | 'local-server' = 'unknown';

/** Pull ?pin=1234 from the QR code URL once, save it, and clean the URL bar. */
export function absorbPinFromUrl(): string {
  try {
    const u = new URL(window.location.href);
    const fromUrl = u.searchParams.get('pin');
    if (fromUrl && /^\d{4}$/.test(fromUrl)) {
      localStorage.setItem(PIN_KEY, fromUrl);
      u.searchParams.delete('pin');
      window.history.replaceState({}, '', u.pathname + u.search + u.hash);
      return fromUrl;
    }
    return localStorage.getItem(PIN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function getSavedPin(): string {
  try {
    return localStorage.getItem(PIN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePin(pin: string) {
  try {
    localStorage.setItem(PIN_KEY, pin);
  } catch {
    // ignore
  }
}

export function isLocalServerActive(): boolean {
  return serverMode === 'local-server';
}

export async function detectServer(pinOverride?: string): Promise<ServerStatus> {
  const pin = pinOverride ?? absorbPinFromUrl();
  try {
    const res = await fetch('./api/ping', {
      headers: pin ? { 'X-KB-Pin': pin } : {},
      cache: 'no-store',
    });
    if (!res.ok) {
      serverMode = 'static';
      return { mode: 'static' };
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      serverMode = 'static';
      return { mode: 'static' };
    }
    const data = await res.json();
    if (data?.mode === 'local-server') {
      serverMode = 'local-server';
      if (pinOverride && data.unlocked) savePin(pinOverride);
      return {
        mode: 'local-server',
        unlocked: Boolean(data.unlocked),
        isLocalhost: Boolean(data.isLocalhost),
      };
    }
  } catch {
    // static mode
  }
  serverMode = 'static';
  return { mode: 'static' };
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const pin = getSavedPin();
  return fetch(`./${path.replace(/^\/+/, '')}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      'X-KB-Pin': pin,
      'X-KB-Client': CLIENT_ID,
    },
    cache: 'no-store',
  });
}

export async function fetchServerInfo(): Promise<ServerInfo | null> {
  if (!isLocalServerActive()) return null;
  const res = await apiFetch('api/info');
  if (!res.ok) return null;
  return res.json();
}

export async function fetchFirewallStatus(): Promise<{ supported: boolean; allowed: boolean }> {
  if (!isLocalServerActive()) return { supported: false, allowed: true };
  try {
    const res = await apiFetch('api/firewall/status');
    if (res.ok) return res.json();
  } catch {
    // ignore
  }
  return { supported: false, allowed: true };
}

export async function requestFirewallAllow(): Promise<{ supported: boolean; allowed: boolean }> {
  const res = await apiFetch('api/firewall/allow', { method: 'POST' });
  if (!res.ok) return { supported: true, allowed: false };
  return res.json();
}

/** Subscribe to real-time updates from other devices (phone <-> desktop). */
export function subscribeLiveSync(onEvent: (kind: 'state' | 'docs' | 'clear') => void): () => void {
  if (!isLocalServerActive()) return () => {};
  const pin = getSavedPin();
  if (!pin) return () => {};
  const es = new EventSource(`./api/events?pin=${encodeURIComponent(pin)}`);
  const handle = (kind: 'state' | 'docs' | 'clear') => (ev: MessageEvent) => {
    try {
      const payload = JSON.parse(ev.data || '{}');
      if (payload.senderId === CLIENT_ID) return; // ignore our own echo
    } catch {
      // ignore
    }
    onEvent(kind);
  };
  es.addEventListener('state', handle('state'));
  es.addEventListener('docs', handle('docs'));
  es.addEventListener('clear', handle('clear'));
  return () => es.close();
}
