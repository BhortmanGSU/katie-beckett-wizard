import { ageOn, type Profile } from '../profile';
import type { StateRulePack } from './types';

const EVAL_TRIGGER_RE =
  /autism|asd|asperger|pdd|cerebral palsy|developmental delay|intellectual disability|epilepsy|seizure|down/i;

function needsEval(p: Profile): { needed: boolean; reason: string } {
  const age = ageOn(p.child.dob);
  const diagText = p.health.diagnoses.map((d) => d.name).join(' ');
  const flagged =
    p.health.levelOfCare === 'icf' ||
    EVAL_TRIGGER_RE.test(diagText) ||
    p.health.careFlags.some((f) => f.startsWith('behavior.') || f === 'neuro.seizures');
  if (!flagged) {
    return {
      needed: false,
      reason: 'Only needed if applying under ICF/ID or for developmental, neurological, or autism-related diagnoses.',
    };
  }
  if (age !== null && age <= 5) {
    return {
      needed: true,
      reason: `For children ages 0–5, Georgia asks for a Comprehensive Developmental Evaluation (or Babies Can't Wait evaluation) done within the last 3 years.`,
    };
  }
  return {
    needed: true,
    reason: `For children ages 6–18 with developmental, neurological, or autism-related diagnoses, Georgia asks for a Comprehensive Psychological Evaluation done within the last 3 years.`,
  };
}

/**
 * Georgia TEFRA / Katie Beckett rule pack.
 * Kept in one plain TypeScript data file so parents, advocates, and contributors
 * can update dates, forms, or addresses through GitHub without touching app code.
 */
export const GEORGIA_RULES: StateRulePack = {
  stateCode: 'GA',
  stateName: 'Georgia',
  programName: 'Georgia TEFRA / Katie Beckett Medicaid',
  lastVerified: '2026-11-25',
  officialPageUrl: 'https://medicaid.georgia.gov/programs/all-programs/tefrakatie-beckett',
  portalUrl: 'https://katiebeckettportal.dch.georgia.gov/',
  gatewayUrl: 'https://gateway.ga.gov/',
  reviewContractor: 'Alliant Health Solutions (formerly GMCF)',
  submission: {
    teamName: 'Centralized Katie Beckett Medicaid Team',
    addressLines: ['2211 Beaver Ruin Road, Suite 150', 'Norcross, GA 30071'],
    phone: '678-248-7449',
    fax: '678-248-7459',
    oldAddressWarning:
      'Do not mail to P.O. Box 172, Norcross, GA 30091 — Georgia stopped accepting applications there on June 17, 2024.',
  },
  keyFacts: [
    {
      title: 'Your family income is not counted',
      body: 'Katie Beckett waives parental income and assets. Only money or assets in your child’s own name are looked at.',
    },
    {
      title: 'You do NOT need an SSI denial letter anymore',
      body: 'Georgia removed the old requirement to apply for SSI and get denied first (phased out 2023–2025). You can apply directly for Katie Beckett.',
    },
    {
      title: 'Watch out for the Georgia Gateway trap',
      body: 'Applying on Georgia Gateway alone often triggers an automatic income denial because Gateway checks standard Medicaid limits first. Always send your Form 94 (with "Katie Beckett" checked) and medical packet directly to the Centralized Katie Beckett Team.',
    },
    {
      title: 'Get your doctor’s signature LAST',
      body: 'The physician’s signature on Form DMA-6A is only valid for 90 days. Gather your school, therapy, and evaluation records first so the 90-day clock does not run out while you wait.',
    },
    {
      title: 'Medical approval lasts at least 2 years',
      body: 'Once approved, Georgia authorizes the medical Level of Care for at least 2 years. You will still have a shorter annual eligibility check each year.',
    },
  ],
  timings: {
    dma6aValidityDays: 90,
    evaluationMaxAgeYears: 3,
    hospitalSummaryMonths: 12,
    nursingNotesDays: 45,
    locAuthorizationYears: 2,
    eligibilityRenewalMonths: 12,
    changeReportDays: 10,
    reconsiderationDays: 30,
    hearingRequestDays: 30,
  },
  forms: [
    {
      id: 'form-94',
      code: 'Form 94',
      title: 'Georgia Medicaid Application (Form 94)',
      plainTitle: 'Main Medicaid Application',
      currentRevision: 'Revised 10/2022',
      matchPatterns: ['form\\s*94', 'medicaid\\s+application', 'express\\s+lane\\s+eligibility'],
      currentRevisionPatterns: ['revised\\s*10/2022', '10/2022'],
      outdatedPatterns: ['revised\\s*(?:0?[1-9]|1[0-2])/20(?:1\\d|20|21)', 'form\\s*94a'],
      signatureValidityDays: null,
      whoCompletes: 'parent',
      parentSigns: true,
      doctorSigns: false,
      originalSignatureRequired: false,
      templatePath: 'forms/ga/form-94.pdf',
      whyItMatters:
        'This opens your child’s Medicaid case. Checking the "Katie Beckett" box on page 1 routes it to the Katie Beckett team instead of standard income-based Medicaid.',
    },
    {
      id: 'dma-6a',
      code: 'DMA-6A',
      title: "Pediatric DMA-6(A) — Physician's Recommendation for Pediatric Care",
      plainTitle: "Doctor's Level-of-Care Recommendation",
      currentRevision: 'DMA-6A (1/2018)',
      matchPatterns: ['dma[\\s-]*6\\(?a\\)?', 'physician.?s\\s+recommendation\\s+for\\s+pediatric'],
      currentRevisionPatterns: ['1/2018', '01/2018'],
      outdatedPatterns: ['dma[\\s-]*6a\\s*\\((?:0?[1-9]|1[0-2])/20(?:0\\d|1[0-7])\\)'],
      signatureValidityDays: 90,
      whoCompletes: 'both',
      parentSigns: true,
      doctorSigns: true,
      originalSignatureRequired: true,
      templatePath: 'forms/ga/dma-6a.pdf',
      whyItMatters:
        'This is the centerpiece of the medical review. You complete Section A (and sign the records release); your pediatrician completes Sections B and C.',
      watchOut:
        'Every box must be answered (N/A is okay). Physician signatures must be original — signature stamps are rejected. Valid for only 90 days from the doctor’s signature date.',
    },
    {
      id: 'dma-706',
      code: 'DMA-706',
      title: 'TEFRA/Katie Beckett Medical Necessity / Level of Care Statement',
      plainTitle: 'Medical Necessity & Daily Needs Statement',
      currentRevision: 'Current DCH version',
      matchPatterns: ['medical\\s+necessity', 'level\\s+of\\s+care\\s+statement', 'description\\s+of\\s+skilled\\s+nursing'],
      currentRevisionPatterns: ['medical\\s+necessity/level\\s+of\\s+care\\s+statement'],
      outdatedPatterns: [],
      signatureValidityDays: null,
      whoCompletes: 'both',
      parentSigns: true,
      doctorSigns: true,
      originalSignatureRequired: true,
      templatePath: 'forms/ga/dma-706.pdf',
      whyItMatters:
        'Summarizes your child’s skilled needs by body system, therapy hours, hospitalizations, and school nursing. Signed by both you and your pediatrician.',
    },
    {
      id: 'dma-704',
      code: 'DMA-704',
      title: 'TEFRA/Katie Beckett Cost-Effectiveness Form (DMA-704)',
      plainTitle: 'Home Care Cost-Effectiveness Form',
      currentRevision: 'Rev. 10-04',
      matchPatterns: ['dma[\\s-]*704', 'cost[\\s-]*effectiveness\\s+form'],
      currentRevisionPatterns: ['rev\\.?\\s*10[\\s-]04'],
      outdatedPatterns: ['physician.?s\\s+referral\\s+form'],
      signatureValidityDays: null,
      whoCompletes: 'doctor',
      parentSigns: false,
      doctorSigns: true,
      originalSignatureRequired: true,
      templatePath: 'forms/ga/dma-704.pdf',
      whyItMatters:
        'Shows Georgia that caring for your child at home costs less than (or no more than) institutional care. Completed and signed by your child’s physician.',
    },
  ],
  documentSlots: [
    {
      id: 'form-94',
      title: 'Form 94 — Medicaid Application',
      category: 'forms',
      required: 'always',
      formId: 'form-94',
      whyItMatters: 'Required to start your child’s Katie Beckett application.',
      howToGetIt: 'This wizard fills it out for you automatically — or upload your own signed copy.',
    },
    {
      id: 'dma-6a',
      title: 'Signed DMA-6A (from pediatrician)',
      category: 'forms',
      required: 'always',
      formId: 'dma-6a',
      maxAgeDays: 90,
      whyItMatters: 'Establishes that your child meets Nursing Facility or ICF/ID level of care.',
      howToGetIt:
        'Download the Doctor’s Packet in Step 8, take it to your pediatrician for original ink signatures, and upload a scan or clear photo here.',
    },
    {
      id: 'dma-706',
      title: 'Signed Medical Necessity / LOC Statement (DMA-706)',
      category: 'forms',
      required: 'always',
      formId: 'dma-706',
      whyItMatters: 'Gives Alliant Health Solutions a clear snapshot of skilled care and therapy needs.',
      howToGetIt: 'Included in your Doctor’s Packet. Both you and your child’s doctor sign it.',
    },
    {
      id: 'dma-704',
      title: 'Signed Cost-Effectiveness Form (DMA-704)',
      category: 'forms',
      required: 'always',
      formId: 'dma-704',
      whyItMatters: 'Certifies home care is safe and cost-effective compared to institutional care.',
      howToGetIt: 'Included in your Doctor’s Packet for your pediatrician to complete and sign.',
    },
    {
      id: 'psych-eval',
      title: 'Developmental (0–5) or Psychological (6–18) Evaluation',
      category: 'evaluations',
      required: 'conditional',
      neededWhen: needsEval,
      maxAgeDays: 365 * 3,
      whyItMatters:
        'Alliant Health Solutions requires a formal evaluation (with IQ, adaptive functioning, or CARS/GARS scores) within the past 3 years for ICF/ID and developmental/autism/neurological diagnoses.',
      howToGetIt:
        'Ask your developmental pediatrician, psychologist, school psychologist, or Babies Can’t Wait coordinator for a copy of the full report.',
    },
    {
      id: 'iep-ifsp',
      title: 'Current IEP or IFSP',
      category: 'school',
      required: 'conditional',
      neededWhen: (p) => ({
        needed: p.child.schoolPlan === 'IEP' || p.child.schoolPlan === 'IFSP',
        reason: 'Required whenever an IEP or IFSP is in effect.',
      }),
      maxAgeDays: 365,
      whyItMatters: 'Shows the supports, accommodations, and school-based therapies your child receives.',
      howToGetIt: 'Request a PDF from your child’s school special education case manager or Babies Can’t Wait coordinator.',
    },
    {
      id: 'therapy-notes',
      title: 'Current Therapy Notes & Physician Orders (PT / OT / Speech / ABA)',
      category: 'medical',
      required: 'conditional',
      neededWhen: (p) => {
        const t = p.health.therapies;
        const has = Boolean(t.speechPerWeek || t.ptPerWeek || t.otPerWeek || t.otherVisits);
        return {
          needed: has,
          reason: 'All therapies must be ordered by a physician and backed by current, individually signed therapy notes.',
        };
      },
      maxAgeDays: 90,
      whyItMatters:
        'Reviewers check that ordered therapies are actively in place (especially for Nursing Facility level of care).',
      howToGetIt: 'Ask your therapy clinic(s) and school therapists for the last 1–2 months of signed progress notes and the current Plan of Care.',
    },
    {
      id: 'hospital-discharge',
      title: 'Most Recent Hospital Discharge Summary',
      category: 'medical',
      required: 'conditional',
      neededWhen: (p) => ({
        needed: p.health.hospitalizations.length > 0,
        reason: 'DMA-706 asks for the most recent discharge summary for any hospitalization in the last 12 months.',
      }),
      maxAgeDays: 365,
      whyItMatters: 'Documents medical fragility and acute care needs.',
      howToGetIt: 'Download from your hospital patient portal (like MyChart) or request from Medical Records.',
    },
    {
      id: 'nursing-notes',
      title: 'Most Recent Month of Skilled Nursing Notes',
      category: 'medical',
      required: 'conditional',
      neededWhen: (p) => ({
        needed: p.child.nurseAtSchool === 'yes' || Number(p.child.skilledNursingHoursPerDay) > 0,
        reason: 'Required when your child has a school nurse or private-duty skilled nursing.',
      }),
      maxAgeDays: 45,
      whyItMatters: 'Shows the day-to-day skilled nursing interventions your child receives.',
      howToGetIt: 'Ask your home health agency or school nurse for the most recent 30 days of nursing notes.',
    },
    {
      id: 'child-id',
      title: 'Child’s Birth Certificate & Social Security Card',
      category: 'identity',
      required: 'always',
      whyItMatters: 'Verifies your child’s age, identity, and U.S. citizenship for Medicaid.',
      howToGetIt: 'A clear phone photo or scan works great. Keep the originals safe.',
    },
    {
      id: 'insurance-card',
      title: 'Private Health Insurance Card (Front & Back)',
      category: 'identity',
      required: 'conditional',
      neededWhen: (p) => ({
        needed: p.insurance.childHasPrivate === 'yes',
        reason: 'Georgia Medicaid coordinates as secondary insurance when your child has private coverage.',
      }),
      whyItMatters: 'Helps Medicaid coordinate benefits smoothly without billing mix-ups.',
      howToGetIt: 'Take a clear photo of the front and back of your insurance card.',
    },
    {
      id: 'day-in-life',
      title: 'Parent "Day in the Life" Letter',
      category: 'parent',
      required: 'optional',
      whyItMatters:
        'Forms only tell part of the story. A calm, honest letter describing your child’s 24-hour care helps reviewers see the real safety and medical needs at home.',
      howToGetIt: 'Write it in Step 4 and this wizard will turn it into a clean, ready-to-attach letter — or upload one you already wrote.',
    },
  ],
  counties: [
    'Appling', 'Atkinson', 'Bacon', 'Baker', 'Baldwin', 'Banks', 'Barrow', 'Bartow', 'Ben Hill', 'Berrien',
    'Bibb', 'Bleckley', 'Brantley', 'Brooks', 'Bryan', 'Bulloch', 'Burke', 'Butts', 'Calhoun', 'Camden',
    'Candler', 'Carroll', 'Catoosa', 'Charlton', 'Chatham', 'Chattahoochee', 'Chattooga', 'Cherokee', 'Clarke', 'Clay',
    'Clayton', 'Clinch', 'Cobb', 'Coffee', 'Colquitt', 'Columbia', 'Cook', 'Coweta', 'Crawford', 'Crisp',
    'Dade', 'Dawson', 'Decatur', 'DeKalb', 'Dodge', 'Dooly', 'Dougherty', 'Douglas', 'Early', 'Echols',
    'Effingham', 'Elbert', 'Emanuel', 'Evans', 'Fannin', 'Fayette', 'Floyd', 'Forsyth', 'Franklin', 'Fulton',
    'Gilmer', 'Glascock', 'Glynn', 'Gordon', 'Grady', 'Greene', 'Gwinnett', 'Habersham', 'Hall', 'Hancock',
    'Haralson', 'Harris', 'Hart', 'Heard', 'Henry', 'Houston', 'Irwin', 'Jackson', 'Jasper', 'Jeff Davis',
    'Jefferson', 'Jenkins', 'Johnson', 'Jones', 'Lamar', 'Lanier', 'Laurens', 'Lee', 'Liberty', 'Lincoln',
    'Long', 'Lowndes', 'Lumpkin', 'Macon', 'Madison', 'Marion', 'McDuffie', 'McIntosh', 'Meriwether', 'Miller',
    'Mitchell', 'Monroe', 'Montgomery', 'Morgan', 'Murray', 'Muscogee', 'Newton', 'Oconee', 'Oglethorpe', 'Paulding',
    'Peach', 'Pickens', 'Pierce', 'Pike', 'Polk', 'Pulaski', 'Putnam', 'Quitman', 'Rabun', 'Randolph',
    'Richmond', 'Rockdale', 'Schley', 'Screven', 'Seminole', 'Spalding', 'Stephens', 'Stewart', 'Sumter', 'Talbot',
    'Taliaferro', 'Tattnall', 'Taylor', 'Telfair', 'Terrell', 'Thomas', 'Tift', 'Toombs', 'Towns', 'Treutlen',
    'Troup', 'Turner', 'Twiggs', 'Union', 'Upson', 'Walker', 'Walton', 'Ware', 'Warren', 'Washington',
    'Wayne', 'Webster', 'Wheeler', 'White', 'Whitfield', 'Wilcox', 'Wilkes', 'Wilkinson', 'Worth',
  ],
  legalAid: [
    { name: 'Georgia Advocacy Office', phone: '1-800-537-2329' },
    { name: 'Georgia Legal Services Program', phone: '1-800-498-9469' },
    { name: 'Parent to Parent of Georgia', phone: '1-800-229-2038' },
  ],
};
