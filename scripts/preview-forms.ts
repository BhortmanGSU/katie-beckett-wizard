import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as mupdf from 'mupdf';
import { fillForm } from '../src/forms/fill';
import { FORM_MAPS } from '../src/forms/maps';
import { sampleProfile } from '../src/fixtures/sampleProfile';

/** Tiny PNG generator so preview scripts don't need canvas. Draws a dark blue cursive-ish squiggle. */
function makeSampleSignaturePng(): Uint8Array {
  const w = 180;
  const h = 44;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  const put = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = Math.round(x + dx);
        const py = Math.round(y + dy);
        if (px < 0 || px >= w || py < 0 || py >= h) continue;
        const idx = py * (w * 4 + 1) + 1 + px * 4;
        raw[idx] = 18;
        raw[idx + 1] = 44;
        raw[idx + 2] = 115;
        raw[idx + 3] = 255;
      }
    }
  };
  for (let t = 0; t < 300; t++) {
    const x = 10 + (t / 300) * 160;
    const y = 24 + Math.sin(t * 0.14) * 10 - Math.cos(t * 0.05) * 4;
    put(x, y);
  }
  const crcTable = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const t = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return new Uint8Array(
    Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]),
  );
}

const outDir = path.resolve('out/preview');
fs.mkdirSync(outDir, { recursive: true });
const sigPng = makeSampleSignaturePng();
const profile = sampleProfile();

for (const [formId, map] of Object.entries(FORM_MAPS)) {
  const tpl = fs.readFileSync(path.resolve(`public/forms/ga/${formId}.pdf`));
  const filled = await fillForm(tpl, map, {
    profile,
    signDate: '11/25/2026',
    parentSignature: { png: sigPng, width: 180, height: 44 },
    draftDoctorSections: true,
  });
  fs.writeFileSync(path.join(outDir, `${formId}.pdf`), filled);

  const doc = mupdf.Document.openDocument(Buffer.from(filled), 'application/pdf');
  const count = doc.countPages();
  for (let i = 0; i < count; i++) {
    // Skip page 6 of Form 94 (ADA notice) and page 2 of DMA-706 (instructions)
    if (formId === 'form-94' && i === 5) continue;
    if (formId === 'dma-706' && i === 1) continue;
    const page = doc.loadPage(i);
    const pix = page.toPixmap(mupdf.Matrix.scale(1.5, 1.5), mupdf.ColorSpace.DeviceRGB, false, true);
    fs.writeFileSync(path.join(outDir, `${formId}-p${i + 1}.png`), pix.asPNG());
  }
  console.log(`${formId}: ${map.fields.length} fields -> rendered ${count} pages`);
}
