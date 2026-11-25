import { formatAddress, fullName, usDate, type Profile } from '../../profile';
import type { FieldSpec, FormMap } from '../types';

interface PersonRow {
  firstName: string;
  middleInitial: string;
  lastName: string;
  suffix: string;
  race: string;
  sex: string;
  dob: string;
  relationship: string;
  needsCoverage: string;
  ssn: string;
  citizen: string;
  fatherInHome: string;
  motherInHome: string;
}

function householdRows(p: Profile): PersonRow[] {
  const yn = (v: string) => (v === 'yes' ? 'Y' : v === 'no' ? 'N' : '');
  const rows: PersonRow[] = [
    // Row 1: Applicant (parent/guardian)
    {
      firstName: p.applicant.firstName,
      middleInitial: p.applicant.middleInitial,
      lastName: p.applicant.lastName,
      suffix: '',
      race: p.applicant.race,
      sex: p.applicant.sex,
      dob: usDate(p.applicant.dob),
      relationship: 'Self',
      needsCoverage: 'N',
      ssn: p.applicant.ssn,
      citizen: yn(p.applicant.citizenOrQualified),
      fatherInHome: '',
      motherInHome: '',
    },
    // Row 2: Child applying for Katie Beckett
    {
      firstName: p.child.firstName,
      middleInitial: p.child.middleInitial,
      lastName: p.child.lastName,
      suffix: p.child.suffix,
      race: p.child.race,
      sex: p.child.sex,
      dob: usDate(p.child.dob),
      relationship: 'Child',
      needsCoverage: 'Y',
      ssn: p.child.ssn,
      citizen: yn(p.child.citizenOrQualified),
      fatherInHome: yn(p.fatherInHome),
      motherInHome: yn(p.motherInHome),
    },
  ];
  for (const m of p.household) {
    const isChild = /son|daughter|child|step/i.test(m.relationship);
    rows.push({
      firstName: m.firstName,
      middleInitial: m.middleInitial,
      lastName: m.lastName,
      suffix: m.suffix,
      race: m.race,
      sex: m.sex,
      dob: usDate(m.dob),
      relationship: m.relationship,
      needsCoverage: yn(m.needsCoverage),
      ssn: m.ssn,
      citizen: yn(m.citizenOrQualified),
      fatherInHome: isChild ? yn(p.fatherInHome) : '',
      motherInHome: isChild ? yn(p.motherInHome) : '',
    });
  }
  return rows.slice(0, 7);
}

const householdTableFields: FieldSpec[] = Array.from({ length: 7 }, (_, i) => i).flatMap((i): FieldSpec[] => {
  // Table rows sit below the header (y~394) down to ~258, ~19.5pt per row
  const y = 376 - i * 19.5;
  const get = (p: Profile) => householdRows(p)[i];
  return [
    { kind: 'text', label: `Row ${i + 1} First`, page: 1, x: 30, y, size: 8, maxWidth: 74, value: ({ profile }) => get(profile)?.firstName ?? '' },
    { kind: 'text', label: `Row ${i + 1} MI`, page: 1, x: 112, y, size: 8, maxWidth: 16, value: ({ profile }) => get(profile)?.middleInitial ?? '' },
    { kind: 'text', label: `Row ${i + 1} Last`, page: 1, x: 134, y, size: 8, maxWidth: 74, value: ({ profile }) => get(profile)?.lastName ?? '' },
    { kind: 'text', label: `Row ${i + 1} Suffix`, page: 1, x: 214, y, size: 8, maxWidth: 26, value: ({ profile }) => get(profile)?.suffix ?? '' },
    { kind: 'text', label: `Row ${i + 1} Race`, page: 1, x: 248, y, size: 8, maxWidth: 44, value: ({ profile }) => get(profile)?.race ?? '' },
    { kind: 'text', label: `Row ${i + 1} Sex`, page: 1, x: 302, y, size: 8, maxWidth: 18, value: ({ profile }) => get(profile)?.sex ?? '' },
    { kind: 'text', label: `Row ${i + 1} DOB`, page: 1, x: 332, y, size: 7.5, maxWidth: 62, value: ({ profile }) => get(profile)?.dob ?? '' },
    { kind: 'text', label: `Row ${i + 1} Rel`, page: 1, x: 406, y, size: 7.5, maxWidth: 52, value: ({ profile }) => get(profile)?.relationship ?? '' },
    { kind: 'text', label: `Row ${i + 1} Coverage`, page: 1, x: 482, y, size: 8, maxWidth: 24, value: ({ profile }) => get(profile)?.needsCoverage ?? '' },
    { kind: 'text', label: `Row ${i + 1} SSN`, page: 1, x: 520, y, size: 7.5, maxWidth: 68, value: ({ profile }) => get(profile)?.ssn ?? '' },
    { kind: 'text', label: `Row ${i + 1} Citizen`, page: 1, x: 626, y, size: 8, maxWidth: 24, value: ({ profile }) => get(profile)?.citizen ?? '' },
    { kind: 'text', label: `Row ${i + 1} Father`, page: 1, x: 688, y, size: 8, maxWidth: 22, value: ({ profile }) => get(profile)?.fatherInHome ?? '' },
    { kind: 'text', label: `Row ${i + 1} Mother`, page: 1, x: 736, y, size: 8, maxWidth: 22, value: ({ profile }) => get(profile)?.motherInHome ?? '' },
  ];
});

function incomeOf(p: Profile, type: Profile['income'][number]['type'], index = 0) {
  return p.income.filter((x) => x.type === type)[index];
}

function incomeRowFields(
  type: Profile['income'][number]['type'],
  y: number,
  index = 0,
  employerY?: number,
): FieldSpec[] {
  const fields: FieldSpec[] = [
    { kind: 'text', label: `Income ${type}[${index}] amount`, page: 2, x: 120, y, size: 8, maxWidth: 74, value: ({ profile }) => incomeOf(profile, type, index)?.amount ?? '' },
    { kind: 'text', label: `Income ${type}[${index}] freq`, page: 2, x: 204, y, size: 8, maxWidth: 74, value: ({ profile }) => incomeOf(profile, type, index)?.howOften ?? '' },
    { kind: 'text', label: `Income ${type}[${index}] person`, page: 2, x: 302, y, size: 8, maxWidth: 150, value: ({ profile }) => incomeOf(profile, type, index)?.person ?? '' },
  ];
  if (employerY !== undefined) {
    fields.push({
      kind: 'text',
      label: `Income ${type}[${index}] employer`,
      page: 2,
      x: 122,
      y: employerY,
      size: 8,
      maxWidth: 330,
      value: ({ profile }) => incomeOf(profile, type, index)?.employer ?? '',
    });
  }
  return fields;
}

export const form94Map: FormMap = {
  formId: 'form-94',
  fields: [
    // ---------- PAGE 1 ----------
    { kind: 'check', label: 'Child under 19', page: 0, x: 282, y: 546, size: 8.5, when: () => true },
    { kind: 'check', label: 'Katie Beckett', page: 0, x: 282, y: 529, size: 8.5, when: () => true },

    // Your Name (parent / applicant)
    { kind: 'text', label: 'First Name', page: 0, x: 142, y: 429, size: 9, maxWidth: 92, value: ({ profile }) => profile.applicant.firstName },
    { kind: 'text', label: 'M.I.', page: 0, x: 242, y: 429, size: 9, maxWidth: 40, value: ({ profile }) => profile.applicant.middleInitial },
    { kind: 'text', label: 'Last Name', page: 0, x: 313, y: 429, size: 9, maxWidth: 116, value: ({ profile }) => profile.applicant.lastName },
    { kind: 'text', label: 'Maiden Name', page: 0, x: 436, y: 429, size: 9, maxWidth: 142, value: ({ profile }) => profile.applicant.maidenName },
    { kind: 'text', label: "Today's Date", page: 0, x: 632, y: 432, size: 9, maxWidth: 110, value: ({ signDate }) => signDate },

    // Mailing address
    { kind: 'text', label: 'Mailing Address', page: 0, x: 105, y: 412, size: 9, maxWidth: 356, value: ({ profile }) => profile.mailingAddress.street },
    { kind: 'text', label: 'City', page: 0, x: 496, y: 412, size: 9, maxWidth: 88, value: ({ profile }) => profile.mailingAddress.city },
    { kind: 'text', label: 'State', page: 0, x: 618, y: 412, size: 9, maxWidth: 44, value: ({ profile }) => profile.mailingAddress.state },
    { kind: 'text', label: 'Zip Code', page: 0, x: 710, y: 412, size: 9, maxWidth: 50, value: ({ profile }) => profile.mailingAddress.zip },

    // Residence address, phone, email
    {
      kind: 'text',
      label: 'Residence Address',
      page: 0,
      x: 36,
      y: 389,
      size: 8.5,
      maxWidth: 425,
      value: ({ profile }) => (profile.residenceDifferent ? formatAddress(profile.residenceAddress) : 'Same as mailing address'),
    },
    { kind: 'text', label: 'Phone Number', page: 0, x: 474, y: 389, size: 8.5, maxWidth: 108, value: ({ profile }) => profile.applicant.phone },
    { kind: 'text', label: 'Email Address', page: 0, x: 590, y: 389, size: 8.5, maxWidth: 168, value: ({ profile }) => profile.applicant.email },

    // Electronic communication, language, interpreter
    { kind: 'check', label: 'Electronic Comm Yes', page: 0, x: 168, y: 381, size: 7.5, when: ({ profile }) => profile.applicant.electronicCommunication === 'yes' },
    { kind: 'check', label: 'Electronic Comm No', page: 0, x: 207, y: 381, size: 7.5, when: ({ profile }) => profile.applicant.electronicCommunication === 'no' },
    { kind: 'text', label: 'Preferred Language', page: 0, x: 618, y: 378, size: 8.5, maxWidth: 135, value: ({ profile }) => profile.applicant.preferredLanguage },
    { kind: 'text', label: 'Interpreter Y/N', page: 0, x: 713, y: 366, size: 8, maxWidth: 20, value: ({ profile }) => (profile.applicant.needsInterpreter === 'yes' ? 'Yes' : profile.applicant.needsInterpreter === 'no' ? 'No' : '') },

    // Reasonable modification
    { kind: 'check', label: 'ADA Mod Yes', page: 0, x: 434, y: 345, size: 7.5, when: ({ profile }) => profile.applicant.needsReasonableModification === 'yes' },
    { kind: 'check', label: 'ADA Mod No', page: 0, x: 460, y: 345, size: 7.5, when: ({ profile }) => profile.applicant.needsReasonableModification === 'no' },
    {
      kind: 'text',
      label: 'ADA Mod Details',
      page: 0,
      x: 240,
      y: 331,
      size: 8,
      maxWidth: 500,
      value: ({ profile }) => (profile.applicant.needsReasonableModification === 'yes' ? profile.applicant.reasonableModificationDetails : ''),
    },

    // Authorized representative (only when enabled)
    { kind: 'text', label: 'Auth Rep First', page: 0, x: 148, y: 201, size: 8.5, maxWidth: 88, value: ({ profile }) => (profile.authorizedRep.use ? profile.authorizedRep.firstName : '') },
    { kind: 'text', label: 'Auth Rep Last', page: 0, x: 242, y: 201, size: 8.5, maxWidth: 250, value: ({ profile }) => (profile.authorizedRep.use ? profile.authorizedRep.lastName : '') },
    { kind: 'text', label: 'Auth Rep Org', page: 0, x: 508, y: 201, size: 8.5, maxWidth: 245, value: ({ profile }) => (profile.authorizedRep.use ? profile.authorizedRep.organization : '') },
    { kind: 'text', label: 'Auth Rep Street', page: 0, x: 76, y: 181, size: 8.5, maxWidth: 295, value: ({ profile }) => (profile.authorizedRep.use ? profile.authorizedRep.address.street : '') },
    { kind: 'text', label: 'Auth Rep City', page: 0, x: 404, y: 181, size: 8.5, maxWidth: 96, value: ({ profile }) => (profile.authorizedRep.use ? profile.authorizedRep.address.city : '') },
    { kind: 'text', label: 'Auth Rep State', page: 0, x: 536, y: 181, size: 8.5, maxWidth: 80, value: ({ profile }) => (profile.authorizedRep.use ? profile.authorizedRep.address.state : '') },
    { kind: 'text', label: 'Auth Rep Zip', page: 0, x: 710, y: 181, size: 8.5, maxWidth: 50, value: ({ profile }) => (profile.authorizedRep.use ? profile.authorizedRep.address.zip : '') },
    { kind: 'text', label: 'Auth Rep Phone', page: 0, x: 382, y: 158, size: 8.5, maxWidth: 118, value: ({ profile }) => (profile.authorizedRep.use ? profile.authorizedRep.phone : '') },
    { kind: 'text', label: 'Auth Rep Email', page: 0, x: 568, y: 151, size: 8.5, maxWidth: 188, value: ({ profile }) => (profile.authorizedRep.use ? profile.authorizedRep.email : '') },

    // ---------- PAGE 2 ----------
    ...householdTableFields,
    {
      kind: 'text',
      label: 'Veteran / Military Y/N',
      page: 1,
      x: 694,
      y: 162,
      size: 9,
      maxWidth: 30,
      value: ({ profile }) => (profile.veteranInFamily === 'yes' ? 'Y' : profile.veteranInFamily === 'no' ? 'N' : ''),
    },
    // Unpaid medical bills (past 3 months)
    { kind: 'check', label: 'Unpaid bills Yes', page: 1, x: 180, y: 66, size: 7.5, when: ({ profile }) => profile.unpaidMedicalBills === 'yes' },
    { kind: 'check', label: 'Unpaid bills No', page: 1, x: 206, y: 66, size: 7.5, when: ({ profile }) => profile.unpaidMedicalBills === 'no' },
    {
      kind: 'text',
      label: 'Unpaid bills months',
      page: 1,
      x: 318,
      y: 63,
      size: 8,
      maxWidth: 124,
      value: ({ profile }) => (profile.unpaidMedicalBills === 'yes' ? profile.unpaidMedicalBillMonths : ''),
    },
    // Other health insurance
    { kind: 'check', label: 'Other health ins Yes', page: 1, x: 652, y: 66, size: 7.5, when: ({ profile }) => profile.insurance.childHasPrivate === 'yes' },
    { kind: 'check', label: 'Other health ins No', page: 1, x: 680, y: 66, size: 7.5, when: ({ profile }) => profile.insurance.childHasPrivate === 'no' },
    // Currently on Medicaid
    { kind: 'check', label: 'On Medicaid Yes', page: 1, x: 115, y: 54, size: 7.5, when: ({ profile }) => profile.insurance.currentlyOnMedicaid === 'yes' },
    { kind: 'check', label: 'On Medicaid No', page: 1, x: 141, y: 54, size: 7.5, when: ({ profile }) => profile.insurance.currentlyOnMedicaid === 'no' },
    {
      kind: 'text',
      label: 'Insurance Company & Policy #',
      page: 1,
      x: 348,
      y: 51,
      size: 7.5,
      maxWidth: 132,
      value: ({ profile }) =>
        profile.insurance.childHasPrivate === 'yes'
          ? [profile.insurance.company, profile.insurance.policyNumber].filter(Boolean).join(' / ')
          : '',
    },
    // Anyone in household has private insurance
    { kind: 'check', label: 'Anyone private ins Yes', page: 1, x: 729, y: 54, size: 7.5, when: ({ profile }) => profile.insurance.anyoneHasPrivate === 'yes' },
    { kind: 'check', label: 'Anyone private ins No', page: 1, x: 754, y: 54, size: 7.5, when: ({ profile }) => profile.insurance.anyoneHasPrivate === 'no' },

    // ---------- PAGE 3 ----------
    ...incomeRowFields('wages', 498, 0, 475),
    ...incomeRowFields('wages', 451, 1, 428),
    ...incomeRowFields('ssi', 404, 0),
    ...incomeRowFields('workersComp', 380, 0),
    ...incomeRowFields('pension', 356, 0),
    ...incomeRowFields('childSupport', 332, 0),
    ...incomeRowFields('unemployment', 308, 0),
    ...incomeRowFields('other', 284, 0),

    // Tax filer questions 1–4
    { kind: 'check', label: 'Tax Q1 Yes', page: 2, x: 580, y: 496, size: 7.5, when: ({ profile }) => profile.tax.plansToFile === 'yes' },
    { kind: 'check', label: 'Tax Q1 No', page: 2, x: 605, y: 496, size: 7.5, when: ({ profile }) => profile.tax.plansToFile === 'no' },
    { kind: 'text', label: 'Tax Q1 Who', page: 2, x: 486, y: 471, size: 8, maxWidth: 270, value: ({ profile }) => (profile.tax.plansToFile === 'yes' ? profile.tax.filers : '') },

    { kind: 'check', label: 'Tax Q2 Yes', page: 2, x: 720, y: 463, size: 7.5, when: ({ profile }) => profile.tax.fileJointly === 'yes' },
    { kind: 'check', label: 'Tax Q2 No', page: 2, x: 746, y: 463, size: 7.5, when: ({ profile }) => profile.tax.fileJointly === 'no' },
    { kind: 'text', label: 'Tax Q2 Spouse', page: 2, x: 486, y: 438, size: 8, maxWidth: 270, value: ({ profile }) => (profile.tax.fileJointly === 'yes' ? profile.tax.spouseName : '') },

    { kind: 'check', label: 'Tax Q3 Yes', page: 2, x: 490, y: 418, size: 7.5, when: ({ profile }) => profile.tax.claimDependents === 'yes' },
    { kind: 'check', label: 'Tax Q3 No', page: 2, x: 515, y: 418, size: 7.5, when: ({ profile }) => profile.tax.claimDependents === 'no' },
    { kind: 'text', label: 'Tax Q3 Dependents', page: 2, x: 486, y: 392, size: 8, maxWidth: 270, value: ({ profile }) => (profile.tax.claimDependents === 'yes' ? profile.tax.dependents : '') },

    { kind: 'check', label: 'Tax Q4 Yes', page: 2, x: 521, y: 373, size: 7.5, when: ({ profile }) => profile.tax.claimedByOther === 'yes' },
    { kind: 'check', label: 'Tax Q4 No', page: 2, x: 546, y: 373, size: 7.5, when: ({ profile }) => profile.tax.claimedByOther === 'no' },
    { kind: 'text', label: 'Tax Q4 Details', page: 2, x: 486, y: 345, size: 8, maxWidth: 270, value: ({ profile }) => (profile.tax.claimedByOther === 'yes' ? profile.tax.claimedByOtherDetails : '') },

    // Absent parent row (bottom of page 3)
    { kind: 'text', label: 'Absent parent child', page: 2, x: 36, y: 62, size: 8, maxWidth: 120, value: ({ profile }) => (profile.absentParent.present ? fullName(profile.child) : '') },
    { kind: 'text', label: 'Absent parent name', page: 2, x: 170, y: 62, size: 8, maxWidth: 210, value: ({ profile }) => (profile.absentParent.present ? profile.absentParent.name : '') },
    { kind: 'text', label: 'Absent parent coverage', page: 2, x: 458, y: 62, size: 8, maxWidth: 50, value: ({ profile }) => (profile.absentParent.present ? (profile.absentParent.hasCoverage === 'yes' ? 'Yes' : profile.absentParent.hasCoverage === 'no' ? 'No' : '') : '') },
    { kind: 'text', label: 'Absent parent insurance', page: 2, x: 576, y: 62, size: 8, maxWidth: 180, value: ({ profile }) => (profile.absentParent.present && profile.absentParent.hasCoverage === 'yes' ? profile.absentParent.insurance : '') },

    // ---------- PAGE 4 ----------
    { kind: 'check', label: 'Express Lane Yes', page: 3, x: 30, y: 472, size: 8.5, when: ({ profile }) => profile.expressLane === 'yes' },
    { kind: 'check', label: 'Express Lane No', page: 3, x: 94, y: 472, size: 8.5, when: ({ profile }) => profile.expressLane === 'no' },
    {
      kind: 'check',
      label: 'Citizenship declaration (parent/guardian)',
      page: 3,
      x: 29,
      y: 320,
      size: 8,
      when: ({ profile }) => profile.child.citizenOrQualified === 'yes' && profile.applicant.citizenOrQualified === 'yes',
    },
    {
      kind: 'check',
      label: 'Citizenship declaration (best of knowledge)',
      page: 3,
      x: 29,
      y: 295,
      size: 8,
      when: ({ profile }) => profile.child.citizenOrQualified === 'yes' && profile.applicant.citizenOrQualified !== 'yes',
    },
    {
      kind: 'signature',
      label: 'Applicant Signature',
      page: 3,
      x: 112,
      y: 256,
      width: 240,
      height: 22,
    },
    {
      kind: 'text',
      label: 'Applicant Signature Date',
      page: 3,
      x: 552,
      y: 260,
      size: 9.5,
      maxWidth: 120,
      value: (c) => (c.parentSignature ? c.signDate : ''),
    },

    // ---------- PAGE 5 ----------
    { kind: 'check', label: 'Voter Reg: Yes', page: 4, x: 42, y: 535, size: 8, when: ({ profile }) => profile.voterRegistration === 'yes' },
    { kind: 'check', label: 'Voter Reg: No', page: 4, x: 42, y: 523, size: 8, when: ({ profile }) => profile.voterRegistration === 'no' },
    { kind: 'check', label: 'Voter Reg: Decline', page: 4, x: 42, y: 512, size: 8, when: ({ profile }) => profile.voterRegistration === 'decline' },
  ],
};
