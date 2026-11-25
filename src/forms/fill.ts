import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { FieldSpec, FillContext, FormMap } from './types';

const INK = rgb(0.05, 0.1, 0.35); // a calm "pen blue" so filled-in answers are easy to spot

/** Replace characters the standard PDF fonts cannot encode. */
export function sanitize(s: string): string {
  return (s ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\r?\n/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

export function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(page: PDFPage, font: PDFFont, f: Extract<FieldSpec, { kind: 'text' }>, raw: string) {
  const text = sanitize(raw).trim();
  if (!text) return;
  let size = f.size ?? 9;
  const maxLines = f.maxLines ?? 1;
  if (maxLines <= 1) {
    if (f.maxWidth) {
      while (size > 5 && font.widthOfTextAtSize(text, size) > f.maxWidth) size -= 0.25;
    }
    let out = text;
    if (f.maxWidth && font.widthOfTextAtSize(out, size) > f.maxWidth) {
      while (out.length > 1 && font.widthOfTextAtSize(out + '...', size) > f.maxWidth) out = out.slice(0, -1);
      out += '...';
    }
    page.drawText(out, { x: f.x, y: f.y, size, font, color: INK });
    return;
  }
  const width = f.maxWidth ?? 400;
  let lines = wrap(text, font, size, width);
  while (lines.length > maxLines && size > 6) {
    size -= 0.25;
    lines = wrap(text, font, size, width);
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length > 1 && font.widthOfTextAtSize(last + '... (see attached)', size) > width) last = last.slice(0, -1);
    lines[maxLines - 1] = last + '... (see attached)';
  }
  const lh = f.lineHeight ?? size * 1.25;
  lines.forEach((ln, i) => page.drawText(ln, { x: f.x, y: f.y - i * lh, size, font, color: INK }));
}

function drawCheck(page: PDFPage, font: PDFFont, f: Extract<FieldSpec, { kind: 'check' }>) {
  const size = f.size ?? 8;
  const w = font.widthOfTextAtSize('X', size);
  page.drawText('X', { x: f.x - w / 2, y: f.y - size * 0.35, size, font, color: INK });
}

/** Fill a flat (non-fillable) official PDF by drawing answers on top of it. */
export async function fillForm(template: Uint8Array | ArrayBuffer, map: FormMap, ctx: FillContext): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const sig = ctx.parentSignature ? await doc.embedPng(ctx.parentSignature.png) : null;

  for (const f of map.fields) {
    const page = pages[f.page];
    if (!page) continue;
    if ('section' in f && f.section === 'doctor' && !ctx.draftDoctorSections) continue;
    try {
      if (f.kind === 'text') drawText(page, font, f, f.value(ctx));
      else if (f.kind === 'check') {
        if (f.when(ctx)) drawCheck(page, bold, f);
      } else if (f.kind === 'signature' && sig) {
        const scale = Math.min(f.width / sig.width, f.height / sig.height);
        const w = sig.width * scale;
        const h = sig.height * scale;
        page.drawImage(sig, { x: f.x, y: f.y, width: w, height: h });
      }
    } catch (e) {
      console.warn(`Could not fill "${f.label}" on ${map.formId}`, e);
    }
  }
  doc.setProducer('Katie Beckett Helper');
  return doc.save();
}
