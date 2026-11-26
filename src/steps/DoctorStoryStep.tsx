import type { Profile } from '../profile';

interface Props {
  profile: Profile;
  onChange: (p: Profile) => void;
  onBack: () => void;
  onNext: () => void;
}

const STORY_PROMPTS = [
  {
    label: '+ Morning & overnight care',
    text: '\n\nOvernight & Morning Routine:\nDescribe overnight monitoring, alarms, medications, feeding tubes, seizures, or safety checks needed while others sleep, and what it takes to get your child ready each morning.',
  },
  {
    label: '+ Daytime medical & safety needs',
    text: '\n\nDaytime Care & Safety:\nDescribe the hands-on supervision, therapies, medical equipment, elopement/safety risks, or skilled tasks required throughout the day.',
  },
  {
    label: '+ Why home care matters',
    text: '\n\nWhy Home Care with Katie Beckett Matters:\nExplain how Katie Beckett Medicaid will help keep your child safe, stable, and thriving at home with their family rather than in a facility.',
  },
];

export function DoctorStoryStep({ profile, onChange, onBack, onNext }: Props) {
  const setPhysician = (patch: Partial<Profile['physician']>) =>
    onChange({ ...profile, physician: { ...profile.physician, ...patch } });
  const setCosts = (patch: Partial<Profile['costs']>) =>
    onChange({ ...profile, costs: { ...profile.costs, ...patch } });

  const parse = (s: string) => Number(s.replace(/[^0-9.]/g, '')) || 0;
  const total =
    parse(profile.costs.physician) +
    parse(profile.costs.dme) +
    parse(profile.costs.drugs) +
    parse(profile.costs.therapy) +
    parse(profile.costs.nursing) +
    parse(profile.costs.other);

  return (
    <div>
      <div className="page-header">
        <div className="warm-note">Your voice matters just as much as the medical forms.</div>
        <h1>Your Pediatrician &amp; “Day in the Life”</h1>
        <p>
          Add your child’s primary care doctor so we can personalize their ready-to-sign packet, and optionally write a
          short “Day in the Life” letter to attach.
        </p>
      </div>

      {/* Primary Care Physician */}
      <div className="card">
        <h2>Primary Care Physician (PCP)</h2>
        <p className="card-hint">
          Your pediatrician completes and signs DMA-6A (Sections B &amp; C), DMA-706, and DMA-704.
        </p>
        <div className="grid-2">
          <div className="field">
            <label>Doctor’s name</label>
            <input
              value={profile.physician.name}
              onChange={(e) => setPhysician({ name: e.target.value })}
              placeholder="e.g. Anita Patel, MD"
            />
          </div>
          <div className="field">
            <label>Practice / clinic name</label>
            <input
              value={profile.physician.practice}
              onChange={(e) => setPhysician({ practice: e.target.value })}
              placeholder="e.g. Kennesaw Pediatrics"
            />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Office address</label>
            <input
              value={profile.physician.address}
              onChange={(e) => setPhysician({ address: e.target.value })}
              placeholder="Street, Suite, City, GA ZIP"
            />
          </div>
          <div className="field">
            <label>Office phone</label>
            <input value={profile.physician.phone} onChange={(e) => setPhysician({ phone: e.target.value })} />
          </div>
          <div className="field">
            <label>Office fax (optional)</label>
            <input value={profile.physician.fax} onChange={(e) => setPhysician({ fax: e.target.value })} />
          </div>
          <div className="field">
            <label>Georgia license # (optional — doctor can fill in)</label>
            <input value={profile.physician.licenseNumber} onChange={(e) => setPhysician({ licenseNumber: e.target.value })} />
          </div>
          <div className="field">
            <label>NPI # (optional)</label>
            <input value={profile.physician.npi} onChange={(e) => setPhysician({ npi: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Optional Cost-Effectiveness Draft */}
      <div className="card">
        <h2>Estimated monthly home-care costs &amp; prognosis (DMA-704 draft — optional)</h2>
        <p className="card-hint">
          Your doctor completes DMA-704, so you can leave these blank if you’re unsure. For reference, Georgia’s manual
          lists institutional comparison ceilings around <strong>$6,344/mo</strong> (Nursing Facility) and{' '}
          <strong>$14,846/mo</strong> (ICF/ID).
        </p>
        <div className="field" style={{ marginBottom: '0.9rem' }}>
          <label>Prognosis (optional draft for DMA-704)</label>
          <input
            value={profile.health.prognosis}
            onChange={(e) => onChange({ ...profile, health: { ...profile.health, prognosis: e.target.value } })}
            placeholder="e.g. Lifelong condition; ongoing skilled home care expected"
          />
        </div>
        <div className="grid-3">
          <div className="field">
            <label>Physician services ($/mo)</label>
            <input value={profile.costs.physician} onChange={(e) => setCosts({ physician: e.target.value })} />
          </div>
          <div className="field">
            <label>Medical equipment / DME ($/mo)</label>
            <input value={profile.costs.dme} onChange={(e) => setCosts({ dme: e.target.value })} />
          </div>
          <div className="field">
            <label>Medications ($/mo)</label>
            <input value={profile.costs.drugs} onChange={(e) => setCosts({ drugs: e.target.value })} />
          </div>
          <div className="field">
            <label>Therapies ($/mo)</label>
            <input value={profile.costs.therapy} onChange={(e) => setCosts({ therapy: e.target.value })} />
          </div>
          <div className="field">
            <label>Skilled nursing ($/mo)</label>
            <input value={profile.costs.nursing} onChange={(e) => setCosts({ nursing: e.target.value })} />
          </div>
          <div className="field">
            <label>Other supplies ($/mo)</label>
            <input value={profile.costs.other} onChange={(e) => setCosts({ other: e.target.value })} />
          </div>
          {profile.costs.other && (
            <div className="field">
              <label>What is “Other”?</label>
              <input
                value={profile.costs.otherLabel}
                placeholder="e.g. Feeding supplies"
                onChange={(e) => setCosts({ otherLabel: e.target.value })}
              />
            </div>
          )}
        </div>
        {total > 0 && (
          <div style={{ marginTop: '0.8rem', fontWeight: 700, color: 'var(--teal)' }}>
            Draft monthly total: ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {/* Day in the Life Letter */}
      <div className="card">
        <h2>Your “Day in the Life” letter (optional, strongly recommended)</h2>
        <p className="card-hint">
          Checkboxes can’t capture what a real day looks like. Write honestly about your child’s hardest moments and the
          constant care you provide — we’ll format it into a clean PDF letter to attach to your packet.
        </p>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
          {STORY_PROMPTS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="chip-btn"
              onClick={() =>
                onChange({
                  ...profile,
                  health: {
                    ...profile.health,
                    dayInTheLife: (profile.health.dayInTheLife + p.text).trim(),
                  },
                })
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="field">
          <textarea
            style={{ minHeight: 190 }}
            value={profile.health.dayInTheLife}
            onChange={(e) => onChange({ ...profile, health: { ...profile.health, dayInTheLife: e.target.value } })}
            placeholder="Start anywhere — for example: 'A typical day for our family begins at 5:30 a.m. when we check our child’s pulse oximeter and prepare morning medications...'"
          />
        </div>
      </div>

      <div className="wizard-footer">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Save &amp; continue to Documents &amp; Uploads →
        </button>
      </div>
    </div>
  );
}
