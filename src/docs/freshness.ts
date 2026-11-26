import { GEORGIA_RULES } from '../rules/ga';
import type { DocumentSlot, FormRegistryEntry } from '../rules/types';

export type FreshnessStatus = 'current' | 'warning' | 'expired' | 'outdated-form' | 'unchecked';

export interface SuggestedField {
  key: 'physician.npi' | 'physician.phone' | 'physician.fax' | 'diagnosis.icd' | 'documentDate';
  label: string;
  value: string;
}

export interface FreshnessReport {
  status: FreshnessStatus;
  headline: string;
  details: string[];
  detectedFormId?: string;
  detectedFormCode?: string;
  detectedDate?: string; // YYYY-MM-DD
  daysOld?: number;
  daysRemaining?: number;
  suggestions: SuggestedField[];
}

const DATE_RE =
  /\b(?:(0?[1-9]|1[0-2])[/\-](0?[1-9]|[12]\d|3[01])[/\-]((?:19|20)\d{2}|\d{2})|(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(0?[1-9]|[12]\d|3[01]),?\s+((?:19|20)\d{2}))\b/gi;

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Extract plausible document dates (YYYY-MM-DD) from text, preferring recent dates (not ancient form revision dates). */
export function extractDates(text: string, now: Date = new Date()): string[] {
  const found: string[] = [];
  const maxYear = now.getFullYear() + 1;
  let m: RegExpExecArray | null;
  DATE_RE.lastIndex = 0;
  while ((m = DATE_RE.exec(text)) !== null) {
    let year: number;
    let month: number;
    let day: number;
    if (m[1]) {
      month = Number(m[1]);
      day = Number(m[2]);
      year = Number(m[3]);
      if (year < 100) year += year >= 50 ? 1900 : 2000;
    } else {
      month = MONTHS[m[4].slice(0, 3).toLowerCase()];
      day = Number(m[5]);
      year = Number(m[6]);
    }
    if (year < 2015 || year > maxYear || month < 1 || month > 12 || day < 1 || day > 31) continue;
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!found.includes(iso)) found.push(iso);
  }
  // Sort newest first
  return found.sort((a, b) => (a < b ? 1 : -1));
}

export function extractSuggestions(text: string): SuggestedField[] {
  const out: SuggestedField[] = [];
  const npiMatch = text.match(/\bNPI[:#\s-]*([12]\d{9})\b/i);
  if (npiMatch) {
    out.push({ key: 'physician.npi', label: 'Doctor NPI', value: npiMatch[1] });
  }
  const faxMatch = text.match(/\bFax[:#\s-]*(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})\b/i);
  if (faxMatch) {
    out.push({ key: 'physician.fax', label: 'Doctor Fax', value: faxMatch[1].trim() });
  }
  const phoneMatch = text.match(/\b(?:Phone|Tel|Telephone)[:#\s-]*(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})\b/i);
  if (phoneMatch) {
    out.push({ key: 'physician.phone', label: 'Doctor Phone', value: phoneMatch[1].trim() });
  }
  const icdMatches = text.match(/\b([A-TV-Z]\d{2}(?:\.[0-9A-Z]{1,4})?)\b/g);
  if (icdMatches) {
    const unique = Array.from(new Set(icdMatches)).slice(0, 3);
    for (const code of unique) {
      out.push({ key: 'diagnosis.icd', label: `Diagnosis code ${code}`, value: code });
    }
  }
  return out;
}

function matchForm(text: string): FormRegistryEntry | undefined {
  let best: FormRegistryEntry | undefined;
  let bestScore = 0;
  for (const form of GEORGIA_RULES.forms) {
    let score = 0;
    form.matchPatterns.forEach((p, idx) => {
      if (new RegExp(p, 'i').test(text)) {
        // First pattern is the explicit form code/title, so weight it highest.
        score += idx === 0 ? 3 : 1;
      }
    });
    if (score > bestScore) {
      bestScore = score;
      best = form;
    }
  }
  return best;
}

function daysBetween(isoDate: string, now: Date): number {
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return 0;
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000);
}

/**
 * Inspect extracted text + optional user-entered document date against Georgia's rules.
 * Pure function so it can be unit-tested thoroughly.
 */
export function checkDocumentFreshness(
  text: string,
  slot: DocumentSlot | undefined,
  userDate?: string,
  now: Date = new Date(),
): FreshnessReport {
  const details: string[] = [];
  const suggestions = extractSuggestions(text);
  const detectedForm = text.trim() ? matchForm(text) : undefined;

  let status: FreshnessStatus = 'current';
  let headline = 'Looks good';

  // 1. Check for superseded/outdated official form revisions
  if (detectedForm) {
    const isOutdated = detectedForm.outdatedPatterns.some((p) => new RegExp(p, 'i').test(text));
    const isCurrent =
      detectedForm.currentRevisionPatterns.length === 0 ||
      detectedForm.currentRevisionPatterns.some((p) => new RegExp(p, 'i').test(text));

    if (isOutdated) {
      status = 'outdated-form';
      headline = `This looks like an older version of ${detectedForm.code}`;
      details.push(
        `Georgia’s current version is "${detectedForm.currentRevision}". Using an older form can cause delays — you can download the current pre-filled form right from this app.`,
      );
    } else if (isCurrent) {
      details.push(`Matched current Georgia ${detectedForm.code} (${detectedForm.currentRevision}).`);
    } else {
      details.push(`Recognized as ${detectedForm.code}, but could not read the revision date clearly — please double-check it matches "${detectedForm.currentRevision}".`);
    }
  }

  // Check for old Norcross P.O. Box on non-Form-94 cover sheets or old instructions
  if (/p\.?o\.?\s*box\s*172\b.*30091/i.test(text) && detectedForm?.id !== 'form-94') {
    details.push('Heads up: this page mentions the old P.O. Box 172 (30091). Mail to 2211 Beaver Ruin Rd, Suite 150, Norcross, GA 30071 instead.');
  }

  // Check for superseded "Physician's Referral Form"
  if (/physician.?s\s+referral\s+form/i.test(text)) {
    status = 'outdated-form';
    headline = 'Superseded form detected';
    details.push('Georgia replaced the old "Physician’s Referral Form" with Cost-Effectiveness Form DMA-704.');
  }

  // 2. Check document / signature age
  const dates = extractDates(text, now);
  const effectiveDate = userDate || dates[0];
  let daysOld: number | undefined;
  let daysRemaining: number | undefined;

  if (effectiveDate) {
    daysOld = daysBetween(effectiveDate, now);
    const maxAge = slot?.maxAgeDays ?? detectedForm?.signatureValidityDays ?? undefined;
    if (maxAge !== undefined) {
      daysRemaining = maxAge - daysOld;
      if (daysOld > maxAge) {
        status = 'expired';
        headline =
          slot?.id === 'dma-6a'
            ? `DMA-6A is ${daysOld} days old (past Georgia’s 90-day limit)`
            : `This document is ${daysOld} days old (Georgia asks for within ${Math.round(maxAge / 30)} months)`;
        details.push(
          slot?.id === 'dma-6a'
            ? 'Georgia requires a fresh physician signature on DMA-6A dated within 90 days of submission.'
            : 'Please check whether you have a more recent copy so Alliant Health Solutions does not pause the review.',
        );
      } else if (daysRemaining <= 15 && maxAge <= 90) {
        if (status === 'current') status = 'warning';
        headline = `Expiring soon — ${daysRemaining} days left`;
        details.push(`Dated ${effectiveDate}. Submit within ${daysRemaining} days or ask your doctor for a fresh signature.`);
      } else if (daysRemaining <= 60 && maxAge > 90) {
        if (status === 'current') status = 'warning';
        headline = `Getting close to the age limit (${daysRemaining} days left)`;
        details.push(`Dated ${effectiveDate}. Still valid today, but keep an eye on the clock.`);
      } else {
        details.push(`Dated ${effectiveDate} (${daysOld} days old — within Georgia’s freshness window).`);
      }
    } else {
      details.push(`Date noted: ${effectiveDate}.`);
    }
  } else if (slot?.maxAgeDays) {
    if (status === 'current') status = 'unchecked';
    headline = 'Add the date on this document so we can check freshness';
    details.push('We couldn’t read a clear date from the scan. Typing the date below lets us track the clock for you.');
  }

  if (details.length === 0) {
    details.push('Saved safely on your device. No issues spotted.');
  }

  return {
    status,
    headline,
    details,
    detectedFormId: detectedForm?.id,
    detectedFormCode: detectedForm?.code,
    detectedDate: dates[0],
    daysOld,
    daysRemaining,
    suggestions,
  };
}
