import * as pdfjs from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Point pdfjs to the bundled worker so everything runs 100% offline.
pdfjs.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.mjs';

async function extractPdfText(bytes: Uint8Array, onProgress?: (msg: string) => void): Promise<string> {
  onProgress?.('Reading PDF text...');
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  let text = '';
  const maxPages = Math.min(pdf.numPages, 6);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    text += tc.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
  }
  if (text.replace(/\s+/g, '').length >= 40) return text;

  // Scanned PDF (no text layer): render first 2 pages to canvas and run local OCR
  onProgress?.('Scanned PDF detected — reading text on your device...');
  let ocrText = '';
  const scanPages = Math.min(pdf.numPages, 2);
  for (let i = 1; i <= scanPages; i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (blob) ocrText += (await runImageOcr(blob, onProgress)) + '\n';
  }
  return ocrText || text;
}

async function runImageOcr(image: Blob | Uint8Array, onProgress?: (msg: string) => void): Promise<string> {
  onProgress?.('Reading words from photo (stays 100% on your device)...');
  const base = new URL('./vendor/', window.location.href).href;
  const worker = await createWorker('eng', 1, {
    workerPath: `${base}worker.min.js`,
    corePath: base,
    langPath: `${base}tessdata`,
    gzip: true,
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(`Reading photo... ${Math.round(m.progress * 100)}%`);
      }
    },
  });
  try {
    const input = image instanceof Uint8Array ? new Blob([image as BlobPart]) : image;
    const { data } = await worker.recognize(input);
    return data.text ?? '';
  } finally {
    await worker.terminate();
  }
}

export async function extractDocumentText(
  bytes: Uint8Array,
  mimeType: string,
  onProgress?: (msg: string) => void,
): Promise<string> {
  try {
    if (mimeType === 'application/pdf') return await extractPdfText(bytes, onProgress);
    if (mimeType.startsWith('image/')) return await runImageOcr(bytes, onProgress);
    return '';
  } catch (e) {
    console.warn('Text extraction skipped:', e);
    return '';
  }
}
