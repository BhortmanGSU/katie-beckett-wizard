import { useState } from 'react';
import {
  clearAllData,
  exportEncryptedBackup,
  importEncryptedBackup,
  type AppState,
  type StoredDocument,
} from '../storage/db';
import { downloadText, todayIso } from '../utils/download';

interface FileSystemWritable {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}
interface FileHandleLike {
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<FileSystemWritable>;
}

declare global {
  interface Window {
    showSaveFilePicker?: (opts?: unknown) => Promise<FileHandleLike>;
    showOpenFilePicker?: (opts?: unknown) => Promise<FileHandleLike[]>;
  }
}

interface Props {
  state: AppState;
  docs: StoredDocument[];
  onClose: () => void;
  onRestored: (state: AppState, docs: StoredDocument[]) => void;
  onCleared: () => void;
}

export function BackupModal({ state, docs, onClose, onRestored, onCleared }: Props) {
  const [passphrase, setPassphrase] = useState('');
  const [importPass, setImportPass] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [linkedHandle, setLinkedHandle] = useState<FileHandleLike | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const supportsFilePicker = typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';
  const fileName = `katie-beckett-sync-${todayIso()}.kbbackup`;

  const saveToDriveOrDownload = async (mode: 'picker' | 'share' | 'download') => {
    setError('');
    setStatus('');
    if (passphrase.length < 6) {
      setError('Please pick a passphrase at least 6 characters long to protect your child’s info.');
      return;
    }
    setBusy(true);
    try {
      const encrypted = await exportEncryptedBackup(state, docs, passphrase);

      if (mode === 'picker' && window.showSaveFilePicker) {
        let handle = linkedHandle;
        if (!handle) {
          handle = await window.showSaveFilePicker({
            suggestedName: 'katie-beckett-family.kbbackup',
            types: [{ description: 'Katie Beckett Encrypted Sync File', accept: { 'application/json': ['.kbbackup'] } }],
          });
          setLinkedHandle(handle);
        }
        const writable = await handle.createWritable();
        await writable.write(encrypted);
        await writable.close();
        setStatus(`Saved & encrypted to "${handle.name}"! Open that same file on your phone or other computer to continue.`);
        return;
      }

      if (mode === 'share' && navigator.share && navigator.canShare) {
        const file = new File([encrypted], 'katie-beckett-family.kbbackup', { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Katie Beckett Helper Backup',
            text: 'Encrypted Katie Beckett packet backup (passphrase protected).',
            files: [file],
          });
          setStatus('Shared! Choose Google Drive, iCloud Drive, OneDrive, or AirDrop to keep it synced across devices.');
          return;
        }
      }

      downloadText(encrypted, fileName, 'application/json');
      setStatus('Encrypted backup downloaded! Save it in your Google Drive, iCloud Drive, or OneDrive to open on another device.');
    } catch (e) {
      // User cancelled picker/share sheet -> ignore quietly
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Could not save backup.');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (overrideFile?: File) => {
    setError('');
    setStatus('');
    const targetFile = overrideFile ?? importFile;
    if (!targetFile) {
      setError('Choose your .kbbackup file from Google Drive, iCloud Drive, OneDrive, or your device first.');
      return;
    }
    if (!importPass) {
      setError('Enter the passphrase you used when saving this backup.');
      return;
    }
    setBusy(true);
    try {
      const raw = await targetFile.text();
      const restored = await importEncryptedBackup(raw, importPass);
      onRestored(restored.state, restored.docs);
      setStatus('Packet loaded! Everything is right where you left it.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open backup.');
    } finally {
      setBusy(false);
    }
  };

  const openViaPicker = async () => {
    setError('');
    if (!window.showOpenFilePicker) return;
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Katie Beckett Encrypted Sync File', accept: { 'application/json': ['.kbbackup'] } }],
      });
      setLinkedHandle(handle);
      const file = await handle.getFile();
      setImportFile(file);
      if (importPass) {
        await handleImport(file);
      } else {
        setStatus(`Selected "${file.name}". Enter your passphrase below and click Restore.`);
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Could not pick file.');
    }
  };

  const handleClear = async () => {
    await clearAllData();
    onCleared();
    onClose();
  };

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Sync, Backup and Privacy">
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h2>Sync &amp; Backup (Phone ↔ PC)</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <p style={{ fontSize: '0.92rem', color: 'var(--muted)' }}>
          Your child’s info never touches our servers. To switch smoothly between your phone and computer—or keep a safe
          copy—save one <strong>AES-256 encrypted file</strong> into your own{' '}
          <strong>Google Drive, iCloud Drive, or OneDrive</strong>.
        </p>

        {status && <div className="callout sage">{status}</div>}
        {error && <div className="callout danger">{error}</div>}

        {/* Save / Sync section */}
        <div className="sub-row">
          <h3 style={{ fontSize: '1.02rem' }}>1. Save to your Cloud Drive (or device)</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '0.65rem' }}>
            {linkedHandle
              ? `Linked sync file: ${linkedHandle.name} (updates in place — no duplicate files).`
              : 'Pick a passphrase only you know. Even if someone finds the file, it cannot be read without your passphrase.'}
          </p>
          <div className="field" style={{ marginBottom: '0.7rem' }}>
            <label htmlFor="bk-pass">Passphrase (at least 6 characters)</label>
            <input
              id="bk-pass"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="e.g. a memorable family phrase"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {supportsFilePicker && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={() => saveToDriveOrDownload('picker')}
              >
                {linkedHandle ? `Update "${linkedHandle.name}"` : 'Save to Google Drive / OneDrive / iCloud folder'}
              </button>
            )}
            {canShareFiles && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={() => saveToDriveOrDownload('share')}
              >
                Save to Drive / iCloud / AirDrop
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={busy}
              onClick={() => saveToDriveOrDownload('download')}
            >
              Download .kbbackup file
            </button>
          </div>
        </div>

        {/* Open / Restore section */}
        <div className="sub-row">
          <h3 style={{ fontSize: '1.02rem' }}>2. Open from your other device</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '0.65rem' }}>
            Open your <code>.kbbackup</code> file from Google Drive, iCloud Drive, or OneDrive to bring over your
            profile, signature, uploaded scans, and deadlines.
          </p>
          <div className="field" style={{ marginBottom: '0.55rem' }}>
            <label htmlFor="bk-file">Choose .kbbackup file</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {supportsFilePicker && (
                <button type="button" className="btn btn-outline btn-sm" onClick={openViaPicker}>
                  Pick from Drive / Folder
                </button>
              )}
              <input
                id="bk-file"
                type="file"
                accept=".kbbackup,application/json"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {importFile && <small>Selected: {importFile.name}</small>}
          </div>
          <div className="field" style={{ marginBottom: '0.65rem' }}>
            <label htmlFor="bk-in-pass">Passphrase</label>
            <input
              id="bk-in-pass"
              type="password"
              value={importPass}
              onChange={(e) => setImportPass(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => handleImport()}>
            Unlock &amp; Load Packet
          </button>
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border)' }}>
          {!confirmClear ? (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmClear(true)}>
              Erase all saved data on this device
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--danger)', fontWeight: 700 }}>
                Are you sure? This clears your profile and uploads on this device.
              </span>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleClear}>
                Yes, erase everything
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
