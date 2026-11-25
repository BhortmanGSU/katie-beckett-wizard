import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { fullName, formatAddress, usDate, type Profile } from '../profile';
import { GEORGIA_RULES } from '../rules/ga';
import { fillForm, sanitize, wrap } from './fill';
import { FORM_MAPS } from './maps';
import type { SignatureImage } from './types';

const TEAL = rgb(0.17, 0.42, 0.42);
const CHARCOAL = rgb(0.16, 0.18, 0.2);
const MUTED = rgb(0.42, 0.44, 0.47);
const BORDER = rgb(0.84, 0.82, 0.78);

export async function loadTemplate(templatePath: string): Promise<ArrayBuffer> {
  const res = await fetch(`./${templatePath.replace(/^\/+/, '')}`);
  if (!res.ok) throw new Error(`Could not load form template (${templatePath})`);
  return res.arrayBuffer();
}

export async function buildFilledForm(
  formId: string,
  profile: Profile,
  options: { signDate: string; parentSignature: SignatureImage | null; draftDoctorSections: boolean },
): Promise<Uint8Array> {
  const entry = GEORGIA_RULES.forms.find((f) => f.id === formId);
  const map = FORM_MAPS[formId];
  if (!entry?.templatePath || !map) throw new Error(`Unknown form: ${formId}`);
  const tpl = await loadTemplate(entry.templatePath);
  return fillForm(tpl, map, { profile, ...options });
}

/** Generate a clean, respectful cover letter to the child's pediatrician. */
export async function buildDoctorCoverLetter(profile: Profile, todayStr: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 735;
  const left = 54;
  const maxW = 504;

  page.drawText('Georgia TEFRA / Katie Beckett Medicaid — Physician Packet', {
    x: left,
    y,
    size: 15,
    font: bold,
    color: TEAL,
  });
  y -= 18;
  page.drawText(`Prepared ${todayStr}`, { x: left, y, size: 9.5, font, color: MUTED });
  y -= 10;
  page.drawLine({ start: { x: left, y }, end: { x: 558, y }, thickness: 1, color: BORDER });
  y -= 24;

  const drawPara = (text: string, opts?: { bold?: boolean; size?: number; gap?: number }) => {
    const f = opts?.bold ? bold : font;
    const sz = opts?.size ?? 10.5;
    for (const line of wrap(sanitize(text), f, sz, maxW)) {
      page.drawText(line, { x: left, y, size: sz, font: f, color: CHARCOAL });
      y -= sz * 1.4;
    }
    y -= opts?.gap ?? 8;
  };

  drawPara(`Dear ${profile.physician.name || "Doctor's Office"},`, { bold: true });
  drawPara(
    `Thank you so much for caring for ${fullName(profile.child) || 'our child'} (DOB: ${usDate(profile.child.dob) || '___________'}). We are applying for Georgia's TEFRA / Katie Beckett Medicaid program, which helps children with complex medical or developmental needs receive care safely at home.`,
  );
  drawPara(
    'To save your team time, we have pre-filled the basic details on the attached official Georgia Medicaid forms as a draft for your review. Please feel free to adjust anything in the physician sections before signing.',
  );

  y -= 4;
  drawPara('Included in this packet:', { bold: true, gap: 4 });
  const items = [
    '1. Pediatric DMA-6(A) — Section A is completed and signed by us. Please review and complete Sections B & C, and sign Items 25 and 43.',
    '2. Medical Necessity / Level of Care Statement (DMA-706) — Please review the summary and sign on the Physician’s Signature line.',
    '3. Cost-Effectiveness Form (DMA-704) — Please review/update the estimated monthly in-home Medicaid costs and sign.',
  ];
  for (const item of items) {
    drawPara(item, { size: 10, gap: 5 });
  }

  y -= 4;
  // Highlighted box with the 2 things that most commonly cause rejections
  const boxTop = y + 6;
  const boxH = 104;
  page.drawRectangle({
    x: left,
    y: boxTop - boxH,
    width: maxW,
    height: boxH,
    color: rgb(0.98, 0.96, 0.92),
    borderColor: TEAL,
    borderWidth: 1,
  });
  y = boxTop - 18;
  page.drawText('Two Georgia Medicaid rules that prevent automatic rejections:', {
    x: left + 12,
    y,
    size: 10,
    font: bold,
    color: TEAL,
  });
  y -= 16;
  for (const tip of [
    '- Original signatures only: Alliant Health Solutions rejects signature stamps on DMA-6A (Items 25 and 43).',
    '- Every item on DMA-6A must be answered (writing "N/A" is fine; blank boxes can trigger a technical denial).',
    '- 90-day clock: The DMA-6A is only valid for 90 days from the date you sign it. Please date it the day you sign.',
  ]) {
    for (const ln of wrap(sanitize(tip), font, 9.5, maxW - 24)) {
      page.drawText(ln, { x: left + 12, y, size: 9.5, font, color: CHARCOAL });
      y -= 13;
    }
  }
  y = boxTop - boxH - 22;

  drawPara('How to return the signed forms to us:', { bold: true, gap: 4 });
  drawPara(
    `Parent / Guardian: ${fullName(profile.applicant) || '___________'}   |   Phone: ${profile.applicant.phone || '___________'}   |   Email: ${profile.applicant.email || '___________'}`,
    { size: 10 },
  );
  drawPara('We are happy to pick up the signed originals in person or receive them through your patient portal. Thank you again for your partnership and support!');

  doc.setTitle('Doctor Packet Cover Letter — Georgia Katie Beckett');
  return doc.save();
}

/** Generate a clean "Day in the Life" parent letter PDF. */
export async function buildDayInTheLifePdf(profile: Profile, todayStr: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([612, 792]);
  const left = 58;
  const maxW = 496;
  let y = 730;

  page.drawText(`A Day in the Life of ${fullName(profile.child) || 'Our Child'}`, {
    x: left,
    y,
    size: 15,
    font: bold,
    color: TEAL,
  });
  y -= 18;
  page.drawText(
    sanitize(
      `Parent Supporting Statement for Georgia TEFRA / Katie Beckett Application  |  DOB: ${usDate(profile.child.dob) || '—'}  |  ${todayStr}`,
    ),
    { x: left, y, size: 9, font, color: MUTED },
  );
  y -= 10;
  page.drawLine({ start: { x: left, y }, end: { x: 554, y }, thickness: 1, color: BORDER });
  y -= 24;

  const paragraphs = (profile.health.dayInTheLife || '').split(/\n+/).map((p) => p.trim()).filter(Boolean);
  for (const para of paragraphs) {
    for (const line of wrap(sanitize(para), font, 10.5, maxW)) {
      if (y < 72) {
        page = doc.addPage([612, 792]);
        y = 735;
      }
      page.drawText(line, { x: left, y, size: 10.5, font, color: CHARCOAL });
      y -= 15.5;
    }
    y -= 9;
  }

  if (y < 95) {
    page = doc.addPage([612, 792]);
    y = 735;
  }
  y -= 10;
  page.drawText('Sincerely,', { x: left, y, size: 10.5, font, color: CHARCOAL });
  y -= 20;
  page.drawText(sanitize(fullName(profile.applicant) || 'Parent / Guardian'), {
    x: left,
    y,
    size: 11,
    font: bold,
    color: CHARCOAL,
  });
  y -= 15;
  page.drawText(
    sanitize([profile.applicant.phone, profile.applicant.email].filter(Boolean).join('  •  ')),
    { x: left, y, size: 9.5, font, color: MUTED },
  );

  doc.setTitle('Day in the Life Statement');
  return doc.save();
}

/** Merge several PDFs (and optionally images) into one clean PDF document. */
export async function mergePdfsAndImages(
  items: { name: string; bytes: Uint8Array; mime: string }[],
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const item of items) {
    if (item.mime === 'application/pdf') {
      const src = await PDFDocument.load(item.bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    } else if (item.mime === 'image/png' || item.mime === 'image/jpeg') {
      const img = item.mime === 'image/png' ? await merged.embedPng(item.bytes) : await merged.embedJpg(item.bytes);
      const page = merged.addPage([612, 792]);
      const margin = 36;
      const scale = Math.min((612 - margin * 2) / img.width, (792 - margin * 2) / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, { x: (612 - w) / 2, y: (792 - h) / 2, width: w, height: h });
    }
  }
  return merged.save();
}

/** Build the Doctor's Ready-to-Sign Packet (cover letter + DMA-6A + DMA-706 + DMA-704). */
export async function buildDoctorPacket(
  profile: Profile,
  options: { signDate: string; parentSignature: SignatureImage | null; draftDoctorSections: boolean; approvedForms: Record<string, boolean> },
): Promise<Uint8Array> {
  const cover = await buildDoctorCoverLetter(profile, options.signDate);
  const parts: { name: string; bytes: Uint8Array; mime: string }[] = [
    { name: 'Cover Letter', bytes: cover, mime: 'application/pdf' },
  ];
  for (const id of ['dma-6a', 'dma-706', 'dma-704']) {
    const bytes = await buildFilledForm(id, profile, {
      signDate: options.signDate,
      parentSignature: options.approvedForms[id] ? options.parentSignature : null,
      draftDoctorSections: options.draftDoctorSections,
    });
    parts.push({ name: id, bytes, mime: 'application/pdf' });
  }
  return mergePdfsAndImages(parts);
}

/** Build a clean submission cover sheet listing every document in the packet. */
export async function buildSubmissionCoverSheet(
  profile: Profile,
  includedLabels: string[],
  todayStr: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const left = 54;
  let y = 735;

  page.drawText('Georgia TEFRA / Katie Beckett Medicaid Application Packet', {
    x: left,
    y,
    size: 15,
    font: bold,
    color: TEAL,
  });
  y -= 20;
  page.drawText(`Prepared ${todayStr}`, { x: left, y, size: 9.5, font, color: MUTED });
  y -= 10;
  page.drawLine({ start: { x: left, y }, end: { x: 558, y }, thickness: 1, color: BORDER });
  y -= 24;

  const lines = [
    ['Applicant (Child):', `${fullName(profile.child) || '—'}   (DOB: ${usDate(profile.child.dob) || '—'})`],
    ['Parent / Guardian:', `${fullName(profile.applicant) || '—'}   |   ${profile.applicant.phone || '—'}`],
    ['Address:', `${formatAddress(profile.mailingAddress) || '—'}   (${profile.county ? `${profile.county} County` : 'GA'})`],
    ['Submit To:', `${GEORGIA_RULES.submission.teamName}, ${GEORGIA_RULES.submission.addressLines.join(', ')}`],
    ['Fax / Phone:', `Fax: ${GEORGIA_RULES.submission.fax}   |   Phone: ${GEORGIA_RULES.submission.phone}`],
  ];
  for (const [k, v] of lines) {
    page.drawText(k, { x: left, y, size: 10, font: bold, color: CHARCOAL });
    page.drawText(sanitize(v), { x: left + 112, y, size: 10, font, color: CHARCOAL });
    y -= 18;
  }

  y -= 12;
  page.drawText('Documents Included in This Packet:', { x: left, y, size: 11, font: bold, color: TEAL });
  y -= 18;
  for (const item of includedLabels) {
    page.drawText(`[X]  ${sanitize(item)}`, { x: left + 8, y, size: 10, font, color: CHARCOAL });
    y -= 16;
  }

  y -= 18;
  page.drawText(
    'Note: Please confirm receipt by calling the Centralized Katie Beckett Team at 678-248-7449 a few days after mailing or faxing.',
    { x: left, y, size: 9, font, color: MUTED },
  );
  return doc.save();
}
