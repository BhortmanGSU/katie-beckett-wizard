import type { Profile } from '../profile';

export interface FormRegistryEntry {
  id: string;
  code: string;
  title: string;
  plainTitle: string;
  currentRevision: string;
  /** Regex patterns that identify this form in OCR / PDF text. */
  matchPatterns: string[];
  /** Regex patterns that confirm the current revision. */
  currentRevisionPatterns: string[];
  /** Regex patterns that indicate an outdated or superseded form. */
  outdatedPatterns: string[];
  /** Days a physician/parent signature stays valid (null = no fixed window stated). */
  signatureValidityDays: number | null;
  whoCompletes: 'parent' | 'both' | 'doctor';
  parentSigns: boolean;
  doctorSigns: boolean;
  originalSignatureRequired: boolean;
  templatePath?: string; // relative to public/, e.g. 'forms/ga/form-94.pdf'
  whyItMatters: string;
  watchOut?: string;
}

export interface DocumentSlot {
  id: string;
  title: string;
  category: 'forms' | 'medical' | 'evaluations' | 'school' | 'identity' | 'parent';
  required: 'always' | 'conditional' | 'optional';
  /** If provided, explains when this slot is needed given the family's profile. */
  neededWhen?: (profile: Profile) => { needed: boolean; reason: string };
  maxAgeDays?: number;
  formId?: string;
  whyItMatters: string;
  howToGetIt: string;
}

export interface StateRulePack {
  stateCode: string;
  stateName: string;
  programName: string;
  lastVerified: string; // YYYY-MM-DD
  officialPageUrl: string;
  portalUrl: string;
  gatewayUrl: string;
  reviewContractor: string;
  submission: {
    teamName: string;
    addressLines: string[];
    phone: string;
    fax: string;
    oldAddressWarning: string;
  };
  keyFacts: { title: string; body: string }[];
  timings: {
    dma6aValidityDays: number;
    evaluationMaxAgeYears: number;
    hospitalSummaryMonths: number;
    nursingNotesDays: number;
    locAuthorizationYears: number;
    eligibilityRenewalMonths: number;
    changeReportDays: number;
    reconsiderationDays: number;
    hearingRequestDays: number;
  };
  forms: FormRegistryEntry[];
  documentSlots: DocumentSlot[];
  counties: string[];
  legalAid: { name: string; phone: string }[];
}
