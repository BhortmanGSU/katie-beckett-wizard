# Katie Beckett Helper (Georgia)

**Try it free right now (no download needed):** [https://bhortmangsu.github.io/katie-beckett-wizard/](https://bhortmangsu.github.io/katie-beckett-wizard/)

A free, private, offline-first wizard for families applying for **Georgia TEFRA / Katie Beckett Medicaid** — built with calm, Mister-Rogers energy so parents of medically complex kids don't have to retype the same information across four different state forms.

> **100% private & offline:** Everything you type, sign, or upload stays strictly on your own device. There are no accounts, no servers, no analytics, and no tracking.

---

## What it does

- **"Tell us once" family profile** — Answer a gentle interview once; the app fills Georgia's official **Form 94**, **Pediatric DMA-6(A)**, **Medical Necessity / Level of Care Statement (DMA-706)**, and **Cost-Effectiveness Form (DMA-704)**.
- **Sign once, approve each form** — Draw or type your parent/guardian signature once, review each filled PDF right inside the app, and tap **Approve & place my signature** on each parent-signed form.
- **Ready-to-sign Doctor's Packet** — Generates a polite cover letter to your child's pediatrician (highlighting Georgia's **90-day signature clock** and **original-signature / no-stamp** rule) bundled with your pre-filled DMA-6A, DMA-706, and DMA-704.
- **Uploads + local freshness & version checks** — Upload PDFs or phone photos for every document slot. Text recognition runs 100% on your device to:
  - Catch outdated/superseded Georgia form versions (such as the old *Physician's Referral Form* or old Norcross P.O. Box 172).
  - Warn when a DMA-6A is approaching or past **90 days**, or when a psychological/developmental evaluation is past **3 years**.
  - Suggest profile fields spotted on uploaded pages (NPI, phone/fax, ICD-10 diagnosis codes).
- **Deadlines & calendar reminders** — Tracks the 90-day DMA-6A clock, 3-year evaluation window, 5-day post-submission check-in, 30-day reconsideration window, annual eligibility check, and 2-year medical Level of Care renewal. Exports a standard `.ics` calendar file.
- **Encrypted Phone ↔ PC Sync via your own Cloud Drive** — Save an AES-256 encrypted `.kbbackup` file into your own Google Drive, iCloud Drive, or OneDrive and open it on your other device with your passphrase.
- **One-click Complete Application Packet** — Merges a submission cover sheet, filled official forms (or your uploaded doctor-signed scans), your "Day in the Life" letter, and all supporting PDFs/photos into one clean PDF.

---

## For families: using it on phone or computer

1. **Zero-install Offline Web App / PWA (recommended):** Open [https://bhortmangsu.github.io/katie-beckett-wizard/](https://bhortmangsu.github.io/katie-beckett-wizard/) on your iPhone, Android, Chromebook, Mac, or Windows PC and tap **Install App** (or **Share → Add to Home Screen** on iPhone). Once opened once, it works **100% offline** — even in a doctor's office or hospital waiting room.
2. **Optional Windows Desktop App:** Build a standalone `.exe` installer locally with `npm run dist` (zero open network ports; runs fully offline).

---

## For developers & advocates

### Run locally
```bash
npm install
npm run dev      # open in browser at http://localhost:5173
npm run app      # run as desktop app (Electron)
npm test         # run unit tests
npm run dist     # build Windows installer in release/
```

### Keeping Georgia rules up to date (or adding another state)
All state-specific rules, addresses, form revisions, and timing windows live in one plain data file:
- `src/rules/ga.ts`

Official Georgia PDFs bundled in `public/forms/ga/` are verified against [medicaid.georgia.gov/programs/all-programs/tefrakatie-beckett](https://medicaid.georgia.gov/programs/all-programs/tefrakatie-beckett). Pull requests to keep dates, form revisions, or addresses current — or to add a new state rule pack — are warmly welcome!

---

## Friendly legal note

This open-source project is free guidance to help families organize paperwork and save time. It is **not** legal or medical advice. Always review every form carefully before signing and submitting to Georgia Medicaid.

## License

MIT — free forever for families and advocates.
