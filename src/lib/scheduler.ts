// Framåtriktad schemaläggning med finit kapacitet: en operation åt gången per
// maskin, operationer inom en orderrad strikt sekventiella per operationsnummer,
// flyttbara operationer prioriteras på tidigaste leveransdatum (EDD).
// Rena funktioner utan store-beroende.

import type { Machine, Order, PlannedOperation } from '../types';
import { addWorkingMinutes, clampToWorkingHours, workingMinutesBetween } from './time';

interface Interval {
  start: number; // epoch ms
  end: number;
}

function insertInterval(list: Interval[], iv: Interval): void {
  const idx = list.findIndex((x) => x.start >= iv.start);
  if (idx === -1) list.push(iv);
  else list.splice(idx, 0, iv);
}

/**
 * Hittar första lediga lucka på maskinen från earliest som rymmer durationMin
 * arbetsminuter utan att överlappa upptagna intervall.
 */
export function findSlot(
  machine: Machine,
  earliest: Date,
  durationMin: number,
  busy: Interval[],
): { start: Date; end: Date } {
  let t = clampToWorkingHours(machine, earliest);
  for (let guard = 0; guard < 10000; guard++) {
    // Flytta fram t förbi alla intervall som täcker t
    const covering = busy.find((iv) => iv.start <= t.getTime() && iv.end > t.getTime());
    if (covering) {
      t = clampToWorkingHours(machine, new Date(covering.end));
      continue;
    }
    const end = addWorkingMinutes(machine, t, durationMin);
    // Kolla om något upptaget intervall börjar innan vi hinner klart
    const blocker = busy.find((iv) => iv.start < end.getTime() && iv.end > t.getTime());
    if (!blocker) {
      return { start: t, end };
    }
    t = clampToWorkingHours(machine, new Date(blocker.end));
  }
  // Bör aldrig nås; returnera ändå något giltigt
  const end = addWorkingMinutes(machine, t, durationMin);
  return { start: t, end };
}

/**
 * Schemalägger om alla olåsta planerade operationer. Låsta operationer och
 * operationer som pågår/är klara ligger fast och blockerar sina maskiner.
 * Returnerar en ny lista (muterar inte indata).
 */
export function scheduleAll(
  ops: PlannedOperation[],
  machines: Machine[],
  orders: Order[],
  now: Date,
): PlannedOperation[] {
  const machineById = new Map(machines.map((m) => [m.id, m]));
  const lineById = new Map(
    orders.flatMap((o) => o.lines.map((l) => [l.id, l] as const)),
  );

  const fixed = ops.filter((op) => op.locked || op.status !== 'planerad');
  const movable = ops.filter((op) => !op.locked && op.status === 'planerad');

  const busy = new Map<string, Interval[]>();
  for (const m of machines) busy.set(m.id, []);
  for (const op of fixed) {
    const list = busy.get(op.machineId);
    if (list && op.start && op.end) {
      insertInterval(list, { start: new Date(op.start).getTime(), end: new Date(op.end).getTime() });
    }
  }

  // EDD-prioritet, sedan order och operationsföljd
  const sorted = [...movable].sort((a, b) => {
    const dueA = lineById.get(a.orderLineId)?.dueDate ?? '9999-12-31';
    const dueB = lineById.get(b.orderLineId)?.dueDate ?? '9999-12-31';
    if (dueA !== dueB) return dueA < dueB ? -1 : 1;
    if (a.orderId !== b.orderId) return a.orderId < b.orderId ? -1 : 1;
    return a.operationNo - b.operationNo;
  });

  // Föregående operations slut per orderrad (fasta operationer räknas in)
  const prevEndPerLine = new Map<string, number>();
  for (const op of fixed) {
    if (!op.end) continue;
    const end = new Date(op.end).getTime();
    const cur = prevEndPerLine.get(op.orderLineId) ?? 0;
    if (end > cur) prevEndPerLine.set(op.orderLineId, end);
  }

  const result: PlannedOperation[] = [];
  for (const op of sorted) {
    const machine = machineById.get(op.machineId);
    if (!machine) {
      result.push(op);
      continue;
    }
    const prevEnd = prevEndPerLine.get(op.orderLineId) ?? 0;
    const earliest = new Date(Math.max(now.getTime(), prevEnd));
    const list = busy.get(op.machineId)!;
    const { start, end } = findSlot(machine, earliest, op.durationMin, list);
    insertInterval(list, { start: start.getTime(), end: end.getTime() });
    prevEndPerLine.set(op.orderLineId, end.getTime());
    result.push({ ...op, start: start.toISOString(), end: end.toISOString() });
  }

  return [...fixed, ...result];
}

/** Veckonyttjande i procent för en maskin: planerade arbetsminuter / kapacitet. */
export function machineUtilization(
  machine: Machine,
  ops: PlannedOperation[],
  weekStart: Date,
  weekEnd: Date,
): number {
  const capacity = machine.hoursPerDay * 60 * 5;
  if (capacity === 0) return 0;
  let planned = 0;
  for (const op of ops) {
    if (op.machineId !== machine.id || op.status === 'klar' || !op.start || !op.end) continue;
    const s = new Date(op.start);
    const e = new Date(op.end);
    if (e <= weekStart || s >= weekEnd) continue;
    const from = s > weekStart ? s : weekStart;
    const to = e < weekEnd ? e : weekEnd;
    planned += workingMinutesBetween(machine, from, to);
  }
  return Math.round((planned / capacity) * 100);
}
