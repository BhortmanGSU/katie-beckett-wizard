import { uid, type HouseholdMember, type IncomeEntry, type Profile, type YesNo } from '../profile';
import { GEORGIA_RULES } from '../rules/ga';

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

export function FamilyStep({ profile, onChange, onBack, onNext }: Props) {
  const setChild = (patch: Partial<Profile['child']>) =>
    onChange({ ...profile, child: { ...profile.child, ...patch } });
  const setApplicant = (patch: Partial<Profile['applicant']>) =>
    onChange({ ...profile, applicant: { ...profile.applicant, ...patch } });
  const setMailing = (patch: Partial<Profile['mailingAddress']>) =>
    onChange({ ...profile, mailingAddress: { ...profile.mailingAddress, ...patch } });
  const setInsurance = (patch: Partial<Profile['insurance']>) =>
    onChange({ ...profile, insurance: { ...profile.insurance, ...patch } });
  const setTax = (patch: Partial<Profile['tax']>) =>
    onChange({ ...profile, tax: { ...profile.tax, ...patch } });

  const addHousehold = () => {
    const m: HouseholdMember = {
      id: uid(),
      firstName: '',
      middleInitial: '',
      lastName: profile.applicant.lastName,
      suffix: '',
      race: '',
      sex: '',
      dob: '',
      relationship: '',
      needsCoverage: 'no',
      ssn: '',
      citizenOrQualified: 'yes',
    };
    onChange({ ...profile, household: [...profile.household, m] });
  };

  const updateHousehold = (id: string, patch: Partial<HouseholdMember>) =>
    onChange({ ...profile, household: profile.household.map((m) => (m.id === id ? { ...m, ...patch } : m)) });

  const removeHousehold = (id: string) =>
    onChange({ ...profile, household: profile.household.filter((m) => m.id !== id) });

  const addIncome = () => {
    const entry: IncomeEntry = {
      id: uid(),
      type: 'wages',
      person: '',
      amount: '',
      howOften: 'Every 2 weeks',
      employer: '',
      otherLabel: '',
    };
    onChange({ ...profile, income: [...profile.income, entry] });
  };

  const updateIncome = (id: string, patch: Partial<IncomeEntry>) =>
    onChange({ ...profile, income: profile.income.map((x) => (x.id === id ? { ...x, ...patch } : x)) });

  const removeIncome = (id: string) =>
    onChange({ ...profile, income: profile.income.filter((x) => x.id !== id) });

  return (
    <div>
      <div className="page-header">
        <div className="warm-note">Type this just once — we’ll copy it neatly onto every form for you.</div>
        <h1>Your Child &amp; Family</h1>
        <p>
          You can skip any field you don’t have handy right now and come back later. Everything saves automatically.
        </p>
      </div>

      {/* Child info */}
      <div className="card">
        <h2>About your child</h2>
        <p className="card-hint">Used on Form 94, DMA-6A, DMA-706, and DMA-704.</p>
        <div className="grid-3">
          <div className="field">
            <label>First name</label>
            <input value={profile.child.firstName} onChange={(e) => setChild({ firstName: e.target.value })} />
          </div>
          <div className="field">
            <label>Middle initial</label>
            <input maxLength={2} value={profile.child.middleInitial} onChange={(e) => setChild({ middleInitial: e.target.value })} />
          </div>
          <div className="field">
            <label>Last name</label>
            <input value={profile.child.lastName} onChange={(e) => setChild({ lastName: e.target.value })} />
          </div>
          <div className="field">
            <label>Date of birth</label>
            <input type="date" value={profile.child.dob} onChange={(e) => setChild({ dob: e.target.value })} />
          </div>
          <div className="field">
            <label>Sex</label>
            <select value={profile.child.sex} onChange={(e) => setChild({ sex: e.target.value as Profile['child']['sex'] })}>
              <option value="">Select...</option>
              <option value="F">Female (F)</option>
              <option value="M">Male (M)</option>
            </select>
          </div>
          <div className="field">
            <label>Race (optional)</label>
            <input value={profile.child.race} onChange={(e) => setChild({ race: e.target.value })} placeholder="e.g. White, Black, Asian" />
          </div>
          <div className="field">
            <label>Child’s Social Security Number</label>
            <input value={profile.child.ssn} onChange={(e) => setChild({ ssn: e.target.value })} placeholder="123-45-6789" />
            <small>Stays strictly on this device.</small>
          </div>
          <div className="field">
            <label>Medicaid ID (if renewing)</label>
            <input value={profile.child.medicaidNumber} onChange={(e) => setChild({ medicaidNumber: e.target.value })} placeholder="Leave blank for new application" />
          </div>
          <div className="field">
            <label>U.S. Citizen or qualified immigrant?</label>
            <YN value={profile.child.citizenOrQualified} onChange={(v) => setChild({ citizenOrQualified: v })} />
          </div>
        </div>
      </div>

      {/* Parent / Guardian */}
      <div className="card">
        <h2>About you (parent or legal guardian)</h2>
        <p className="card-hint">You are the person signing Form 94, DMA-6A Section A, and DMA-706.</p>
        <div className="grid-3">
          <div className="field">
            <label>First name</label>
            <input value={profile.applicant.firstName} onChange={(e) => setApplicant({ firstName: e.target.value })} />
          </div>
          <div className="field">
            <label>Middle initial</label>
            <input maxLength={2} value={profile.applicant.middleInitial} onChange={(e) => setApplicant({ middleInitial: e.target.value })} />
          </div>
          <div className="field">
            <label>Last name</label>
            <input value={profile.applicant.lastName} onChange={(e) => setApplicant({ lastName: e.target.value })} />
          </div>
          <div className="field">
            <label>Maiden name (if applicable)</label>
            <input value={profile.applicant.maidenName} onChange={(e) => setApplicant({ maidenName: e.target.value })} />
          </div>
          <div className="field">
            <label>Date of birth</label>
            <input type="date" value={profile.applicant.dob} onChange={(e) => setApplicant({ dob: e.target.value })} />
          </div>
          <div className="field">
            <label>Sex</label>
            <select value={profile.applicant.sex} onChange={(e) => setApplicant({ sex: e.target.value as Profile['applicant']['sex'] })}>
              <option value="">Select...</option>
              <option value="F">Female (F)</option>
              <option value="M">Male (M)</option>
            </select>
          </div>
          <div className="field">
            <label>Race (optional)</label>
            <input value={profile.applicant.race} onChange={(e) => setApplicant({ race: e.target.value })} />
          </div>
          <div className="field">
            <label>Are you a U.S. Citizen or qualified immigrant?</label>
            <YN value={profile.applicant.citizenOrQualified} onChange={(v) => setApplicant({ citizenOrQualified: v })} />
            <small>Used for the Form 94 signature declaration.</small>
          </div>
          <div className="field">
            <label>Phone number</label>
            <input value={profile.applicant.phone} onChange={(e) => setApplicant({ phone: e.target.value })} placeholder="(770) 555-0142" />
          </div>
          <div className="field">
            <label>Email address</label>
            <input type="email" value={profile.applicant.email} onChange={(e) => setApplicant({ email: e.target.value })} />
            <small>Georgia sends your Katie Beckett Portal invite here.</small>
          </div>
          <div className="field">
            <label>Preferred language</label>
            <input value={profile.applicant.preferredLanguage} onChange={(e) => setApplicant({ preferredLanguage: e.target.value })} />
          </div>
          <div className="field">
            <label>Need a free interpreter?</label>
            <YN value={profile.applicant.needsInterpreter} onChange={(v) => setApplicant({ needsInterpreter: v })} />
          </div>
          <div className="field">
            <label>Second caregiver (optional)</label>
            <input
              value={profile.caregiver2.name}
              onChange={(e) => onChange({ ...profile, caregiver2: { ...profile.caregiver2, name: e.target.value } })}
              placeholder="Spouse or co-parent name"
            />
          </div>
          <div className="field">
            <label>Email / text notifications?</label>
            <YN value={profile.applicant.electronicCommunication} onChange={(v) => setApplicant({ electronicCommunication: v })} />
          </div>
          <div className="field">
            <label>Need an ADA accommodation / assistance?</label>
            <YN value={profile.applicant.needsReasonableModification} onChange={(v) => setApplicant({ needsReasonableModification: v })} />
          </div>
          {profile.applicant.needsReasonableModification === 'yes' && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Describe the accommodation or communication assistance needed</label>
              <input
                value={profile.applicant.reasonableModificationDetails}
                onChange={(e) => setApplicant({ reasonableModificationDetails: e.target.value })}
                placeholder="e.g. Large print, sign language interpreter, phone deadline reminders"
              />
            </div>
          )}
        </div>
      </div>

      {/* Address & County */}
      <div className="card">
        <h2>Home address &amp; Georgia county</h2>
        <div className="grid-2">
          <div className="field">
            <label>Street address (mailing)</label>
            <input value={profile.mailingAddress.street} onChange={(e) => setMailing({ street: e.target.value })} />
          </div>
          <div className="field">
            <label>City</label>
            <input value={profile.mailingAddress.city} onChange={(e) => setMailing({ city: e.target.value })} />
          </div>
          <div className="field">
            <label>ZIP code</label>
            <input value={profile.mailingAddress.zip} onChange={(e) => setMailing({ zip: e.target.value })} />
          </div>
          <div className="field">
            <label>Georgia County (DFCS County)</label>
            <select value={profile.county} onChange={(e) => onChange({ ...profile, county: e.target.value })}>
              <option value="">Select county...</option>
              {GEORGIA_RULES.counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={profile.residenceDifferent}
            onChange={(e) => onChange({ ...profile, residenceDifferent: e.target.checked })}
          />
          <span>Our home address is different from our mailing address</span>
        </label>
        {profile.residenceDifferent && (
          <div className="grid-3" style={{ marginTop: '0.75rem' }}>
            <div className="field">
              <label>Home street address</label>
              <input
                value={profile.residenceAddress.street}
                onChange={(e) => onChange({ ...profile, residenceAddress: { ...profile.residenceAddress, street: e.target.value } })}
              />
            </div>
            <div className="field">
              <label>Home city</label>
              <input
                value={profile.residenceAddress.city}
                onChange={(e) => onChange({ ...profile, residenceAddress: { ...profile.residenceAddress, city: e.target.value } })}
              />
            </div>
            <div className="field">
              <label>Home ZIP</label>
              <input
                value={profile.residenceAddress.zip}
                onChange={(e) => onChange({ ...profile, residenceAddress: { ...profile.residenceAddress, zip: e.target.value } })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Household */}
      <div className="card">
        <h2>Others living in your home</h2>
        <p className="card-hint">
          Form 94 asks for everyone living in the home (you and your child are already included automatically). You do
          <strong> not</strong> need to enter SSNs for family members who aren’t applying for Medicaid.
        </p>

        <div className="grid-3" style={{ marginBottom: '1rem' }}>
          <div className="field">
            <label>Does the child’s mother live in the home?</label>
            <YN value={profile.motherInHome} onChange={(v) => onChange({ ...profile, motherInHome: v })} />
          </div>
          <div className="field">
            <label>Does the child’s father live in the home?</label>
            <YN value={profile.fatherInHome} onChange={(v) => onChange({ ...profile, fatherInHome: v })} />
          </div>
          <div className="field">
            <label>Any veteran / active military in family?</label>
            <YN value={profile.veteranInFamily} onChange={(v) => onChange({ ...profile, veteranInFamily: v })} />
          </div>
        </div>

        {profile.household.map((m, idx) => (
          <div key={m.id} className="sub-row">
            <div className="sub-row-head">
              <strong>Household member #{idx + 1}</strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeHousehold(m.id)}>
                Remove
              </button>
            </div>
            <div className="grid-3">
              <div className="field">
                <label>First name</label>
                <input value={m.firstName} onChange={(e) => updateHousehold(m.id, { firstName: e.target.value })} />
              </div>
              <div className="field">
                <label>Last name</label>
                <input value={m.lastName} onChange={(e) => updateHousehold(m.id, { lastName: e.target.value })} />
              </div>
              <div className="field">
                <label>Relationship to you</label>
                <input value={m.relationship} onChange={(e) => updateHousehold(m.id, { relationship: e.target.value })} placeholder="Spouse, Son, Daughter..." />
              </div>
              <div className="field">
                <label>Date of birth</label>
                <input type="date" value={m.dob} onChange={(e) => updateHousehold(m.id, { dob: e.target.value })} />
              </div>
              <div className="field">
                <label>Sex</label>
                <select value={m.sex} onChange={(e) => updateHousehold(m.id, { sex: e.target.value as HouseholdMember['sex'] })}>
                  <option value="">Select...</option>
                  <option value="F">F</option>
                  <option value="M">M</option>
                </select>
              </div>
              <div className="field">
                <label>Needs Medicaid?</label>
                <YN value={m.needsCoverage} onChange={(v) => updateHousehold(m.id, { needsCoverage: v })} />
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={addHousehold}>
          + Add another person in the home
        </button>
      </div>

      {/* Private Insurance */}
      <div className="card">
        <h2>Health insurance &amp; recent medical bills</h2>
        <div className="grid-2">
          <div className="field">
            <label>Does your child have private health insurance?</label>
            <YN
              value={profile.insurance.childHasPrivate}
              onChange={(v) => setInsurance({ childHasPrivate: v, anyoneHasPrivate: v === 'yes' ? 'yes' : profile.insurance.anyoneHasPrivate })}
            />
          </div>
          <div className="field">
            <label>Is your child currently on Medicaid?</label>
            <YN value={profile.insurance.currentlyOnMedicaid} onChange={(v) => setInsurance({ currentlyOnMedicaid: v })} />
          </div>
          {profile.insurance.childHasPrivate === 'yes' && (
            <>
              <div className="field">
                <label>Insurance company</label>
                <input value={profile.insurance.company} onChange={(e) => setInsurance({ company: e.target.value })} placeholder="e.g. Blue Cross Blue Shield of GA" />
              </div>
              <div className="field">
                <label>Policy / Member ID number</label>
                <input value={profile.insurance.policyNumber} onChange={(e) => setInsurance({ policyNumber: e.target.value })} />
              </div>
            </>
          )}
          <div className="field">
            <label>Any unpaid medical bills from the last 3 months?</label>
            <YN value={profile.unpaidMedicalBills} onChange={(v) => onChange({ ...profile, unpaidMedicalBills: v })} />
            <small>Medicaid may cover up to 3 months of retroactive bills if eligible.</small>
          </div>
          {profile.unpaidMedicalBills === 'yes' && (
            <div className="field">
              <label>Which months?</label>
              <input
                value={profile.unpaidMedicalBillMonths}
                onChange={(e) => onChange({ ...profile, unpaidMedicalBillMonths: e.target.value })}
                placeholder="e.g. September, October"
              />
            </div>
          )}
        </div>
      </div>

      {/* Income & Tax (with calm reassurance) */}
      <div className="card">
        <h2>Household income &amp; tax questions (Form 94)</h2>
        <div className="callout">
          <strong>Remember: your family’s income does NOT disqualify your child</strong>
          Form 94 is Georgia’s general Medicaid form, so it asks about household income and taxes. For Katie Beckett,
          the state excludes parental income and looks only at your child’s own income or assets.
        </div>

        <div className="grid-2" style={{ marginBottom: '0.9rem' }}>
          <div className="field">
            <label>Assets / money in your child’s own name ($)</label>
            <input
              value={profile.childResources}
              onChange={(e) => onChange({ ...profile, childResources: e.target.value })}
              placeholder="0"
            />
            <small>Usually $0 (unless your child has an account or trust solely in their name).</small>
          </div>
          <div className="field">
            <label>Plan to file a federal tax return next year?</label>
            <YN value={profile.tax.plansToFile} onChange={(v) => setTax({ plansToFile: v })} />
          </div>
          {profile.tax.plansToFile === 'yes' && (
            <>
              <div className="field">
                <label>Who will file?</label>
                <input value={profile.tax.filers} onChange={(e) => setTax({ filers: e.target.value })} />
              </div>
              <div className="field">
                <label>Filing jointly with a spouse?</label>
                <YN value={profile.tax.fileJointly} onChange={(v) => setTax({ fileJointly: v })} />
              </div>
              {profile.tax.fileJointly === 'yes' && (
                <div className="field">
                  <label>Spouse’s name</label>
                  <input value={profile.tax.spouseName} onChange={(e) => setTax({ spouseName: e.target.value })} />
                </div>
              )}
              <div className="field">
                <label>Dependents claimed</label>
                <input
                  value={profile.tax.dependents}
                  onChange={(e) => setTax({ dependents: e.target.value, claimDependents: e.target.value ? 'yes' : '' })}
                />
              </div>
              <div className="field">
                <label>Claimed as a dependent on someone else’s return?</label>
                <YN value={profile.tax.claimedByOther} onChange={(v) => setTax({ claimedByOther: v })} />
              </div>
              {profile.tax.claimedByOther === 'yes' && (
                <div className="field">
                  <label>Who claims them &amp; relationship?</label>
                  <input
                    value={profile.tax.claimedByOtherDetails}
                    onChange={(e) => setTax({ claimedByOtherDetails: e.target.value })}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {profile.income.map((inc, idx) => (
          <div key={inc.id} className="sub-row">
            <div className="sub-row-head">
              <strong>Income #{idx + 1}</strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeIncome(inc.id)}>
                Remove
              </button>
            </div>
            <div className="grid-3">
              <div className="field">
                <label>Type</label>
                <select value={inc.type} onChange={(e) => updateIncome(inc.id, { type: e.target.value as IncomeEntry['type'] })}>
                  <option value="wages">Wages / Earnings</option>
                  <option value="ssi">Social Security / SSI</option>
                  <option value="childSupport">Child Support</option>
                  <option value="pension">Pension / Retirement</option>
                  <option value="unemployment">Unemployment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Person receiving</label>
                <input value={inc.person} onChange={(e) => updateIncome(inc.id, { person: e.target.value })} />
              </div>
              <div className="field">
                <label>Gross amount per paycheck</label>
                <input value={inc.amount} onChange={(e) => updateIncome(inc.id, { amount: e.target.value })} placeholder="e.g. 2,500" />
              </div>
              <div className="field">
                <label>How often?</label>
                <input value={inc.howOften} onChange={(e) => updateIncome(inc.id, { howOften: e.target.value })} placeholder="Every 2 weeks, Monthly..." />
              </div>
              {inc.type === 'wages' && (
                <div className="field">
                  <label>Employer</label>
                  <input value={inc.employer} onChange={(e) => updateIncome(inc.id, { employer: e.target.value })} />
                </div>
              )}
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={addIncome}>
          + Add household income entry (optional)
        </button>
      </div>

      {/* Optional Form 94 sections: Absent Parent, Authorized Rep, Express Lane, Voter Registration */}
      <div className="card">
        <h2>Other Form 94 questions (optional)</h2>
        <p className="card-hint">
          Only fill in the sections that apply to your family.
        </p>

        <div className="grid-2" style={{ marginBottom: '0.9rem' }}>
          <div className="field">
            <label>Evaluate via Express Lane Eligibility (if receiving SNAP/TANF)?</label>
            <YN value={profile.expressLane} onChange={(v) => onChange({ ...profile, expressLane: v })} />
          </div>
          <div className="field">
            <label>Voter registration question (Form 94 Page 5)</label>
            <select
              value={profile.voterRegistration}
              onChange={(e) => onChange({ ...profile, voterRegistration: e.target.value as Profile['voterRegistration'] })}
            >
              <option value="">Leave blank</option>
              <option value="yes">Yes — I would like to register to vote</option>
              <option value="no">No — I am already registered or do not want to</option>
              <option value="decline">I do not want to answer</option>
            </select>
          </div>
        </div>

        <div className="sub-row">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={profile.absentParent.present}
              onChange={(e) =>
                onChange({ ...profile, absentParent: { ...profile.absentParent, present: e.target.checked } })
              }
            />
            <span>One of the child’s parents lives outside the home (Absent Parent section)</span>
          </label>
          {profile.absentParent.present && (
            <div className="grid-3" style={{ marginTop: '0.75rem' }}>
              <div className="field">
                <label>Absent parent’s name</label>
                <input
                  value={profile.absentParent.name}
                  onChange={(e) => onChange({ ...profile, absentParent: { ...profile.absentParent, name: e.target.value } })}
                />
              </div>
              <div className="field">
                <label>Carries health insurance for child?</label>
                <YN
                  value={profile.absentParent.hasCoverage}
                  onChange={(v) => onChange({ ...profile, absentParent: { ...profile.absentParent, hasCoverage: v } })}
                />
              </div>
              {profile.absentParent.hasCoverage === 'yes' && (
                <div className="field">
                  <label>Insurance company &amp; group #</label>
                  <input
                    value={profile.absentParent.insurance}
                    onChange={(e) => onChange({ ...profile, absentParent: { ...profile.absentParent, insurance: e.target.value } })}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sub-row" style={{ marginBottom: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={profile.authorizedRep.use}
              onChange={(e) =>
                onChange({ ...profile, authorizedRep: { ...profile.authorizedRep, use: e.target.checked } })
              }
            />
            <span>Name an Authorized Representative (someone who can speak with Medicaid on your behalf)</span>
          </label>
          {profile.authorizedRep.use && (
            <div className="grid-3" style={{ marginTop: '0.75rem' }}>
              <div className="field">
                <label>First name</label>
                <input
                  value={profile.authorizedRep.firstName}
                  onChange={(e) => onChange({ ...profile, authorizedRep: { ...profile.authorizedRep, firstName: e.target.value } })}
                />
              </div>
              <div className="field">
                <label>Last name</label>
                <input
                  value={profile.authorizedRep.lastName}
                  onChange={(e) => onChange({ ...profile, authorizedRep: { ...profile.authorizedRep, lastName: e.target.value } })}
                />
              </div>
              <div className="field">
                <label>Organization (optional)</label>
                <input
                  value={profile.authorizedRep.organization}
                  onChange={(e) => onChange({ ...profile, authorizedRep: { ...profile.authorizedRep, organization: e.target.value } })}
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  value={profile.authorizedRep.phone}
                  onChange={(e) => onChange({ ...profile, authorizedRep: { ...profile.authorizedRep, phone: e.target.value } })}
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  value={profile.authorizedRep.email}
                  onChange={(e) => onChange({ ...profile, authorizedRep: { ...profile.authorizedRep, email: e.target.value } })}
                />
              </div>
              <div className="field">
                <label>Street address</label>
                <input
                  value={profile.authorizedRep.address.street}
                  onChange={(e) =>
                    onChange({
                      ...profile,
                      authorizedRep: { ...profile.authorizedRep, address: { ...profile.authorizedRep.address, street: e.target.value } },
                    })
                  }
                />
              </div>
              <div className="field">
                <label>City</label>
                <input
                  value={profile.authorizedRep.address.city}
                  onChange={(e) =>
                    onChange({
                      ...profile,
                      authorizedRep: { ...profile.authorizedRep, address: { ...profile.authorizedRep.address, city: e.target.value } },
                    })
                  }
                />
              </div>
              <div className="field">
                <label>ZIP</label>
                <input
                  value={profile.authorizedRep.address.zip}
                  onChange={(e) =>
                    onChange({
                      ...profile,
                      authorizedRep: { ...profile.authorizedRep, address: { ...profile.authorizedRep.address, zip: e.target.value } },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="wizard-footer">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Save &amp; continue to Health &amp; Daily Care →
        </button>
      </div>
    </div>
  );
}
