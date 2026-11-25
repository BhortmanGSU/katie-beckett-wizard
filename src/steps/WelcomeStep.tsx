import { useState } from 'react';
import { GEORGIA_RULES } from '../rules/ga';

interface Props {
  hasSavedData: boolean;
  onNext: () => void;
  onLoadSample: () => void;
  onOpenBackup: () => void;
}

export function WelcomeStep({ hasSavedData, onNext, onLoadSample, onOpenBackup }: Props) {
  const [under19, setUnder19] = useState<'yes' | 'no' | ''>('');
  const [gaResident, setGaResident] = useState<'yes' | 'no' | ''>('');
  const [complexCare, setComplexCare] = useState<'yes' | 'unsure' | ''>('');

  return (
    <div>
      <div className="page-header">
        <div className="warm-note">Hello, neighbor. Let’s take this one gentle step at a time.</div>
        <h1>Georgia Katie Beckett Helper</h1>
        <p>
          Applying for Katie Beckett Medicaid asks families to write the same details across four different state forms
          while juggling medical care. Here, you tell us your story <strong>once</strong>, and we fill out Georgia’s
          official forms for you, check your paperwork for expiration dates, and keep your timeline on track.
        </p>
      </div>

      <div className="callout sage">
        <strong>100% private — everything stays right on your device</strong>
        Nothing you type or upload ever leaves this computer. There are no accounts, no servers, and no tracking.
        Your progress saves automatically after every single change, so you can close this anytime and pick right back up.
      </div>

      <div className="card">
        <h2>Quick 30-second check</h2>
        <p className="card-hint">
          Not sure if Katie Beckett fits your child? Answer these three quick questions (just for you — nothing is scored).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>1. Is your child 18 years old or younger?</div>
            <div className="yn-group">
              <button type="button" className={`chip-btn ${under19 === 'yes' ? 'selected' : ''}`} onClick={() => setUnder19('yes')}>
                Yes
              </button>
              <button type="button" className={`chip-btn ${under19 === 'no' ? 'selected' : ''}`} onClick={() => setUnder19('no')}>
                No (19 or older)
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>2. Does your child live at home in Georgia?</div>
            <div className="yn-group">
              <button type="button" className={`chip-btn ${gaResident === 'yes' ? 'selected' : ''}`} onClick={() => setGaResident('yes')}>
                Yes, in Georgia
              </button>
              <button type="button" className={`chip-btn ${gaResident === 'no' ? 'selected' : ''}`} onClick={() => setGaResident('no')}>
                Another state
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>
              3. Does your child have a long-term disability, developmental, or complex medical need?
            </div>
            <div className="yn-group">
              <button type="button" className={`chip-btn ${complexCare === 'yes' ? 'selected' : ''}`} onClick={() => setComplexCare('yes')}>
                Yes
              </button>
              <button type="button" className={`chip-btn ${complexCare === 'unsure' ? 'selected' : ''}`} onClick={() => setComplexCare('unsure')}>
                I’m not sure if they meet the criteria
              </button>
            </div>
          </div>
        </div>

        {under19 === 'no' && (
          <div className="callout warm" style={{ marginTop: '1rem', marginBottom: 0 }}>
            <strong>Heads up on age</strong>
            Georgia Katie Beckett covers children through age 18. For young adults 19+, ask about Georgia’s NOW/COMP
            waivers or adult SSI Medicaid.
          </div>
        )}
        {gaResident === 'no' && (
          <div className="callout warm" style={{ marginTop: '1rem', marginBottom: 0 }}>
            <strong>This version is built for Georgia</strong>
            The forms and rules here are specific to Georgia. Other states can be added through our open-source rule packs on GitHub.
          </div>
        )}
        {under19 === 'yes' && gaResident === 'yes' && complexCare && (
          <div className="callout sage" style={{ marginTop: '1rem', marginBottom: 0 }}>
            <strong>You’re in the right place!</strong>
            {complexCare === 'unsure'
              ? ' Qualification is based on the level of care your child needs — not a single diagnosis name — and your child’s pediatrician helps decide that. We’ll walk you through it calmly.'
              : ' Remember, your family’s income is not counted. Let’s build your packet step by step.'}
          </div>
        )}
      </div>

      <div className="card">
        <h2>5 things every Georgia family should know first</h2>
        <p className="card-hint">
          Georgia rules last verified: <strong>{GEORGIA_RULES.lastVerified}</strong> —{' '}
          <a href={GEORGIA_RULES.officialPageUrl} target="_blank" rel="noreferrer">
            Official Georgia Medicaid page
          </a>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {GEORGIA_RULES.keyFacts.map((fact) => (
            <div key={fact.title} className="sub-row" style={{ marginBottom: 0 }}>
              <strong style={{ color: 'var(--teal)', display: 'block', marginBottom: '0.2rem' }}>{fact.title}</strong>
              <span style={{ fontSize: '0.93rem' }}>{fact.body}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Ready when you are</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {hasSavedData ? 'Continue my application →' : 'Start my application →'}
          </button>
          <button type="button" className="btn btn-outline" onClick={onLoadSample}>
            Try with a sample family first
          </button>
          <button type="button" className="btn btn-outline" onClick={onOpenBackup}>
            Restore a saved backup
          </button>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '1rem', marginBottom: 0 }}>
          Friendly note: This free open-source tool organizes your paperwork and fills Georgia’s public forms to save you
          time. It is helpful guidance, not legal or medical advice. Always review each form before you sign and submit.
        </p>
      </div>
    </div>
  );
}
