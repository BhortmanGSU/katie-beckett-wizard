import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { emptyProfile, type Profile } from '../profile';
import type { FreshnessReport } from '../docs/freshness';
import { encryptBackup, decryptBackup, toBase64, fromBase64 } from './crypto';
import { apiFetch, isLocalServerActive } from './sync';

export interface StoredDocument {
  id: string;
  slotId: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string; // ISO
  /** Document/signature date entered by parent or detected by OCR (YYYY-MM-DD). */
  documentDate: string;
  extractedText: string;
  freshness: FreshnessReport;
  bytes: Uint8Array;
}

export interface DeadlineDates {
  targetSubmitDate: string; // YYYY-MM-DD
  dma6aSignedDate: string; // YYYY-MM-DD (triggers 90-day clock!)
  evalDate: string; // YYYY-MM-DD (triggers 3-year window)
  submittedDate: string; // YYYY-MM-DD
  rfiNoticeDate: string; // YYYY-MM-DD (30-day reconsideration / RFI clock)
  approvalDate: string; // YYYY-MM-DD (triggers 1-year eligibility & 2-year LOC renewal)
}

export interface AppState {
  stateCode: string;
  currentStep: number;
  profile: Profile;
  signatureDataUrl: string; // transparent PNG data URL
  signatureWidth: number;
  signatureHeight: number;
  approvedForms: Record<string, boolean>;
  draftDoctorSections: boolean;
  deadlines: DeadlineDates;
  updatedAt: string;
}

interface HelperDB extends DBSchema {
  state: { key: string; value: AppState };
  docs: { key: string; value: StoredDocument; indexes: { bySlot: string } };
}

let dbPromise: Promise<IDBPDatabase<HelperDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<HelperDB>('katie-beckett-helper-v1', 1, {
      upgrade(db) {
        db.createObjectStore('state');
        const store = db.createObjectStore('docs', { keyPath: 'id' });
        store.createIndex('bySlot', 'slotId');
      },
    });
  }
  return dbPromise;
}

export function defaultAppState(): AppState {
  return {
    stateCode: 'GA',
    currentStep: 0,
    profile: emptyProfile(),
    signatureDataUrl: '',
    signatureWidth: 0,
    signatureHeight: 0,
    approvedForms: {},
    draftDoctorSections: true,
    deadlines: {
      targetSubmitDate: '',
      dma6aSignedDate: '',
      evalDate: '',
      submittedDate: '',
      rfiNoticeDate: '',
      approvalDate: '',
    },
    updatedAt: new Date().toISOString(),
  };
}

function mergeWithDefaults(saved: Partial<AppState> | null | undefined): AppState {
  const base = defaultAppState();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    profile: {
      ...base.profile,
      ...saved.profile,
      child: { ...base.profile.child, ...saved.profile?.child },
      applicant: { ...base.profile.applicant, ...saved.profile?.applicant },
      health: {
        ...base.profile.health,
        ...saved.profile?.health,
        therapies: { ...base.profile.health.therapies, ...saved.profile?.health?.therapies },
        systems: { ...base.profile.health.systems, ...saved.profile?.health?.systems },
      },
      insurance: { ...base.profile.insurance, ...saved.profile?.insurance },
      tax: { ...base.profile.tax, ...saved.profile?.tax },
      physician: { ...base.profile.physician, ...saved.profile?.physician },
      costs: { ...base.profile.costs, ...saved.profile?.costs },
    },
    deadlines: { ...base.deadlines, ...saved.deadlines },
  };
}

export async function loadAppState(): Promise<AppState> {
  if (isLocalServerActive()) {
    const res = await apiFetch('api/state');
    if (res.ok) {
      const data = await res.json();
      return mergeWithDefaults(data.state);
    }
  }
  const db = await getDb();
  const saved = await db.get('state', 'main');
  return mergeWithDefaults(saved);
}

export async function saveAppState(state: AppState): Promise<void> {
  const payload = { ...state, updatedAt: new Date().toISOString() };
  if (isLocalServerActive()) {
    await apiFetch('api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return;
  }
  const db = await getDb();
  await db.put('state', payload, 'main');
}

export async function listDocuments(): Promise<StoredDocument[]> {
  if (isLocalServerActive()) {
    const res = await apiFetch('api/docs');
    if (res.ok) {
      const data = await res.json();
      return (data.docs ?? []).map((d: Omit<StoredDocument, 'bytes'> & { bytesB64: string }) => {
        const { bytesB64, ...meta } = d;
        return { ...meta, bytes: bytesB64 ? fromBase64(bytesB64) : new Uint8Array() };
      });
    }
  }
  const db = await getDb();
  return db.getAll('docs');
}

export async function saveDocument(doc: StoredDocument): Promise<void> {
  if (isLocalServerActive()) {
    const { bytes, ...meta } = doc;
    await apiFetch('api/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...meta, bytesB64: toBase64(bytes) }),
    });
    return;
  }
  const db = await getDb();
  await db.put('docs', doc);
}

export async function deleteDocument(id: string): Promise<void> {
  if (isLocalServerActive()) {
    await apiFetch(`api/docs/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return;
  }
  const db = await getDb();
  await db.delete('docs', id);
}

export async function clearAllData(): Promise<void> {
  if (isLocalServerActive()) {
    await apiFetch('api/clear', { method: 'POST' });
    return;
  }
  const db = await getDb();
  await db.clear('state');
  await db.clear('docs');
}

export async function exportEncryptedBackup(state: AppState, docs: StoredDocument[], passphrase: string): Promise<string> {
  const serialDocs = docs.map((d) => ({ ...d, bytes: toBase64(d.bytes) }));
  return encryptBackup({ state, docs: serialDocs, exportedAt: new Date().toISOString() }, passphrase);
}

export async function importEncryptedBackup(raw: string, passphrase: string): Promise<{ state: AppState; docs: StoredDocument[] }> {
  const data = await decryptBackup<{ state: AppState; docs: (Omit<StoredDocument, 'bytes'> & { bytes: string })[] }>(
    raw,
    passphrase,
  );
  const docs: StoredDocument[] = (data.docs ?? []).map((d) => ({ ...d, bytes: fromBase64(d.bytes) }));
  await clearAllData();
  await saveAppState(data.state);
  for (const d of docs) await saveDocument(d);
  return { state: data.state, docs };
}
