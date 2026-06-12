// Konflikt- och förseningsdetektering för beläggningsvyn.

import type { Order, PlannedOperation } from '../types';
import { dueDateTime } from './time';

/** Op-id:n som överlappar en annan operation på samma maskin. */
export function findConflicts(ops: PlannedOperation[]): Set<string> {
  const conflicts = new Set<string>();
  const byMachine = new Map<string, PlannedOperation[]>();
  for (const op of ops) {
    if (op.status === 'klar' || !op.start || !op.end) continue;
    const list = byMachine.get(op.machineId) ?? [];
    list.push(op);
    byMachine.set(op.machineId, list);
  }
  for (const list of byMachine.values()) {
    const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[j].start >= sorted[i].end) break;
        conflicts.add(sorted[i].id);
        conflicts.add(sorted[j].id);
      }
    }
  }
  return conflicts;
}

/** Op-id:n vars slut ligger efter orderradens leveransdatum (kl 16:00). */
export function findLateOps(ops: PlannedOperation[], orders: Order[]): Set<string> {
  const dueByLine = new Map<string, number>();
  for (const o of orders) {
    for (const l of o.lines) dueByLine.set(l.id, dueDateTime(l.dueDate).getTime());
  }
  const late = new Set<string>();
  for (const op of ops) {
    if (op.status === 'klar' || !op.end) continue;
    const due = dueByLine.get(op.orderLineId);
    if (due !== undefined && new Date(op.end).getTime() > due) late.add(op.id);
  }
  return late;
}
