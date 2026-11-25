import { useEffect, useState } from 'react';
import { fullName, type Profile } from '../profile';
import { GEORGIA_RULES } from '../rules/ga';
import { buildFilledForm } from '../forms/packet';
import { SignaturePad } from '../components/SignaturePad';
import { PdfPreview } from '../components/PdfPreview';
import { dataUrlToBytes, downloadBytes, todayUs } from '../utils/download';

interface Props {
  profile: Profile;
  signatureDataUrl: string;
  signatureWidth: number;
  signatureHeight: number;
  approvedForms: Record<string, boolean>;
  draftDoctorSections: boolean;
  onSignatureChange: (dataUrl: string, width: number, height: number) => void;
  onToggleApprove: (formId: string, approved: boolean) => void;
  onToggleDraftDoctor: (draft: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ReviewSignStep({
  profile,
  signatureDataUrl,
  signatureWidth,
  signatureHeight,
  approvedForms,
  draftDoctorSections,
  onSignatureChange,
  onToggleApprove,
  onToggleDraftDoctor,
  onBack,
  onNext,
}: Props) {
  const [activeId, setActiveId] = useState<string>('form-94');
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);

  const activeForm = GEORGIA_RULES.forms.find((f) => f.id === activeId) ?? GEORGIA_RULES.forms[0];
  const isApproved = Boolean(approvedForms[activeForm.id]);

  useEffect(() => {
    let cancelled = false;
    async function gen() {
      setLoading(true);
      try {
        const sig =
          isApproved && signatureDataUrl
            ? { png: dataUrlToBytes(signatureDataUrl), width: signatureWidth, height: signatureHeight }
            : null;
        const bytes = await buildFilledForm(activeForm.id, profile, {
          signDate: todayUs(),
          parentSignature: sig,
          draftDoctorSections,
        });
        if (!cancelled) setPdfBytes(bytes);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    gen();
    return () => {
      cancelled = true;
    };
  }, [activeForm.id, profile, isApproved, signatureDataUrl, signatureWidth, signatureHeight, draftDoctorSections]);

  return (
    <div>
      <div className="page-header">
        <div className="warm-note">Sign once here, then review each form calmly before placing your signature.</div>
        <h1>Review &amp; Sign Once</h1>
        <p>
          We never sign anything behind your back. Create your signature once below, inspect each pre-filled Georgia
          form, and tap <strong>Approve &amp; place my signature</strong> on each parent-signed form.
        </p>
      </div>

      {/* Signature Capture */}
      <div className="card">
        <h2>1. Your parent / legal guardian signature</h2>
        <p className="card-hint">
          Your signature is stored only on this computer and placed only on the forms you explicitly approve below.
        </p>
        <SignaturePad
          value={signatureDataUrl}
          defaultName={fullName(profile.applicant)}
          onChange={onSignatureChange}
        />

        <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={draftDoctorSections}
              onChange={(e) => onToggleDraftDoctor(e.target.checked)}
            />
            <span>Pre-fill physician sections as a helpful draft (recommended — saves your pediatrician time)</span>
          </label>
        </div>
      </div>

      {/* Form Review Tabs */}
      <div className="card">
        <h2>2. Review each official Georgia form</h2>
        <div className="tabs">
          {GEORGIA_RULES.forms.map((f) => {
            const signed = Boolean(approvedForms[f.id] && signatureDataUrl);
            return (
              <button
                key={f.id}
                type="button"
                className={`chip-btn ${activeId === f.id ? 'selected' : ''}`}
                onClick={() => setActiveId(f.id)}
              >
                {f.code} {f.parentSigns && signed ? '✓' : ''}
              </button>
            );
          })}
        </div>

        <div className="sub-row" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <strong>{activeForm.title}</strong>
              <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                {activeForm.whyItMatters}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {activeForm.parentSigns && (
                <button
                  type="button"
                  className={`btn btn-sm ${isApproved ? 'btn-outline' : 'btn-primary'}`}
                  disabled={!signatureDataUrl}
                  onClick={() => onToggleApprove(activeForm.id, !isApproved)}
                >
                  {!signatureDataUrl
                    ? 'Add signature above first'
                    : isApproved
                      ? '✓ Signed (click to remove)'
                      : 'Approve & place my signature'}
                </button>
              )}
              {pdfBytes && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => downloadBytes(pdfBytes, `GA-${activeForm.id}.pdf`, 'application/pdf')}
                >
                  Download this PDF
                </button>
              )}
            </div>
          </div>

          {activeForm.watchOut && (
            <div className="callout warm" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
              <strong>Important Georgia rule</strong>
              {activeForm.watchOut}
            </div>
          )}

          {!activeForm.parentSigns && (
            <div className="callout" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
              <strong>Doctor signs this form</strong>
              Your pediatrician completes and signs {activeForm.code} in original ink. We’ve included it in your
              Doctor’s Packet in Step 8.
            </div>
          )}
        </div>

        <PdfPreview bytes={pdfBytes} loading={loading} />
      </div>

      <div className="wizard-footer">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Continue to Deadlines &amp; Reminders →
        </button>
      </div>
    </div>
  );
}
