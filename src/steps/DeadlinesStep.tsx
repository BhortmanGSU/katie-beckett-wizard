import { fullName, type Profile } from '../profile';
import { computeDeadlines, type DeadlineTone } from '../deadlines/engine';
import { buildIcsCalendar } from '../deadlines/ics';
import type { DeadlineDates } from '../storage/db';
import { downloadText } from '../utils/download';

interface Props {
  profile: Profile;
  deadlines: DeadlineDates;
  onChange: (d: DeadlineDates) => void;
  onBack: () => void;
  onNext: () => void;
}

const TONE_BADGE: Record<DeadlineTone, { cls: string; label: (days: number) => string }> = {
  ok: { cls: 'badge-ok', label: (d) => `${d} days left` },
  soon: { cls: 'badge-warn', label: (d) => `${d} days left` },
  urgent: { cls: 'badge-danger', label: (d) => (d === 0 ? 'Due today!' : `Only ${d} days left`) },
  expired: { cls: 'badge-danger', label: (d) => `${Math.abs(d)} days past due` },
};

export function DeadlinesStep({ profile, deadlines, onChange, onBack, onNext }: Props) {
  const set = (patch: Partial<DeadlineDates>) => onChange({ ...deadlines, ...patch });
  const items = computeDeadlines(deadlines);

  const exportCalendar = () => {
    const ics = buildIcsCalendar(items, fullName(profile.child));
    downloadText(ics, 'katie-beckett-reminders.ics', 'text/calendar;charset=utf-8');
  };

  return (
    <div>
      <div className="page-header">
        <div className="warm-note">Timing is half the battle — let’s put every clock in one calm place.</div>
        <h1>Deadlines &amp; Reminders</h1>
        <p>
          Fill in any dates you know right now. We’ll automatically calculate Georgia’s 90-day DMA-6A clock, 3-year
          evaluation window, 30-day response window, and yearly / 2-year renewals — and export them to your calendar.
        </p>
      </div>

      <div className="card">
        <h2>Your key dates</h2>
        <div className="grid-2">
          <div className="field">
            <label>Target date to submit packet</label>
            <input type="date" value={deadlines.targetSubmitDate} onChange={(e) => set({ targetSubmitDate: e.target.value })} />
            <small>Pick a gentle, realistic goal date.</small>
          </div>
          <div className="field">
            <label>Date doctor signed DMA-6A</label>
            <input type="date" value={deadlines.dma6aSignedDate} onChange={(e) => set({ dma6aSignedDate: e.target.value })} />
            <small>Starts Georgia’s strict 90-day validity clock.</small>
          </div>
          <div className="field">
            <label>Date of most recent Psych / Developmental Eval</label>
            <input type="date" value={deadlines.evalDate} onChange={(e) => set({ evalDate: e.target.value })} />
            <small>Must be within 3 years for ICF/ID &amp; developmental cases.</small>
          </div>
          <div className="field">
            <label>Date you mailed / faxed / uploaded packet</label>
            <input type="date" value={deadlines.submittedDate} onChange={(e) => set({ submittedDate: e.target.value })} />
            <small>Adds a reminder to call 678-248-7449 five days later to verify receipt.</small>
          </div>
          <div className="field">
            <label>Date on any denial / request letter (if received)</label>
            <input type="date" value={deadlines.rfiNoticeDate} onChange={(e) => set({ rfiNoticeDate: e.target.value })} />
            <small>Starts the 30-day reconsideration / hearing window.</small>
          </div>
          <div className="field">
            <label>Approval date (once approved!)</label>
            <input type="date" value={deadlines.approvalDate} onChange={(e) => set({ approvalDate: e.target.value })} />
            <small>Schedules your Annual Eligibility check and 2-Year Medical LOC renewal.</small>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
          <h2 style={{ margin: 0 }}>Your Georgia timeline</h2>
          <button type="button" className="btn btn-primary btn-sm" disabled={items.length === 0} onClick={exportCalendar}>
            Download Calendar Reminders (.ics)
          </button>
        </div>

        {items.length === 0 ? (
          <p className="card-hint" style={{ marginBottom: 0 }}>
            Enter any date above to see your personalized timeline and unlock calendar reminders.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {items.map((item) => {
              const b = TONE_BADGE[item.tone];
              return (
                <div key={item.id} className="sub-row" style={{ marginBottom: 0 }}>
                  <div className="sub-row-head" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                    <strong>{item.title}</strong>
                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{item.dueDate}</span>
                      <span className={`badge ${b.cls}`}>{b.label(item.daysLeft)}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>{item.explanation}</p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--teal)', fontWeight: 700, marginBottom: 0 }}>
                    Next step: {item.action}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="wizard-footer">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Continue to Download &amp; Submit →
        </button>
      </div>
    </div>
  );
}
