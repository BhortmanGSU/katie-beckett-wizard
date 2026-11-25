import { useState } from 'react';
import { fullName, type Profile } from '../profile';
import { GEORGIA_RULES } from '../rules/ga';
import {
  buildDayInTheLifePdf,
  buildDoctorPacket,
  buildFilledForm,
  buildSubmissionCoverSheet,
  mergePdfsAndImages,
} from '../forms/packet';
import type { StoredDocument } from '../storage/db';
import { dataUrlToBytes, downloadBytes, todayIso, todayUs } from '../utils/download';

interface Props {
  profile: Profile;
  docs: StoredDocument[];
  signatureDataUrl: string;
  signatureWidth: number;
  signatureHeight: number;
  approvedForms: Record<string, boolean>;
  draftDoctorSections: boolean;
  onBack: () => void;
  onJumpToStep: (idx: number) => void;
}

export function SubmitStep({
  profile,
  docs,
  signatureDataUrl,
  signatureWidth,
  signatureHeight,
  approvedForms,
  draftDoctorSections,
  onBack,
  onJumpToStep,
}: Props) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const sig = signatureDataUrl
    ? { png: dataUrlToBytes(signatureDataUrl), width: signatureWidth, height: signatureHeight }
    : null;
  const childSlug = (fullName(profile.child) || 'child').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong building the PDF.');
    } finally {
      setBusy('');
    }
  };

  const downloadDoctorPacket = () =>
    run('doctor', async () => {
      const bytes = await buildDoctorPacket(profile, {
        signDate: todayUs(),
        parentSignature: sig,
        draftDoctorSections,
        approvedForms,
      });
      downloadBytes(bytes, `GA-Katie-Beckett-Doctor-Packet-${childSlug}-${todayIso()}.pdf`, 'application/pdf');
    });

  const downloadDayInLife = () =>
    run('story', async () => {
      const bytes = await buildDayInTheLifePdf(profile, todayUs());
      downloadBytes(bytes, `Day-in-the-Life-${childSlug}.pdf`, 'application/pdf');
    });

  const downloadCompletePacket = () =>
    run('complete', async () => {
      const parts: { name: string; bytes: Uint8Array; mime: string }[] = [];
      const labels: string[] = [];

      // Use uploaded signed copy of a form if present; otherwise include our generated filled form
      for (const form of GEORGIA_RULES.forms) {
        const uploaded = docs.filter((d) => d.slotId === form.id);
        if (uploaded.length > 0) {
          for (const u of uploaded) {
            parts.push({ name: u.fileName, bytes: u.bytes, mime: u.mimeType });
            labels.push(`${form.code} (uploaded: ${u.fileName})`);
          }
        } else {
          const bytes = await buildFilledForm(form.id, profile, {
            signDate: todayUs(),
            parentSignature: approvedForms[form.id] ? sig : null,
            draftDoctorSections,
          });
          parts.push({ name: form.title, bytes, mime: 'application/pdf' });
          labels.push(`${form.title}${approvedForms[form.id] && sig ? ' (parent signed)' : ''}`);
        }
      }

      // Day in the life letter (generated if written and not uploaded separately)
      if (profile.health.dayInTheLife.trim() && !docs.some((d) => d.slotId === 'day-in-life')) {
        const storyBytes = await buildDayInTheLifePdf(profile, todayUs());
        parts.push({ name: 'Day in the Life', bytes: storyBytes, mime: 'application/pdf' });
        labels.push('Parent "Day in the Life" Supporting Statement');
      }

      // All other uploaded supporting documents
      const formIds = new Set(GEORGIA_RULES.forms.map((f) => f.id));
      for (const d of docs.filter((x) => !formIds.has(x.slotId))) {
        const slot = GEORGIA_RULES.documentSlots.find((s) => s.id === d.slotId);
        parts.push({ name: d.fileName, bytes: d.bytes, mime: d.mimeType });
        labels.push(`${slot?.title ?? 'Supporting document'} (${d.fileName})`);
      }

      const cover = await buildSubmissionCoverSheet(profile, labels, todayUs());
      const merged = await mergePdfsAndImages([
        { name: 'Cover Sheet', bytes: cover, mime: 'application/pdf' },
        ...parts,
      ]);
      downloadBytes(merged, `GA-Katie-Beckett-Complete-Packet-${childSlug}-${todayIso()}.pdf`, 'application/pdf');
    });

  // Pre-flight checks
  const warnings: { text: string; step: number }[] = [];
  if (!profile.child.firstName || !profile.child.dob) {
    warnings.push({ text: 'Your child’s name or date of birth is still blank.', step: 1 });
  }
  if (!approvedForms['form-94'] || !signatureDataUrl) {
    warnings.push({ text: 'Form 94 has not been signed yet in Step 6.', step: 5 });
  }
  if (!docs.some((d) => d.slotId === 'dma-6a')) {
    warnings.push({
      text: 'You haven’t uploaded your pediatrician’s ink-signed DMA-6A yet (download the Doctor’s Packet below first!).',
      step: 4,
    });
  }
  const expiredDocs = docs.filter((d) => d.freshness.status === 'expired' || d.freshness.status === 'outdated-form');
  for (const d of expiredDocs) {
    warnings.push({ text: `Freshness alert on "${d.fileName}": ${d.freshness.headline}`, step: 4 });
  }

  return (
    <div>
      <div className="page-header">
        <div className="warm-note">You made it! Take a deep breath — you’ve done the hardest part.</div>
        <h1>Download &amp; Submit to Georgia</h1>
        <p>
          Download your Doctor’s Packet first if your pediatrician still needs to sign in original ink. Once you’ve
          uploaded their signed scans, download your Complete Application Packet to mail, fax, or upload.
        </p>
      </div>

      {error && <div className="callout danger">{error}</div>}

      {/* Pre-flight check */}
      {warnings.length > 0 ? (
        <div className="card">
          <h2>Quick pre-flight check</h2>
          <p className="card-hint">Nothing stops you from downloading today, just a few helpful reminders:</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {warnings.map((w, i) => (
              <li key={i} style={{ fontSize: '0.92rem' }}>
                {w.text}{' '}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onJumpToStep(w.step)}>
                  Go fix →
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="callout sage">
          <strong>Everything looks ready to go!</strong>
          Your forms are filled and signed, and no uploaded documents are flagged as expired.
        </div>
      )}

      {/* Download Buttons */}
      <div className="card">
        <h2>Step A — For your child’s pediatrician</h2>
        <p className="card-hint">
          Includes a warm cover letter explaining Georgia’s 90-day clock &amp; original-signature rule, plus your
          pre-filled DMA-6A, DMA-706, and DMA-704 ready for your doctor to review and sign.
        </p>
        <button type="button" className="btn btn-warm" disabled={Boolean(busy)} onClick={downloadDoctorPacket}>
          {busy === 'doctor' ? 'Building Doctor’s Packet...' : 'Download Doctor’s Ready-to-Sign Packet (PDF)'}
        </button>
      </div>

      <div className="card">
        <h2>Step B — Your Complete Submission Packet</h2>
        <p className="card-hint">
          Combines a neat cover sheet, your filled official Georgia forms (using your uploaded doctor-signed copies
          wherever you uploaded them), your “Day in the Life” letter, and every supporting PDF/photo into one packet.
        </p>
        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" disabled={Boolean(busy)} onClick={downloadCompletePacket}>
            {busy === 'complete' ? 'Building Complete Packet...' : 'Download Complete Application Packet (PDF)'}
          </button>
          {profile.health.dayInTheLife.trim() && (
            <button type="button" className="btn btn-outline" disabled={Boolean(busy)} onClick={downloadDayInLife}>
              Download “Day in the Life” Letter Only
            </button>
          )}
        </div>
      </div>

      {/* Where to send in Georgia */}
      <div className="card">
        <h2>Where to send your Georgia packet</h2>
        <div className="callout warm">
          <strong>{GEORGIA_RULES.submission.teamName}</strong>
          <div>{GEORGIA_RULES.submission.addressLines.join(', ')}</div>
          <div>
            Phone: <strong>{GEORGIA_RULES.submission.phone}</strong> &nbsp;|&nbsp; Fax:{' '}
            <strong>{GEORGIA_RULES.submission.fax}</strong>
          </div>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--danger)', fontWeight: 700 }}>
          ⚠ {GEORGIA_RULES.submission.oldAddressWarning}
        </p>

        <h3 style={{ fontSize: '1rem', marginTop: '1rem' }}>After you send it</h3>
        <ol style={{ margin: '0.35rem 0 0.9rem 1.25rem', padding: 0, fontSize: '0.92rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Keep a copy of everything you sent and write down your fax confirmation or mailing tracking number.</li>
          <li>
            Call <strong>{GEORGIA_RULES.submission.phone}</strong> about 3–5 business days later to confirm your packet
            is attached to your child’s file.
          </li>
          <li>
            Watch your email for an invite to the{' '}
            <a href={GEORGIA_RULES.portalUrl} target="_blank" rel="noreferrer">
              Georgia Katie Beckett Online Portal
            </a>{' '}
            (where you can track status and upload renewals).
          </li>
        </ol>

        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.86rem', color: 'var(--muted)' }}>
          <strong>Free Georgia family support &amp; advocacy:</strong>{' '}
          {GEORGIA_RULES.legalAid.map((l) => `${l.name} (${l.phone})`).join('  •  ')}
        </div>
      </div>

      <div className="wizard-footer">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          ← Back to Deadlines
        </button>
        <span style={{ fontSize: '0.88rem', color: 'var(--sage)', fontWeight: 700 }}>
          Saved automatically on this computer ✓
        </span>
      </div>
    </div>
  );
}
