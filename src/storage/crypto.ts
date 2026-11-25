// AES-GCM 256 encryption using Web Crypto for private backup files (.kbbackup).
// Everything stays in the browser; nothing is ever sent to a server.

const MAGIC = 'KBHELPER_ENC_V1';

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 210_000, hash: 'SHA-256' },
    keyMat,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptBackup(payload: unknown, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plain = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  return JSON.stringify({
    format: MAGIC,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(cipher),
  });
}

export async function decryptBackup<T>(raw: string, passphrase: string): Promise<T> {
  const parsed = JSON.parse(raw);
  if (parsed?.format !== MAGIC) throw new Error('This file is not a Katie Beckett Helper backup.');
  const salt = fromBase64(parsed.salt);
  const iv = fromBase64(parsed.iv);
  const cipher = fromBase64(parsed.data);
  const key = await deriveKey(passphrase, salt);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, cipher as BufferSource);
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    throw new Error('That passphrase did not unlock this backup. Please double-check it and try again.');
  }
}

export { toBase64, fromBase64 };
