import { emptyProfile, type Profile } from '../profile';

/** A made-up family used for previews and tests. Not a real person. */
export function sampleProfile(): Profile {
  const p = emptyProfile();
  p.child = {
    ...p.child,
    firstName: 'Lily',
    middleInitial: 'R',
    lastName: 'Thompson',
    dob: '2018-03-14',
    sex: 'F',
    race: 'White',
    ssn: '123-45-6789',
    medicaidNumber: '',
    citizenOrQualified: 'yes',
    inFosterCare: 'no',
    attendsSchool: 'yes',
    schoolHoursPerDay: '6',
    schoolDaysPerWeek: '5',
    schoolPlan: 'IEP',
    nurseAtSchool: 'yes',
    skilledNursingHoursPerDay: '8',
  };
  p.applicant = {
    ...p.applicant,
    firstName: 'Sarah',
    middleInitial: 'J',
    lastName: 'Thompson',
    maidenName: 'Miller',
    relationship: 'Mother',
    sex: 'F',
    dob: '1988-07-02',
    race: 'White',
    citizenOrQualified: 'yes',
    phone: '(770) 555-0142',
    email: 'sarah.thompson@example.com',
    electronicCommunication: 'yes',
    preferredLanguage: 'English',
    needsInterpreter: 'no',
    needsReasonableModification: 'no',
  };
  p.caregiver2 = { name: 'Michael Thompson', relationship: 'Father' };
  p.mailingAddress = { street: '412 Peachtree Hollow Ln', city: 'Marietta', state: 'GA', zip: '30064' };
  p.county = 'Cobb';
  p.household = [
    {
      id: 'h1',
      firstName: 'Michael',
      middleInitial: 'D',
      lastName: 'Thompson',
      suffix: '',
      race: 'White',
      sex: 'M',
      dob: '1986-11-20',
      relationship: 'Spouse',
      needsCoverage: 'no',
      ssn: '',
      citizenOrQualified: 'yes',
    },
    {
      id: 'h2',
      firstName: 'Owen',
      middleInitial: '',
      lastName: 'Thompson',
      suffix: '',
      race: 'White',
      sex: 'M',
      dob: '2015-05-09',
      relationship: 'Son',
      needsCoverage: 'no',
      ssn: '',
      citizenOrQualified: 'yes',
    },
  ];
  p.fatherInHome = 'yes';
  p.motherInHome = 'yes';
  p.veteranInFamily = 'no';
  p.insurance = {
    childHasPrivate: 'yes',
    anyoneHasPrivate: 'yes',
    company: 'Blue Cross Blue Shield of Georgia',
    policyNumber: 'XGA123456789',
    groupNumber: '0045821',
    policyHolder: 'Michael Thompson',
    currentlyOnMedicaid: 'no',
  };
  p.unpaidMedicalBills = 'yes';
  p.unpaidMedicalBillMonths = 'September, October';
  p.income = [
    { id: 'i1', type: 'wages', person: 'Michael Thompson', amount: '2,850.00', howOften: 'Every 2 weeks', employer: 'Acme Logistics', otherLabel: '' },
  ];
  p.childResources = '0';
  p.tax = {
    plansToFile: 'yes',
    filers: 'Michael Thompson, Sarah Thompson',
    fileJointly: 'yes',
    spouseName: 'Sarah Thompson',
    claimDependents: 'yes',
    dependents: 'Lily Thompson, Owen Thompson',
    claimedByOther: 'no',
    claimedByOtherDetails: '',
  };
  p.expressLane = 'no';
  p.voterRegistration = 'decline';
  p.physician = {
    name: 'Anita Patel, MD',
    practice: 'Kennesaw Pediatrics',
    address: '1200 Barrett Pkwy, Suite 300, Kennesaw, GA 30144',
    phone: '(770) 555-0199',
    fax: '(770) 555-0198',
    email: '',
    licenseNumber: 'GA-045821',
    npi: '1234567890',
  };
  p.health = {
    ...p.health,
    levelOfCare: 'nursing',
    wouldNeedInstitution: 'yes',
    diagnoses: [
      { id: 'd1', name: 'Spastic quadriplegic cerebral palsy', icd: 'G80.0' },
      { id: 'd2', name: 'Epilepsy, intractable', icd: 'G40.919' },
      { id: 'd3', name: 'Gastrostomy status', icd: 'Z93.1' },
    ],
    medications: [
      { id: 'm1', name: 'Levetiracetam', dosage: '250 mg', route: 'G-tube', frequency: 'Twice daily' },
      { id: 'm2', name: 'Baclofen', dosage: '5 mg', route: 'G-tube', frequency: 'Three times daily' },
      { id: 'm3', name: 'Omeprazole', dosage: '10 mg', route: 'G-tube', frequency: 'Daily' },
    ],
    procedures: [
      { id: 'p1', type: 'G-tube feeding', frequency: '5x daily' },
      { id: 'p2', type: 'Pulse oximetry', frequency: 'Overnight' },
    ],
    hospitalizations: [
      { id: 'hz1', date: '2026-06-02', hospital: "Children's Healthcare of Atlanta", reason: 'Status epilepticus', duration: '5 days' },
    ],
    history:
      'Born at 29 weeks. Diagnosed with cerebral palsy at 14 months. Seizures began at age 2 and remain uncontrolled despite three medications. G-tube placed 2020 due to aspiration risk.',
    prognosis: 'Lifelong condition; ongoing skilled care needs expected.',
    therapies: { speechPerWeek: '2', ptPerWeek: '2', otPerWeek: '1', otherVisits: 'Feeding therapy 1x/wk', fiveDaysPerWeek: 'no' },
    careFlags: ['nutrition.gtube', 'cardio.pulseOx', 'mobility.unableToAmbulate', 'neuro.seizures', 'bowel.incontinentOver3', 'behavior.developmentalDelay'],
    behaviorDescription: '',
    rehabServices: 'PT, OT, Speech therapy',
    otherHealthServices: 'Private duty nursing 8 hrs/day',
    dayInTheLife: '',
  };
  p.health.systems.neurological = { has: true, description: 'Intractable seizures; rescue medication; seizure monitoring' };
  p.health.systems.nutrition = { has: true, description: 'All nutrition via G-tube, 5 feeds daily' };
  p.health.systems.skeletal = { has: true, description: 'Non-ambulatory; wheelchair; AFOs' };
  p.health.systems.respiratory = { has: true, description: 'Overnight pulse oximetry; aspiration precautions' };
  p.costs = { physician: '250', dme: '600', drugs: '180', therapy: '1,200', nursing: '4,800', other: '150', otherLabel: 'Feeding supplies' };
  return p;
}
