import type { DeadlineItem } from './engine';

function icsDate(iso: string): string {
  return iso.replace(/-/g, '');
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Generate an RFC 5545 .ics calendar file so families can import reminders into any calendar app. */
export function buildIcsCalendar(items: DeadlineItem[], childName: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Katie Beckett Helper//Georgia TEFRA Wizard//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(`Katie Beckett Reminders${childName ? ` — ${childName}` : ''}`)}`,
  ];

  for (const item of items) {
    const start = icsDate(item.dueDate);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${item.id}-${start}@katiebeckett.helper`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `SUMMARY:${escapeIcs(`Katie Beckett: ${item.title}`)}`,
      `DESCRIPTION:${escapeIcs(`${item.explanation}\n\nNext step: ${item.action}`)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcs(`7-day reminder: ${item.title}`)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcs(`Tomorrow: ${item.title}`)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
