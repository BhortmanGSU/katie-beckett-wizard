// The family's "tell us once" profile.
// Every official form is filled from this one object. Keep field names plain
// and stable: form maps (src/forms/maps) and the wizard screens both use them.

export type YesNo = 'yes' | 'no' | '';
export type Sex = 'M' | 'F' | '';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface HouseholdMember {
  id: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  suffix: string;
  race: string;
  sex: Sex;
  dob: string; // YYYY-MM-DD
  relationship: string; // relationship to the person filling out the application
  needsCoverage: YesNo;
  ssn: string;
  citizenOrQualified: YesNo;
}

export interface Diagnosis {
  id: string;
  name: string;
  icd: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
}

export interface Procedure {
  id: string;
  type: string;
  frequency: string;
}

export interface Hospitalization {
  id: string;
  date: string; // YYYY-MM-DD
  hospital: string;
  reason: string;
  duration: string;
}

export interface Provider {
  name: string;
  practice: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  licenseNumber: string;
  npi: string;
}

export interface IncomeEntry {
  id: string;
  type: 'wages' | 'ssi' | 'workersComp' | 'pension' | 'childSupport' | 'unemployment' | 'other';
  person: string;
  amount: string;
  howOften: string;
  employer: string;
  otherLabel: string;
}

/** Body-system skilled needs used by the Medical Necessity / Level of Care Statement (DMA-706). */
export type BodySystem =
  | 'cardiovascular'
  | 'neurological'
  | 'respiratory'
  | 'nutrition'
  | 'integumentary'
  | 'urogenital'
  | 'bowel'
  | 'endocrine'
  | 'immune'
  | 'skeletal'
  | 'other';

export interface SystemNeed {
  has: boolean;
  description: string;
}

export interface Profile {
  child: {
    firstName: string;
    middleInitial: string;
    lastName: string;
    suffix: string;
    dob: string;
    sex: Sex;
    race: string;
    ssn: string;
    medicaidNumber: string;
    citizenOrQualified: YesNo;
    inFosterCare: YesNo;
    attendsSchool: YesNo;
    schoolHoursPerDay: string;
    schoolDaysPerWeek: string;
    schoolPlan: 'IEP' | 'IFSP' | 'none' | '';
    nurseAtSchool: YesNo;
    skilledNursingHoursPerDay: string;
  };

  /** The parent / guardian completing the application (Form 94 "Your Name"). */
  applicant: {
    firstName: string;
    middleInitial: string;
    lastName: string;
    maidenName: string;
    relationship: string; // to the child, e.g. "Mother"
    sex: Sex;
    dob: string;
    race: string;
    ssn: string;
    citizenOrQualified: YesNo;
    phone: string;
    email: string;
    electronicCommunication: YesNo;
    preferredLanguage: string;
    needsInterpreter: YesNo;
    needsReasonableModification: YesNo;
    reasonableModificationDetails: string;
  };

  caregiver2: { name: string; relationship: string };

  mailingAddress: Address;
  residenceDifferent: boolean;
  residenceAddress: Address;
  county: string; // Georgia county of residence (DFCS county)

  /** Other people living in the home (besides the applicant and the child). */
  household: HouseholdMember[];
  fatherInHome: YesNo;
  motherInHome: YesNo;
  veteranInFamily: YesNo;

  insurance: {
    childHasPrivate: YesNo;
    anyoneHasPrivate: YesNo;
    company: string;
    policyNumber: string;
    groupNumber: string;
    policyHolder: string;
    currentlyOnMedicaid: YesNo;
  };
  unpaidMedicalBills: YesNo;
  unpaidMedicalBillMonths: string;

  income: IncomeEntry[];
  childResources: string; // money/assets in the child's own name
  tax: {
    plansToFile: YesNo;
    filers: string;
    fileJointly: YesNo;
    spouseName: string;
    claimDependents: YesNo;
    dependents: string;
    claimedByOther: YesNo;
    claimedByOtherDetails: string;
  };
  absentParent: { present: boolean; name: string; hasCoverage: YesNo; insurance: string };

  authorizedRep: {
    use: boolean;
    firstName: string;
    lastName: string;
    organization: string;
    address: Address;
    phone: string;
    email: string;
  };

  expressLane: YesNo;
  voterRegistration: 'yes' | 'no' | 'decline' | '';

  physician: Provider;
  otherProviders: (Provider & { id: string; role: string })[];

  health: {
    levelOfCare: 'nursing' | 'icf' | 'hospital' | 'unsure' | '';
    wouldNeedInstitution: YesNo;
    diagnoses: Diagnosis[];
    medications: Medication[];
    procedures: Procedure[];
    hospitalizations: Hospitalization[];
    history: string;
    prognosis: string;
    therapies: {
      speechPerWeek: string;
      ptPerWeek: string;
      otPerWeek: string;
      otherVisits: string; // free text e.g. "ABA 10 hrs/wk"
      fiveDaysPerWeek: YesNo;
    };
    systems: Record<BodySystem, SystemNeed>;
    /** Parent observations that map to DMA-6A Section C checkboxes (physician confirms). */
    careFlags: string[];
    behaviorDescription: string;
    rehabServices: string;
    otherHealthServices: string;
    dayInTheLife: string;
  };

  costs: {
    physician: string;
    dme: string;
    drugs: string;
    therapy: string;
    nursing: string;
    other: string;
    otherLabel: string;
  };
}

export const BODY_SYSTEMS: { id: BodySystem; label: string; hint: string }[] = [
  { id: 'cardiovascular', label: 'Heart & circulation', hint: 'heart condition, monitoring, medications for the heart' },
  { id: 'neurological', label: 'Brain & nerves', hint: 'seizures, cerebral palsy, shunt, developmental or cognitive needs' },
  { id: 'respiratory', label: 'Breathing', hint: 'oxygen, trach, ventilator, nebulizer, suctioning, CPAP' },
  { id: 'nutrition', label: 'Eating & nutrition', hint: 'G-tube, special formula, slow feeding, failure to thrive' },
  { id: 'integumentary', label: 'Skin', hint: 'wounds, pressure sores, severe eczema, burn care' },
  { id: 'urogenital', label: 'Bladder & kidneys', hint: 'catheterization, dialysis, incontinence after age 3' },
  { id: 'bowel', label: 'Bowel', hint: 'ostomy, incontinence after age 3, bowel program' },
  { id: 'endocrine', label: 'Hormones & metabolism', hint: 'diabetes, metabolic disorders, adrenal care' },
  { id: 'immune', label: 'Immune system', hint: 'immune deficiency, infusions, infection precautions' },
  { id: 'skeletal', label: 'Bones & movement', hint: 'unable to walk, wheelchair, splints, braces, prosthesis' },
  { id: 'other', label: 'Anything else', hint: 'behavior, safety, sensory, anything not listed' },
];

const emptyAddress = (): Address => ({ street: '', city: '', state: 'GA', zip: '' });
const emptyProvider = (): Provider => ({
  name: '',
  practice: '',
  address: '',
  phone: '',
  fax: '',
  email: '',
  licenseNumber: '',
  npi: '',
});

export function emptyProfile(): Profile {
  const systems = Object.fromEntries(
    BODY_SYSTEMS.map((s) => [s.id, { has: false, description: '' }]),
  ) as Record<BodySystem, SystemNeed>;
  return {
    child: {
      firstName: '',
      middleInitial: '',
      lastName: '',
      suffix: '',
      dob: '',
      sex: '',
      race: '',
      ssn: '',
      medicaidNumber: '',
      citizenOrQualified: '',
      inFosterCare: '',
      attendsSchool: '',
      schoolHoursPerDay: '',
      schoolDaysPerWeek: '',
      schoolPlan: '',
      nurseAtSchool: '',
      skilledNursingHoursPerDay: '',
    },
    applicant: {
      firstName: '',
      middleInitial: '',
      lastName: '',
      maidenName: '',
      relationship: '',
      sex: '',
      dob: '',
      race: '',
      ssn: '',
      citizenOrQualified: '',
      phone: '',
      email: '',
      electronicCommunication: '',
      preferredLanguage: 'English',
      needsInterpreter: '',
      needsReasonableModification: '',
      reasonableModificationDetails: '',
    },
    caregiver2: { name: '', relationship: '' },
    mailingAddress: emptyAddress(),
    residenceDifferent: false,
    residenceAddress: emptyAddress(),
    county: '',
    household: [],
    fatherInHome: '',
    motherInHome: '',
    veteranInFamily: '',
    insurance: {
      childHasPrivate: '',
      anyoneHasPrivate: '',
      company: '',
      policyNumber: '',
      groupNumber: '',
      policyHolder: '',
      currentlyOnMedicaid: '',
    },
    unpaidMedicalBills: '',
    unpaidMedicalBillMonths: '',
    income: [],
    childResources: '',
    tax: {
      plansToFile: '',
      filers: '',
      fileJointly: '',
      spouseName: '',
      claimDependents: '',
      dependents: '',
      claimedByOther: '',
      claimedByOtherDetails: '',
    },
    absentParent: { present: false, name: '', hasCoverage: '', insurance: '' },
    authorizedRep: {
      use: false,
      firstName: '',
      lastName: '',
      organization: '',
      address: emptyAddress(),
      phone: '',
      email: '',
    },
    expressLane: '',
    voterRegistration: '',
    physician: emptyProvider(),
    otherProviders: [],
    health: {
      levelOfCare: '',
      wouldNeedInstitution: '',
      diagnoses: [],
      medications: [],
      procedures: [],
      hospitalizations: [],
      history: '',
      prognosis: '',
      therapies: { speechPerWeek: '', ptPerWeek: '', otPerWeek: '', otherVisits: '', fiveDaysPerWeek: '' },
      systems,
      careFlags: [],
      behaviorDescription: '',
      rehabServices: '',
      otherHealthServices: '',
      dayInTheLife: '',
    },
    costs: { physician: '', dme: '', drugs: '', therapy: '', nursing: '', other: '', otherLabel: '' },
  };
}

// ---------- small helpers used by screens and form maps ----------

export const fullName = (p: { firstName: string; middleInitial?: string; lastName: string; suffix?: string }) =>
  [p.firstName, p.middleInitial, p.lastName, p.suffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

export const formatAddress = (a: Address) =>
  [a.street, [a.city, [a.state, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')].filter(Boolean).join(', ');

/** YYYY-MM-DD -> MM/DD/YYYY (as most Georgia forms expect). */
export function usDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
}

export function ageOn(dobIso: string, on: Date = new Date()): number | null {
  if (!dobIso) return null;
  const dob = new Date(dobIso + 'T00:00:00');
  if (isNaN(dob.getTime())) return null;
  let age = on.getFullYear() - dob.getFullYear();
  const m = on.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < dob.getDate())) age--;
  return age;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
