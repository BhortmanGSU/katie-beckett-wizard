import { useState } from 'react';
import { uid, type Profile } from '../profile';
import { GEORGIA_RULES } from '../rules/ga';
import type { DocumentSlot } from '../rules/types';
import { checkDocumentFreshness, type SuggestedField } from '../docs/freshness';
import { extractDocumentText } from '../docs/ocr';
import type { DeadlineDates, StoredDocument } from '../storage/db';

interface Props {
  profile: Profile;
  docs: StoredDocument[];
  deadlines: DeadlineDates;
  onAddDoc: (doc: StoredDocument) => void;
  onUpdateDoc: (doc: StoredDocument) => void;
  onDeleteDoc: (id: string) => void;
  onApplySuggestion: (s: SuggestedField) => void;
  onSyncDeadline: (patch: Partial<DeadlineDates>) => void;
  onBack: () => void;
  onNext: () => void;
}

const BADGE_FOR: Record<StoredDocument['freshness']['status'], { cls: string; text: string }> = {
  current: { cls: 'badge-ok', text: 'Current & valid' },
  warning: { cls: 'badge-warn', text: 'Expiring soon' },
  expired: { cls: 'badge-danger', text: 'Expired — needs refresh' },
  'outdated-form': { cls: 'badge-danger', text: 'Outdated form version' },
  unchecked: { cls: 'badge-muted', text: 'Add date to check' },
};

export function DocumentsStep({
  profile,
  docs,
  deadlines,
  onAddDoc,
  onUpdateDoc,
  onDeleteDoc,
  onApplySuggestion,
  onSyncDeadline,
  onBack,
  onNext,
}: Props) {
  const [busySlot, setBusySlot] = useState<string>('');
  const [busyMsg, setBusyMsg] = useState<string>('');
  const [appliedKeys, setAppliedKeys] = useState<Record<string, boolean>>({});

  const handleFile = async (slot: DocumentSlot, file: File | undefined) => {
    if (!file) return;
    setBusySlot(slot.id);
    setBusyMsg('Saving file on your device...');
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');
      const extractedText = await extractDocumentText(bytes, mimeType, setBusyMsg);
      const freshness = checkDocumentFreshness(extractedText, slot);
      const documentDate = freshness.detectedDate ?? '';

      const doc: StoredDocument = {
        id: uid(),
        slotId: slot.id,
        fileName: file.name,
        mimeType,
        size: bytes.byteLength,
        uploadedAt: new Date().toISOString(),
        documentDate,
        extractedText,
        freshness,
        bytes,
      };
      onAddDoc(doc);

      // Gently sync key dates into the Deadlines tracker if not already set
      if (slot.id === 'dma-6a' && documentDate && !deadlines.dma6aSignedDate) {
        onSyncDeadline({ dma6aSignedDate: documentDate });
      }
      if (slot.id === 'psych-eval' && documentDate && !deadlines.evalDate) {
        onSyncDeadline({ evalDate: documentDate });
      }
    } finally {
      setBusySlot('');
      setBusyMsg('');
    }
  };

  const handleDateChange = (doc: StoredDocument, slot: DocumentSlot, newDate: string) => {
    const freshness = checkDocumentFreshness(doc.extractedText, slot, newDate);
    onUpdateDoc({ ...doc, documentDate: newDate, freshness });
    if (slot.id === 'dma-6a' && newDate) onSyncDeadline({ dma6aSignedDate: newDate });
    if (slot.id === 'psych-eval' && newDate) onSyncDeadline({ evalDate: newDate });
  };

  const slots = GEORGIA_RULES.documentSlots.map((slot) => {
    const check = slot.neededWhen ? slot.neededWhen(profile) : { needed: slot.required === 'always', reason: '' };
    return { slot, needed: check.needed, reason: check.reason };
  });

  const neededCount = slots.filter((s) => s.needed).length;
  const coveredCount = slots.filter(
    (s) =>
      s.needed &&
      (docs.some((d) => d.slotId === s.slot.id) ||
        (s.slot.id === 'form-94' && Boolean(profile.child.firstName)) ||
        (s.slot.id === 'day-in-life' && Boolean(profile.health.dayInTheLife.trim()))),
  ).length;

  return (
    <div>
      <div className="page-header">
        <div className="warm-note">Upload photos or PDFs — we’ll check dates and form versions right on your device.</div>
        <h1>Documents &amp; Freshness Check</h1>
        <p>
          Every slot accepts a PDF or a clear phone photo. We read the text locally to check whether a form is out of
          date or past Georgia’s time limit (like the 90-day DMA-6A clock or 3-year evaluation window).
        </p>
      </div>

      <div className="callout">
        <strong>
          Packet readiness: {coveredCount} of {neededCount} needed items started
        </strong>
        You don’t need everything today! If you’re waiting on your pediatrician to sign DMA-6A, DMA-706, and DMA-704,
        skip ahead to Step 6 to download your ready-to-sign Doctor’s Packet first, then come back here to upload the
        signed scans.
      </div>

      {slots.map(({ slot, needed, reason }) => {
        const slotDocs = docs.filter((d) => d.slotId === slot.id);
        const isBusy = busySlot === slot.id;
        return (
          <div key={slot.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ marginBottom: '0.2rem' }}>{slot.title}</h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {slot.required === 'always' && <span className="badge badge-teal">Required</span>}
                  {slot.required === 'conditional' && needed && <span className="badge badge-warn">Needed for your child</span>}
                  {slot.required === 'conditional' && !needed && <span className="badge badge-muted">May not be needed</span>}
                  {slot.required === 'optional' && <span className="badge badge-muted">Optional (helpful)</span>}
                  {slot.maxAgeDays && (
                    <span className="badge badge-muted">
                      Must be within {slot.maxAgeDays <= 90 ? `${slot.maxAgeDays} days` : `${Math.round(slot.maxAgeDays / 365)} years`}
                    </span>
                  )}
                </div>
              </div>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                {isBusy ? 'Checking...' : slotDocs.length > 0 ? '+ Add another file' : 'Upload PDF or photo'}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  style={{ display: 'none' }}
                  disabled={Boolean(busySlot)}
                  onChange={(e) => {
                    handleFile(slot, e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
              <strong>Why it matters:</strong> {slot.whyItMatters}
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: reason ? '0.35rem' : '0.6rem' }}>
              <strong>How to get it:</strong> {slot.howToGetIt}
            </p>
            {reason && (
              <p style={{ fontSize: '0.86rem', color: 'var(--teal)', fontWeight: 700, marginBottom: '0.6rem' }}>
                {reason}
              </p>
            )}

            {isBusy && <div className="callout">{busyMsg}</div>}

            {slotDocs.map((doc) => {
              const badge = BADGE_FOR[doc.freshness.status];
              return (
                <div key={doc.id} className="sub-row" style={{ marginTop: '0.6rem', marginBottom: 0 }}>
                  <div className="sub-row-head" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong>{doc.fileName}</strong>{' '}
                      <span className={`badge ${badge.cls}`}>{badge.text}</span>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDeleteDoc(doc.id)}>
                      Remove
                    </button>
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {doc.freshness.headline}
                  </div>
                  <ul style={{ margin: '0 0 0.65rem 1.15rem', padding: 0, fontSize: '0.86rem', color: 'var(--muted)' }}>
                    {doc.freshness.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                      Date on document:{' '}
                      <input
                        type="date"
                        value={doc.documentDate}
                        onChange={(e) => handleDateChange(doc, slot, e.target.value)}
                        style={{
                          border: '1.5px solid var(--border-strong)',
                          borderRadius: 8,
                          padding: '0.25rem 0.5rem',
                          marginLeft: '0.3rem',
                        }}
                      />
                    </label>
                  </div>

                  {doc.freshness.suggestions.length > 0 && (
                    <div style={{ marginTop: '0.65rem', paddingTop: '0.55rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--teal)', marginBottom: '0.35rem' }}>
                        We spotted details on this page — tap to copy into your profile:
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {doc.freshness.suggestions.map((s) => {
                          const k = `${doc.id}-${s.key}-${s.value}`;
                          const done = appliedKeys[k];
                          return (
                            <button
                              key={k}
                              type="button"
                              className={`chip-btn ${done ? 'selected' : ''}`}
                              onClick={() => {
                                onApplySuggestion(s);
                                setAppliedKeys((prev) => ({ ...prev, [k]: true }));
                              }}
                            >
                              {done ? `✓ Added ${s.label}` : `+ Use ${s.label}: ${s.value}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="wizard-footer">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Continue to Review &amp; Sign Once →
        </button>
      </div>
    </div>
  );
}
