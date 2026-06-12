// Arbetstidsmatematik: maskiner arbetar mån–fre, workdayStartHour → +hoursPerDay.
// All schemaläggning räknar i arbetsminuter och hoppar över kvällar och helger.

import type { Machine } from '../types';

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function dayStart(m: Machine, d: Date): Date {
  const r = new Date(d);
  r.setHours(m.workdayStartHour, 0, 0, 0);
  return r;
}

function dayEnd(m: Machine, d: Date): Date {
  const r = new Date(d);
  const endMin = m.workdayStartHour * 60 + m.hoursPerDay * 60;
  r.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
  return r;
}

function nextWorkdayStart(m: Machine, d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + 1);
  while (isWeekend(r)) r.setDate(r.getDate() + 1);
  return dayStart(m, r);
}

/** Nästa tidpunkt inom maskinens arbetstid (mån–fre, arbetsdagens fönster). */
export function clampToWorkingHours(m: Machine, t: Date): Date {
  let r = new Date(t);
  r.setSeconds(0, 0);
  for (;;) {
    if (isWeekend(r)) {
      r = nextWorkdayStart(m, r);
      continue;
    }
    const start = dayStart(m, r);
    const end = dayEnd(m, r);
    if (r < start) return start;
    if (r >= end) {
      r = nextWorkdayStart(m, r);
      continue;
    }
    return r;
  }
}

/** Adderar n arbetsminuter från t (t förutsätts ligga inom arbetstid). */
export function addWorkingMinutes(m: Machine, t: Date, minutes: number): Date {
  let cur = clampToWorkingHours(m, t);
  let left = minutes;
  for (;;) {
    const end = dayEnd(m, cur);
    const avail = (end.getTime() - cur.getTime()) / 60000;
    if (left <= avail) {
      return new Date(cur.getTime() + left * 60000);
    }
    left -= avail;
    cur = nextWorkdayStart(m, cur);
  }
}

/** Antal arbetsminuter mellan a och b för maskinen. */
export function workingMinutesBetween(m: Machine, a: Date, b: Date): number {
  if (b <= a) return 0;
  let cur = clampToWorkingHours(m, a);
  let total = 0;
  while (cur < b) {
    const end = dayEnd(m, cur);
    const sliceEnd = end < b ? end : b;
    if (sliceEnd > cur) total += (sliceEnd.getTime() - cur.getTime()) / 60000;
    cur = nextWorkdayStart(m, cur);
  }
  return total;
}

// ---------- Datumhjälpare ----------

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** Måndag i veckan som d ligger i. */
export function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  const day = (r.getDay() + 6) % 7; // mån=0
  r.setDate(r.getDate() - day);
  return r;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Leveransdatum tolkas som kl 16:00 den dagen. */
export function dueDateTime(isoDate: string): Date {
  const d = new Date(`${isoDate}T16:00:00`);
  return d;
}

// ---------- sv-SE-formatering ----------

const dateFmt = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' });
const dateTimeFmt = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const numberFmt = new Intl.NumberFormat('sv-SE');
const currencyFmt = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  maximumFractionDigits: 0,
});

export function fmtDate(iso: string): string {
  return iso ? dateFmt.format(new Date(iso)) : '–';
}

export function fmtDateTime(iso: string): string {
  return iso ? dateTimeFmt.format(new Date(iso)) : '–';
}

export function fmtNumber(n: number): string {
  return numberFmt.format(n);
}

export function fmtSEK(n: number): string {
  return currencyFmt.format(n);
}

export function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
