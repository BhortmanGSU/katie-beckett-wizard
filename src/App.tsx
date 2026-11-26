import { useEffect, useRef, useState } from 'react';
import { fullName, uid, type Profile } from './profile';
import { sampleProfile } from './fixtures/sampleProfile';
import {
  defaultAppState,
  deleteDocument,
  listDocuments,
  loadAppState,
  saveAppState,
  saveDocument,
  type AppState,
  type DeadlineDates,
  type StoredDocument,
} from './storage/db';
import type { SuggestedField } from './docs/freshness';
import { BackupModal } from './components/BackupModal';
import { InstallAppBanner } from './components/InstallAppBanner';
import { WelcomeStep } from './steps/WelcomeStep';
import { FamilyStep } from './steps/FamilyStep';
import { HealthStep } from './steps/HealthStep';
import { DoctorStoryStep } from './steps/DoctorStoryStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ReviewSignStep } from './steps/ReviewSignStep';
import { DeadlinesStep } from './steps/DeadlinesStep';
import { SubmitStep } from './steps/SubmitStep';

const STEPS = [
  'Welcome & Quick Check',
  'Your Child & Family',
  'Health & Daily Care',
  'Doctors & Day in the Life',
  'Documents & Uploads',
  'Review & Sign Once',
  'Deadlines & Reminders',
  'Download & Submit',
];

export function App() {
  const [state, setState] = useState<AppState>(defaultAppState);
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState('Saved on this device');
  const [installEvent, setInstallEvent] = useState<{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);
  const skipNextSave = useRef(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as unknown as { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> });
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  useEffect(() => {
    Promise.all([loadAppState(), listDocuments()])
      .then(([s, d]) => {
        skipNextSave.current = true;
        setState(s);
        setDocs(d);
      })
      .finally(() => setLoaded(true));
  }, []);

  // Auto-save whenever state changes after initial load
  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSavedNotice('Saving...');
    const t = setTimeout(() => {
      saveAppState(state).then(() => setSavedNotice('Saved automatically ✓'));
    }, 250);
    return () => clearTimeout(t);
  }, [state, loaded]);

  const setStep = (idx: number) => {
    setState((s) => ({ ...s, currentStep: Math.max(0, Math.min(STEPS.length - 1, idx)) }));
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setProfile = (profile: Profile) => setState((s) => ({ ...s, profile }));

  const handleAddDoc = async (doc: StoredDocument) => {
    await saveDocument(doc);
    setDocs((prev) => [...prev, doc]);
  };

  const handleUpdateDoc = async (doc: StoredDocument) => {
    await saveDocument(doc);
    setDocs((prev) => prev.map((x) => (x.id === doc.id ? doc : x)));
  };

  const handleDeleteDoc = async (id: string) => {
    await deleteDocument(id);
    setDocs((prev) => prev.filter((x) => x.id !== id));
  };

  const handleApplySuggestion = (s: SuggestedField) => {
    setState((prev) => {
      const p = prev.profile;
      if (s.key === 'physician.npi') {
        return { ...prev, profile: { ...p, physician: { ...p.physician, npi: s.value } } };
      }
      if (s.key === 'physician.phone') {
        return { ...prev, profile: { ...p, physician: { ...p.physician, phone: s.value } } };
      }
      if (s.key === 'physician.fax') {
        return { ...prev, profile: { ...p, physician: { ...p.physician, fax: s.value } } };
      }
      if (s.key === 'diagnosis.icd') {
        if (p.health.diagnoses.some((d) => d.icd === s.value)) return prev;
        return {
          ...prev,
          profile: {
            ...p,
            health: {
              ...p.health,
              diagnoses: [...p.health.diagnoses, { id: uid(), name: '', icd: s.value }],
            },
          },
        };
      }
      return prev;
    });
  };

  const handleSyncDeadline = (patch: Partial<DeadlineDates>) => {
    setState((prev) => ({ ...prev, deadlines: { ...prev.deadlines, ...patch } }));
  };

  const loadSample = () => {
    setState((prev) => ({
      ...prev,
      profile: sampleProfile(),
      currentStep: 1,
    }));
    setMobileMenuOpen(false);
  };

  const stepDone = (i: number): boolean => {
    if (i === 0) return Boolean(state.profile.child.firstName);
    if (i === 1) return Boolean(state.profile.child.firstName && state.profile.applicant.firstName);
    if (i === 2) return state.profile.health.diagnoses.length > 0 || state.profile.health.careFlags.length > 0;
    if (i === 3) return Boolean(state.profile.physician.name);
    if (i === 4) return docs.length > 0;
    if (i === 5) return Boolean(state.signatureDataUrl && state.approvedForms['form-94']);
    if (i === 6) return Object.values(state.deadlines).some(Boolean);
    return false;
  };

  const childLabel = fullName(state.profile.child);

  return (
    <div className="shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Wizard steps">
        <div className="sidebar-top">
          <div className="brand">
            <img src="./favicon.svg" alt="" />
            <div>
              <div className="brand-title">Katie Beckett Helper</div>
              <div className="brand-sub">Georgia TEFRA • {childLabel || 'New packet'}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm mobile-menu-btn"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            Step {state.currentStep + 1}/8 {mobileMenuOpen ? '▴' : '▾'}
          </button>
        </div>

        <div className="sidebar-body">
          <nav>
            <ol className="step-nav">
              {STEPS.map((label, idx) => {
                const active = state.currentStep === idx;
                const done = !active && stepDone(idx);
                return (
                  <li key={label}>
                    <button
                      type="button"
                      className={`step-btn ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                      aria-current={active ? 'step' : undefined}
                      onClick={() => setStep(idx)}
                    >
                      <span className="step-num">{done ? '✓' : idx + 1}</span>
                      <span className="step-label">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="sidebar-footer">
            <div className="privacy-pill">🔒 Private &amp; local • {savedNotice}</div>
            {installEvent && (
              <button
                type="button"
                className="btn btn-warm btn-sm"
                onClick={async () => {
                  await installEvent.prompt();
                  const res = await installEvent.userChoice;
                  if (res.outcome === 'accepted') setInstallEvent(null);
                }}
              >
                ⬇ Install App on This Device
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setShowBackup(true);
                setMobileMenuOpen(false);
              }}
            >
              ☁ Sync &amp; Backup (Phone ↔ PC)
            </button>
            <div style={{ fontSize: '0.76rem' }}>
              Take a break whenever you need — your work is safe right here.
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        {state.currentStep === 0 && (
          <WelcomeStep
            hasSavedData={Boolean(state.profile.child.firstName)}
            onNext={() => setStep(1)}
            onLoadSample={loadSample}
            onOpenBackup={() => setShowBackup(true)}
          />
        )}
        {state.currentStep === 1 && (
          <FamilyStep
            profile={state.profile}
            onChange={setProfile}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}
        {state.currentStep === 2 && (
          <HealthStep
            profile={state.profile}
            onChange={setProfile}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {state.currentStep === 3 && (
          <DoctorStoryStep
            profile={state.profile}
            onChange={setProfile}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {state.currentStep === 4 && (
          <DocumentsStep
            profile={state.profile}
            docs={docs}
            deadlines={state.deadlines}
            onAddDoc={handleAddDoc}
            onUpdateDoc={handleUpdateDoc}
            onDeleteDoc={handleDeleteDoc}
            onApplySuggestion={handleApplySuggestion}
            onSyncDeadline={handleSyncDeadline}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}
        {state.currentStep === 5 && (
          <ReviewSignStep
            profile={state.profile}
            signatureDataUrl={state.signatureDataUrl}
            signatureWidth={state.signatureWidth}
            signatureHeight={state.signatureHeight}
            approvedForms={state.approvedForms}
            draftDoctorSections={state.draftDoctorSections}
            onSignatureChange={(signatureDataUrl, signatureWidth, signatureHeight) =>
              setState((s) => ({ ...s, signatureDataUrl, signatureWidth, signatureHeight }))
            }
            onToggleApprove={(formId, approved) =>
              setState((s) => ({ ...s, approvedForms: { ...s.approvedForms, [formId]: approved } }))
            }
            onToggleDraftDoctor={(draftDoctorSections) => setState((s) => ({ ...s, draftDoctorSections }))}
            onBack={() => setStep(4)}
            onNext={() => setStep(6)}
          />
        )}
        {state.currentStep === 6 && (
          <DeadlinesStep
            profile={state.profile}
            deadlines={state.deadlines}
            onChange={(deadlines) => setState((s) => ({ ...s, deadlines }))}
            onBack={() => setStep(5)}
            onNext={() => setStep(7)}
          />
        )}
        {state.currentStep === 7 && (
          <SubmitStep
            profile={state.profile}
            docs={docs}
            signatureDataUrl={state.signatureDataUrl}
            signatureWidth={state.signatureWidth}
            signatureHeight={state.signatureHeight}
            approvedForms={state.approvedForms}
            draftDoctorSections={state.draftDoctorSections}
            onBack={() => setStep(6)}
            onJumpToStep={setStep}
          />
        )}
      </main>

      {showBackup && (
        <BackupModal
          state={state}
          docs={docs}
          onClose={() => setShowBackup(false)}
          onRestored={(restoredState, restoredDocs) => {
            skipNextSave.current = true;
            setState(restoredState);
            setDocs(restoredDocs);
          }}
          onCleared={() => {
            skipNextSave.current = true;
            setState(defaultAppState());
            setDocs([]);
          }}
        />
      )}
      <InstallAppBanner />
    </div>
  );
}
