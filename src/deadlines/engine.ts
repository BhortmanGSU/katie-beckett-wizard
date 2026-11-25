import { GEORGIA_RULES } from '../rules/ga';
import type { DeadlineDates } from '../storage/db';

export type DeadlineTone = 'ok' | 'soon' | 'urgent' | 'expired';

export interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  daysLeft: number;
  tone: DeadlineTone;
  explanation: string;
  action: string;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addYears(iso: string, years: number): string {
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function diffDays(targetIso: string, now: Date): number {
  const t = new Date(targetIso + 'T12:00:00');
  const n = new Date(now.toISOString().slice(0, 10) + 'T12:00:00');
  return Math.round((t.getTime() - n.getTime()) / 86_400_000);
}

function toneFor(daysLeft: number, urgentAt = 10, soonAt = 30): DeadlineTone {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= urgentAt) return 'urgent';
  if (daysLeft <= soonAt) return 'soon';
  return 'ok';
}

export function computeDeadlines(dates: DeadlineDates, now: Date = new Date()): DeadlineItem[] {
  const items: DeadlineItem[] = [];
  const t = GEORGIA_RULES.timings;

  if (dates.targetSubmitDate) {
    const daysLeft = diffDays(dates.targetSubmitDate, now);
    items.push({
      id: 'target-submit',
      title: 'Your target submission day',
      dueDate: dates.targetSubmitDate,
      daysLeft,
      tone: toneFor(daysLeft, 5, 14),
      explanation: 'Your personal goal date to send the complete packet to the Centralized Katie Beckett Team.',
      action: 'Mail to 2211 Beaver Ruin Rd, Suite 150, Norcross, GA 30071 or fax 678-248-7459.',
    });
  }

  if (dates.dma6aSignedDate) {
    const exp = addDays(dates.dma6aSignedDate, t.dma6aValidityDays);
    const daysLeft = diffDays(exp, now);
    items.push({
      id: 'dma6a-expiry',
      title: 'DMA-6A 90-day signature deadline',
      dueDate: exp,
      daysLeft,
      tone: toneFor(daysLeft, 14, 30),
      explanation: `Your doctor signed DMA-6A on ${dates.dma6aSignedDate}. Georgia only accepts DMA-6A signatures for 90 days.`,
      action:
        daysLeft < 0
          ? 'Ask your pediatrician for a freshly dated & signed DMA-6A before submitting.'
          : 'Make sure the Katie Beckett team receives your packet before this date.',
    });
  }

  if (dates.evalDate) {
    const exp = addYears(dates.evalDate, t.evaluationMaxAgeYears);
    const daysLeft = diffDays(exp, now);
    items.push({
      id: 'eval-expiry',
      title: 'Developmental / Psychological evaluation 3-year window',
      dueDate: exp,
      daysLeft,
      tone: toneFor(daysLeft, 30, 90),
      explanation: `Evaluation dated ${dates.evalDate}. Georgia asks for an evaluation within the past 3 years.`,
      action: 'Schedule a new evaluation well ahead of this date if your child’s LOC review will fall after it.',
    });
  }

  if (dates.submittedDate) {
    const checkIn = addDays(dates.submittedDate, 5);
    const daysLeft = diffDays(checkIn, now);
    items.push({
      id: 'confirm-receipt',
      title: 'Call to confirm your packet was received',
      dueDate: checkIn,
      daysLeft,
      tone: toneFor(daysLeft, 2, 7),
      explanation: `Packet sent on ${dates.submittedDate}. Calling confirms it was attached to your child’s file and not delayed.`,
      action: 'Call the Centralized Katie Beckett Team at 678-248-7449 and ask for a confirmation & portal invite email.',
    });
  }

  if (dates.rfiNoticeDate) {
    const due = addDays(dates.rfiNoticeDate, t.reconsiderationDays);
    const daysLeft = diffDays(due, now);
    items.push({
      id: 'rfi-30day',
      title: '30-day response / reconsideration deadline',
      dueDate: due,
      daysLeft,
      tone: toneFor(daysLeft, 7, 15),
      explanation: `Notice dated ${dates.rfiNoticeDate}. Georgia gives 30 calendar days from an initial LOC denial letter to submit additional clinical records or request a hearing.`,
      action: 'Send extra clinical documentation to Alliant Health Solutions (Fax: 678-527-3001) or request a hearing before day 30.',
    });
  }

  if (dates.approvalDate) {
    const annualCheck = addDays(addYears(dates.approvalDate, 1), -45);
    items.push({
      id: 'annual-eligibility',
      title: 'Watch for Annual Eligibility Review notice',
      dueDate: annualCheck,
      daysLeft: diffDays(annualCheck, now),
      tone: toneFor(diffDays(annualCheck, now), 14, 45),
      explanation: 'Even though medical Level of Care lasts 2 years, Georgia checks eligibility/resources every year.',
      action: 'Check your mail and the Katie Beckett Online Portal (katiebeckettportal.dch.georgia.gov) 45–60 days ahead.',
    });

    const locRenewal = addDays(addYears(dates.approvalDate, t.locAuthorizationYears), -60);
    items.push({
      id: 'loc-2year-renewal',
      title: 'Start 2-year Medical Level of Care renewal',
      dueDate: locRenewal,
      daysLeft: diffDays(locRenewal, now),
      tone: toneFor(diffDays(locRenewal, now), 14, 60),
      explanation: 'Medical Level of Care approvals last at least 2 years. Starting 60 days early gives your pediatrician plenty of time.',
      action: 'Update your profile here, print a fresh Doctor’s Packet, and upload through the Katie Beckett Online Portal.',
    });
  }

  return items.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}
