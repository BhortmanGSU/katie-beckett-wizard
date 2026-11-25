import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, rgb } from 'pdf-lib';
import * as mupdf from 'mupdf';

// Draw our Katie Beckett Helper icon (cardigan teal background, warm cream home, terracotta heart)
// at 512x512 (Electron + PWA) and 192x192 (PWA standard).
const doc = await PDFDocument.create();
const page = doc.addPage([128, 128]);
page.drawRectangle({ x: 0, y: 0, width: 128, height: 128, color: rgb(0.137, 0.392, 0.392) });
page.drawSvgPath('M 22 62 L 64 24 L 106 62 L 106 104 L 22 104 Z', {
  x: 0,
  y: 128,
  color: rgb(0.992, 0.973, 0.945),
});
page.drawSvgPath(
  'M 64 92 C 64 92 42 79 42 65 C 42 58 47.5 52.5 54 52.5 C 58.2 52.5 61.8 54.8 64 58 C 66.2 54.8 69.8 52.5 74 52.5 C 80.5 52.5 86 58 86 65 C 86 79 64 92 64 92 Z',
  { x: 0, y: 128, color: rgb(0.776, 0.408, 0.227) },
);

const pdfBytes = await doc.save();
const muDoc = mupdf.Document.openDocument(Buffer.from(pdfBytes), 'application/pdf');

const pix512 = muDoc.loadPage(0).toPixmap(mupdf.Matrix.scale(4, 4), mupdf.ColorSpace.DeviceRGB, false, true);
const pix192 = muDoc.loadPage(0).toPixmap(mupdf.Matrix.scale(1.5, 1.5), mupdf.ColorSpace.DeviceRGB, false, true);

fs.mkdirSync(path.resolve('build'), { recursive: true });
fs.mkdirSync(path.resolve('public'), { recursive: true });
fs.writeFileSync(path.resolve('build/icon.png'), pix512.asPNG());
fs.writeFileSync(path.resolve('public/icon-512.png'), pix512.asPNG());
fs.writeFileSync(path.resolve('public/icon-192.png'), pix192.asPNG());
console.log('Wrote build/icon.png (512), public/icon-512.png (512), public/icon-192.png (192)');
