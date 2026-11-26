import { fullName } from '../../profile';
import type { FormMap } from '../types';

function parseMoney(s: string): number {
  const n = Number(String(s ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(s: string): string {
  const n = parseMoney(s);
  if (!s.trim() && n === 0) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const dma704Map: FormMap = {
  formId: 'dma-704',
  fields: [
    {
      kind: 'text',
      label: 'Patient Name',
      page: 0,
      x: 146,
      y: 613,
      size: 10,
      maxWidth: 140,
      value: ({ profile }) => fullName(profile.child),
    },
    {
      kind: 'text',
      label: 'Medicaid #',
      page: 0,
      x: 348,
      y: 613,
      size: 10,
      maxWidth: 170,
      value: ({ profile }) => profile.child.medicaidNumber,
    },
    {
      kind: 'text',
      label: 'Diagnosis',
      page: 0,
      x: 120,
      y: 585,
      size: 9.5,
      maxWidth: 425,
      value: ({ profile }) =>
        profile.health.diagnoses.map((d) => (d.icd ? `${d.name} (${d.icd})` : d.name)).join('; '),
    },
    {
      kind: 'text',
      label: 'Prognosis',
      page: 0,
      x: 120,
      y: 557,
      size: 9.5,
      maxWidth: 425,
      section: 'doctor',
      value: ({ profile }) => profile.health.prognosis,
    },
    {
      kind: 'text',
      label: 'Physician services cost',
      page: 0,
      x: 300,
      y: 485,
      size: 10,
      maxWidth: 140,
      section: 'doctor',
      value: ({ profile }) => fmtMoney(profile.costs.physician),
    },
    {
      kind: 'text',
      label: 'DME cost',
      page: 0,
      x: 300,
      y: 469,
      size: 10,
      maxWidth: 140,
      section: 'doctor',
      value: ({ profile }) => fmtMoney(profile.costs.dme),
    },
    {
      kind: 'text',
      label: 'Drugs cost',
      page: 0,
      x: 300,
      y: 452,
      size: 10,
      maxWidth: 140,
      section: 'doctor',
      value: ({ profile }) => fmtMoney(profile.costs.drugs),
    },
    {
      kind: 'text',
      label: 'Therapy cost',
      page: 0,
      x: 300,
      y: 435,
      size: 10,
      maxWidth: 140,
      section: 'doctor',
      value: ({ profile }) => fmtMoney(profile.costs.therapy),
    },
    {
      kind: 'text',
      label: 'Skilled nursing cost',
      page: 0,
      x: 300,
      y: 419,
      size: 10,
      maxWidth: 140,
      section: 'doctor',
      value: ({ profile }) => fmtMoney(profile.costs.nursing),
    },
    {
      kind: 'text',
      label: 'Other cost label',
      page: 0,
      x: 133,
      y: 403,
      size: 8.5,
      maxWidth: 92,
      section: 'doctor',
      value: ({ profile }) => profile.costs.otherLabel,
    },
    {
      kind: 'text',
      label: 'Other cost',
      page: 0,
      x: 300,
      y: 402,
      size: 10,
      maxWidth: 140,
      section: 'doctor',
      value: ({ profile }) => fmtMoney(profile.costs.other),
    },
    {
      kind: 'text',
      label: 'Total monthly cost',
      page: 0,
      x: 300,
      y: 375,
      size: 10,
      maxWidth: 140,
      section: 'doctor',
      value: ({ profile }) => {
        const c = profile.costs;
        const sum =
          parseMoney(c.physician) +
          parseMoney(c.dme) +
          parseMoney(c.drugs) +
          parseMoney(c.therapy) +
          parseMoney(c.nursing) +
          parseMoney(c.other);
        return sum > 0 ? sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
      },
    },
    {
      kind: 'check',
      label: 'Home care as good or better: Yes',
      page: 0,
      x: 378,
      y: 336,
      size: 9,
      section: 'doctor',
      when: ({ profile }) => profile.health.wouldNeedInstitution === 'yes',
    },
    {
      kind: 'text',
      label: 'Comments',
      page: 0,
      x: 68,
      y: 290,
      size: 9,
      maxWidth: 475,
      maxLines: 5,
      lineHeight: 13,
      section: 'doctor',
      value: ({ profile }) =>
        profile.health.otherHealthServices
          ? `Home services requested: ${profile.health.otherHealthServices}. ${profile.health.rehabServices ? `Therapies: ${profile.health.rehabServices}.` : ''}`
          : '',
    },
  ],
};
