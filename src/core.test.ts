import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { checkDocumentFreshness } from './docs/freshness';
import { computeDeadlines } from './deadlines/engine';
import { buildIcsCalendar } from './deadlines/ics';
import { fillForm } from './forms/fill';
import { FORM_MAPS } from './forms/maps';
import { sampleProfile } from './fixtures/sampleProfile';
import { GEORGIA_RULES } from './rules/ga';
import { decryptBackup, encryptBackup } from './storage/crypto';

describe('Document freshness & form version checks', () => {
  const dma6aSlot = GEORGIA_RULES.documentSlots.find((s) => s.id === 'dma-6a');
  const evalSlot = GEORGIA_RULES.documentSlots.find((s) => s.id === 'psych-eval');

  it('flags an expired DMA-6A older than 90 days', () => {
    const now = new Date('2026-11-25T12:00:00Z');
    const report = checkDocumentFreshness(
      'PEDIATRIC DMA 6(A) DMA-6A (1/2018) Physician signature date 07/01/2026',
      dma6aSlot,
      undefined,
      now,
    );
    expect(report.status).toBe('expired');
    expect(report.detectedFormCode).toBe('DMA-6A');
    expect(report.daysOld).toBeGreaterThan(90);
  });

  it('marks a recent DMA-6A current and extracts NPI & ICD suggestions', () => {
    const now = new Date('2026-11-25T12:00:00Z');
    const report = checkDocumentFreshness(
      'DMA-6A (1/2018) Physician Recommendation NPI: 1234567890 Diagnosis G80.0 Signed 11/10/2026',
      dma6aSlot,
      undefined,
      now,
    );
    expect(report.status).toBe('current');
    expect(report.suggestions.some((s) => s.key === 'physician.npi' && s.value === '1234567890')).toBe(true);
    expect(report.suggestions.some((s) => s.key === 'diagnosis.icd' && s.value === 'G80.0')).toBe(true);
  });

  it('flags an outdated/superseded form version', () => {
    const report = checkDocumentFreshness("Physician's Referral Form TEFRA/Katie Beckett", undefined);
    expect(report.status).toBe('outdated-form');
  });

  it('flags a psychological evaluation older than 3 years', () => {
    const now = new Date('2026-11-25T12:00:00Z');
    const report = checkDocumentFreshness('Comprehensive Psychological Evaluation', evalSlot, '2022-05-01', now);
    expect(report.status).toBe('expired');
  });
});

describe('Deadlines & ICS calendar export', () => {
  it('computes 90-day DMA-6A deadline, 30-day RFI, and 1-yr / 2-yr renewals', () => {
    const now = new Date('2026-11-25T12:00:00Z');
    const items = computeDeadlines(
      {
        targetSubmitDate: '2026-12-10',
        dma6aSignedDate: '2026-11-01',
        evalDate: '2025-02-01',
        submittedDate: '',
        rfiNoticeDate: '2026-11-20',
        approvalDate: '2026-11-25',
      },
      now,
    );
    expect(items.find((x) => x.id === 'dma6a-expiry')?.dueDate).toBe('2027-01-30');
    expect(items.find((x) => x.id === 'rfi-30day')?.dueDate).toBe('2026-12-20');
    expect(items.some((x) => x.id === 'annual-eligibility')).toBe(true);
    expect(items.some((x) => x.id === 'loc-2year-renewal')).toBe(true);

    const ics = buildIcsCalendar(items, 'Lily Thompson');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DMA-6A 90-day signature deadline');
  });
});

describe('Encrypted backup round-trip', () => {
  it('encrypts and decrypts with the right passphrase, and rejects wrong passphrases', async () => {
    const payload = { child: 'Lily', county: 'Cobb' };
    const enc = await encryptBackup(payload, 'kind-neighbor-2026');
    expect(enc).not.toContain('Lily');
    const dec = await decryptBackup<typeof payload>(enc, 'kind-neighbor-2026');
    expect(dec).toEqual(payload);
    await expect(decryptBackup(enc, 'wrong-pass')).rejects.toThrow(/passphrase/i);
  });
});

describe('Official Georgia PDF form filling', () => {
  it('fills all 4 official Georgia PDFs without error and preserves page counts', async () => {
    const profile = sampleProfile();
    for (const [id, map] of Object.entries(FORM_MAPS)) {
      const tpl = fs.readFileSync(path.resolve(`public/forms/ga/${id}.pdf`));
      const orig = await PDFDocument.load(tpl, { ignoreEncryption: true });
      const filled = await fillForm(tpl, map, {
        profile,
        signDate: '11/25/2026',
        parentSignature: null,
        draftDoctorSections: true,
      });
      const out = await PDFDocument.load(filled);
      expect(out.getPageCount()).toBe(orig.getPageCount());
    }
  });
});

describe('Built-in local web server & phone sync API', () => {
  it('enforces the 4-digit Family PIN and syncs state + documents', async () => {
    const req = createRequire(import.meta.url);
    const { startLocalServer } = req('../electron/server.cjs');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-server-test-'));
    const srv = await startLocalServer({
      distDir: path.resolve('dist'),
      dataDir: tmp,
      preferredPort: 0,
    });
    const base = `http://127.0.0.1:${srv.port}`;
    try {
      // Without PIN -> 401
      const noPin = await fetch(`${base}/api/state`);
      expect(noPin.status).toBe(401);

      // With PIN -> save & reload state
      const headers = { 'X-KB-Pin': srv.pin, 'Content-Type': 'application/json' };
      const putRes = await fetch(`${base}/api/state`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ profile: { child: { firstName: 'Lily' } } }),
      });
      expect(putRes.ok).toBe(true);

      const getRes = await fetch(`${base}/api/state`, { headers });
      const data = await getRes.json();
      expect(data.state.profile.child.firstName).toBe('Lily');

      // Upload & list document
      const postDoc = await fetch(`${base}/api/docs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: 'doc1',
          slotId: 'child-id',
          fileName: 'birth.png',
          mimeType: 'image/png',
          bytesB64: Buffer.from('hello').toString('base64'),
        }),
      });
      expect(postDoc.ok).toBe(true);

      const listRes = await fetch(`${base}/api/docs`, { headers });
      const listed = await listRes.json();
      expect(listed.docs).toHaveLength(1);
      expect(listed.docs[0].fileName).toBe('birth.png');
    } finally {
      srv.close();
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
