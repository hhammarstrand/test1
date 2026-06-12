// Beräknade värden (rena funktioner över state) — anropas från komponenter.

import type {
  Article,
  Material,
  Order,
  PlannedOperation,
  PurchaseOrder,
} from '../types';
import { dueDateTime } from '../lib/time';

export function openOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.status !== 'levererad');
}

/** Order är sen om någon rad har passerat leveransdatum utan att vara levererad,
 *  eller om någon planerad operation slutar efter leveransdatum. */
export function lateOrders(orders: Order[], ops: PlannedOperation[]): Order[] {
  const now = Date.now();
  const lastOpEndByLine = new Map<string, number>();
  for (const op of ops) {
    if (op.status === 'klar' || !op.end) continue;
    const end = new Date(op.end).getTime();
    const cur = lastOpEndByLine.get(op.orderLineId) ?? 0;
    if (end > cur) lastOpEndByLine.set(op.orderLineId, end);
  }
  return orders.filter((o) => {
    if (o.status === 'levererad') return false;
    return o.lines.some((l) => {
      const due = dueDateTime(l.dueDate).getTime();
      if (o.status !== 'klar' && due < now) return true;
      const opEnd = lastOpEndByLine.get(l.id);
      return opEnd !== undefined && opEnd > due;
    });
  });
}

/** Inkommande kvantitet per material från öppna inköpsordrar. */
export function inboundByMaterial(purchaseOrders: PurchaseOrder[]): Map<string, number> {
  const inbound = new Map<string, number>();
  for (const po of purchaseOrders) {
    if (po.status !== 'beställd') continue;
    for (const l of po.lines) {
      inbound.set(l.materialId, (inbound.get(l.materialId) ?? 0) + l.qty);
    }
  }
  return inbound;
}

export function lowStockMaterials(
  materials: Material[],
  purchaseOrders: PurchaseOrder[],
): Material[] {
  const inbound = inboundByMaterial(purchaseOrders);
  return materials.filter(
    (m) => m.stockQty + (inbound.get(m.id) ?? 0) < m.reorderPoint,
  );
}

export interface MaterialRequirement {
  materialId: string;
  required: number;
  available: number; // saldo + inkommande
  shortage: number;  // > 0 vid brist
}

/** Materialbehov för en order mot tillgängligt saldo + inkommande. */
export function materialRequirements(
  order: Order,
  articles: Article[],
  materials: Material[],
  purchaseOrders: PurchaseOrder[],
): MaterialRequirement[] {
  const articleById = new Map(articles.map((a) => [a.id, a]));
  const inbound = inboundByMaterial(purchaseOrders);
  const required = new Map<string, number>();
  for (const line of order.lines) {
    const article = articleById.get(line.articleId);
    if (!article) continue;
    for (const bl of article.bom) {
      required.set(bl.materialId, (required.get(bl.materialId) ?? 0) + bl.qtyPerUnit * line.qty);
    }
  }
  const result: MaterialRequirement[] = [];
  for (const [materialId, req] of required) {
    const mat = materials.find((m) => m.id === materialId);
    const available = (mat?.stockQty ?? 0) + (inbound.get(materialId) ?? 0);
    result.push({
      materialId,
      required: Math.round(req * 100) / 100,
      available: Math.round(available * 100) / 100,
      shortage: Math.max(0, Math.round((req - available) * 100) / 100),
    });
  }
  return result;
}
