import {
  BODY_SYSTEMS,
  uid,
  type BodySystem,
  type Diagnosis,
  type Hospitalization,
  type Medication,
  type Profile,
  type YesNo,
} from '../profile';
import { CARE_FLAGS } from '../forms/maps/dma6a';

interface Props {
  profile: Profile;
  onChange: (p: Profile) => void;
  onBack: () => void;
  onNext: () => void;
}

function YN({ value, onChange }: { value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <div className="yn-group">
      <button type="button" className={`chip-btn ${value === 'yes' ? 'selected' : ''}`} onClick={() => onChange('yes')}>
        Yes
      </button>
      <button type="button" className={`chip-btn ${value === 'no' ? 'selected' : ''}`} onClick={() => onChange('no')}>
        No
      </button>
    </div>
  );
}

const FLAG_GROUPS = Array.from(new Set(CARE_FLAGS.map((f) => f.group)));

export function HealthStep({ profile, onChange, onBack, onNext }: Props) {
  const h = profile.health;
  const setHealth = (patch: Partial<Profile['health']>) => onChange({ ...profile, health: { ...h, ...patch } });
  const setChild = (patch: Partial<Profile['child']>) => onChange({ ...profile, child: { ...profile.child, ...patch } });

  const toggleFlag = (id: string) => {
    const next = h.careFlags.includes(id) ? h.careFlags.filter((x) => x !== id) : [...h.careFlags, id];
    setHealth({ careFlags: next });
  };

  const setSystem = (id: BodySystem, has: boolean, description?: string) => {
    setHealth({
      systems: {
        ...h.systems,
        [id]: { has, description: description ?? h.systems[id]?.description ?? '' },
      },
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="warm-note">You’re doing great. This is the most detailed step — take a breather anytime.</div>
        <h1>Health, Therapies &amp; Daily Care</h1>
        <p>
          Everything here prepares a clean draft for your child’s pediatrician on <strong>DMA-6A</strong> and{' '}
          <strong>DMA-706</strong> so they don’t have to start from a blank page. Your doctor will review and confirm the
          medical parts before signing.
        </p>
      </div>

      {/* Level of Care */}
      <div className="card">
        <h2>Level of Care &amp; Caregiver Question</h2>
        <div className="grid-2">
          <div className="field">
            <label>Which Level of Care track fits best? (Doctor confirms)</label>
            <select
              value={h.levelOfCare}
              onChange={(e) => setHealth({ levelOfCare: e.target.value as Profile['health']['levelOfCare'] })}
            >
              <option value="">Not sure yet (let doctor choose)</option>
              <option value="nursing">Nursing Facility (skilled nursing 7 days/wk or skilled therapy 5+ days/wk)</option>
              <option value="icf">ICF/ID (developmental, intellectual, or autism-related needs)</option>
            </select>
          </div>
          <div className="field">
            <label>Without home/community services, would your child need institutional care?</label>
            <YN value={h.wouldNeedInstitution} onChange={(v) => setHealth({ wouldNeedInstitution: v })} />
            <small>DMA-6A Item 7 asks this directly to the parent/caretaker.</small>
          </div>
        </div>
      </div>

      {/* Diagnoses */}
      <div className="card">
        <h2>Diagnoses</h2>
        <p className="card-hint">
          List your child’s main diagnoses. If you know the ICD-10 code (from an after-visit summary), add it — otherwise
          leave it blank for your doctor.
        </p>
        {h.diagnoses.map((d: Diagnosis, i) => (
          <div key={d.id} className="sub-row">
            <div className="grid-3" style={{ alignItems: 'end' }}>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Diagnosis #{i + 1}</label>
                <input
                  value={d.name}
                  placeholder="e.g. Cerebral palsy, Autism Spectrum Disorder, Epilepsy"
                  onChange={(e) =>
                    setHealth({ diagnoses: h.diagnoses.map((x) => (x.id === d.id ? { ...x, name: e.target.value } : x)) })
                  }
                />
              </div>
              <div className="field">
                <label>ICD-10 code (optional)</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    style={{ flex: 1 }}
                    value={d.icd}
                    placeholder="e.g. G80.0"
                    onChange={(e) =>
                      setHealth({ diagnoses: h.diagnoses.map((x) => (x.id === d.id ? { ...x, icd: e.target.value } : x)) })
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setHealth({ diagnoses: h.diagnoses.filter((x) => x.id !== d.id) })}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setHealth({ diagnoses: [...h.diagnoses, { id: uid(), name: '', icd: '' }] })}
        >
          + Add diagnosis
        </button>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label>Brief medical history</label>
          <textarea
            value={h.history}
            onChange={(e) => setHealth({ history: e.target.value })}
            placeholder="A short 2–4 sentence summary of when symptoms/diagnoses began, key surgeries or devices, and current status."
          />
        </div>
      </div>

      {/* Medications */}
      <div className="card">
        <h2>Current medications</h2>
        {h.medications.map((m: Medication) => (
          <div key={m.id} className="sub-row">
            <div className="grid-2">
              <div className="field">
                <label>Medication name</label>
                <input
                  value={m.name}
                  onChange={(e) =>
                    setHealth({ medications: h.medications.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)) })
                  }
                />
              </div>
              <div className="field">
                <label>Dosage</label>
                <input
                  value={m.dosage}
                  placeholder="e.g. 250 mg"
                  onChange={(e) =>
                    setHealth({ medications: h.medications.map((x) => (x.id === m.id ? { ...x, dosage: e.target.value } : x)) })
                  }
                />
              </div>
              <div className="field">
                <label>How given (route)</label>
                <input
                  value={m.route}
                  placeholder="Oral, G-tube, Inhaled..."
                  onChange={(e) =>
                    setHealth({ medications: h.medications.map((x) => (x.id === m.id ? { ...x, route: e.target.value } : x)) })
                  }
                />
              </div>
              <div className="field">
                <label>How often</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    style={{ flex: 1 }}
                    value={m.frequency}
                    placeholder="Twice daily, As needed..."
                    onChange={(e) =>
                      setHealth({
                        medications: h.medications.map((x) => (x.id === m.id ? { ...x, frequency: e.target.value } : x)),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setHealth({ medications: h.medications.filter((x) => x.id !== m.id) })}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() =>
            setHealth({
              medications: [...h.medications, { id: uid(), name: '', dosage: '', route: '', frequency: '' }],
            })
          }
        >
          + Add medication
        </button>
      </div>

      {/* Therapies, School & Hospitalizations */}
      <div className="card">
        <h2>Therapies, school &amp; recent hospitalizations</h2>
        <div className="grid-3">
          <div className="field">
            <label>Speech therapy (sessions/wk)</label>
            <input
              value={h.therapies.speechPerWeek}
              onChange={(e) => setHealth({ therapies: { ...h.therapies, speechPerWeek: e.target.value } })}
            />
          </div>
          <div className="field">
            <label>Physical therapy — PT (sessions/wk)</label>
            <input
              value={h.therapies.ptPerWeek}
              onChange={(e) => setHealth({ therapies: { ...h.therapies, ptPerWeek: e.target.value } })}
            />
          </div>
          <div className="field">
            <label>Occupational therapy — OT (sessions/wk)</label>
            <input
              value={h.therapies.otPerWeek}
              onChange={(e) => setHealth({ therapies: { ...h.therapies, otPerWeek: e.target.value } })}
            />
          </div>
          <div className="field">
            <label>Other therapies (ABA, feeding, etc.)</label>
            <input
              value={h.therapies.otherVisits}
              placeholder="e.g. ABA 15 hrs/wk"
              onChange={(e) => setHealth({ therapies: { ...h.therapies, otherVisits: e.target.value } })}
            />
          </div>
          <div className="field">
            <label>Therapy 5 or more days/week?</label>
            <YN
              value={h.therapies.fiveDaysPerWeek}
              onChange={(v) => setHealth({ therapies: { ...h.therapies, fiveDaysPerWeek: v } })}
            />
          </div>
          <div className="field">
            <label>Skilled nursing hrs/day (if any)</label>
            <input
              value={profile.child.skilledNursingHoursPerDay}
              placeholder="e.g. 8 or leave blank"
              onChange={(e) => setChild({ skilledNursingHoursPerDay: e.target.value })}
            />
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

        <div className="grid-3">
          <div className="field">
            <label>Does your child attend school?</label>
            <YN value={profile.child.attendsSchool} onChange={(v) => setChild({ attendsSchool: v })} />
          </div>
          <div className="field">
            <label>IEP or IFSP in place?</label>
            <select
              value={profile.child.schoolPlan}
              onChange={(e) => setChild({ schoolPlan: e.target.value as Profile['child']['schoolPlan'] })}
            >
              <option value="">None / not sure</option>
              <option value="IEP">IEP (school age)</option>
              <option value="IFSP">IFSP (Babies Can’t Wait, 0–3)</option>
            </select>
          </div>
          {profile.child.attendsSchool === 'yes' && (
            <>
              <div className="field">
                <label>Nurse at school?</label>
                <YN value={profile.child.nurseAtSchool} onChange={(v) => setChild({ nurseAtSchool: v })} />
              </div>
              <div className="field">
                <label>School hours/day</label>
                <input value={profile.child.schoolHoursPerDay} onChange={(e) => setChild({ schoolHoursPerDay: e.target.value })} />
              </div>
              <div className="field">
                <label>School days/week</label>
                <input value={profile.child.schoolDaysPerWeek} onChange={(e) => setChild({ schoolDaysPerWeek: e.target.value })} />
              </div>
            </>
          )}
        </div>

        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

        <h3 style={{ fontSize: '1rem' }}>Hospitalizations in the last 12 months</h3>
        {h.hospitalizations.map((hz: Hospitalization) => (
          <div key={hz.id} className="sub-row">
            <div className="grid-3">
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={hz.date}
                  onChange={(e) =>
                    setHealth({
                      hospitalizations: h.hospitalizations.map((x) => (x.id === hz.id ? { ...x, date: e.target.value } : x)),
                    })
                  }
                />
              </div>
              <div className="field">
                <label>Reason</label>
                <input
                  value={hz.reason}
                  onChange={(e) =>
                    setHealth({
                      hospitalizations: h.hospitalizations.map((x) => (x.id === hz.id ? { ...x, reason: e.target.value } : x)),
                    })
                  }
                />
              </div>
              <div className="field">
                <label>Duration</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    style={{ flex: 1 }}
                    value={hz.duration}
                    placeholder="e.g. 5 days"
                    onChange={(e) =>
                      setHealth({
                        hospitalizations: h.hospitalizations.map((x) =>
                          x.id === hz.id ? { ...x, duration: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setHealth({ hospitalizations: h.hospitalizations.filter((x) => x.id !== hz.id) })}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() =>
            setHealth({
              hospitalizations: [...h.hospitalizations, { id: uid(), date: '', hospital: '', reason: '', duration: '' }],
            })
          }
        >
          + Add hospitalization
        </button>
      </div>

      {/* Body Systems (DMA-706) */}
      <div className="card">
        <h2>Daily skilled needs by body area (DMA-706)</h2>
        <p className="card-hint">
          Check the areas where your child needs hands-on medical, nursing, or safety support, and jot a quick note.
          Unchecked areas will be marked “None” on DMA-706.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {BODY_SYSTEMS.map((sys) => {
            const cur = h.systems[sys.id] ?? { has: false, description: '' };
            return (
              <div key={sys.id} className="sub-row" style={{ marginBottom: 0, padding: '0.7rem 0.9rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={cur.has}
                    onChange={(e) => setSystem(sys.id, e.target.checked)}
                  />
                  <span>{sys.label}</span>
                  <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.84rem' }}>— {sys.hint}</span>
                </label>
                {cur.has && (
                  <input
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      border: '1.5px solid var(--border-strong)',
                      borderRadius: 9,
                      padding: '0.45rem 0.65rem',
                    }}
                    value={cur.description}
                    placeholder="Briefly describe the daily care needed..."
                    onChange={(e) => setSystem(sys.id, true, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DMA-6A Section C Checkboxes */}
      <div className="card">
        <h2>Daily care checklist (DMA-6A Page 2 draft)</h2>
        <p className="card-hint">
          Check any that apply to your child. Your pediatrician will review and confirm these checkboxes on DMA-6A Section C.
        </p>
        {FLAG_GROUPS.map((group) => (
          <div key={group} style={{ marginBottom: '0.9rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--teal)', marginBottom: '0.4rem' }}>{group}</div>
            <div className="flag-grid">
              {CARE_FLAGS.filter((f) => f.group === group).map((flag) => {
                const checked = h.careFlags.includes(flag.id);
                return (
                  <label key={flag.id} className={`check-pill ${checked ? 'checked' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleFlag(flag.id)} />
                    <span>{flag.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="wizard-footer">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Save &amp; continue to Doctors &amp; Day in the Life →
        </button>
      </div>
    </div>
  );
}
