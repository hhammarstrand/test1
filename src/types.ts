// Datamodell för verkstadssystemet. Terminologi enligt svensk verkstadspraxis
// (Monitor ERP-stil): beredning, ställtid, stycktid, beläggning, beställningspunkt.

// ---------- Grunddata ----------

export interface Customer {
  id: string;
  name: string;
  orgNr: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  leadTimeDays: number;
}

export type MaterialUnit = 'st' | 'kg' | 'm';

export interface Material {
  id: string;
  number: string;
  name: string;
  unit: MaterialUnit;
  stockQty: number;
  reorderPoint: number;
  reorderQty: number;
  supplierId: string;
  price: number; // SEK per enhet
}

export type MachineType = 'svarv' | 'fräs' | 'borr' | 'slip' | 'manuell' | 'kontroll';

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  hoursPerDay: number;
  workdayStartHour: number;
  active: boolean;
}

export interface RoutingStep {
  id: string;
  operationNo: number;
  description: string;
  machineType: MachineType;
  defaultMachineId: string;
  setupTimeMin: number;
  cycleTimeMin: number;
}

export interface BomLine {
  materialId: string;
  qtyPerUnit: number;
}

export interface Article {
  id: string;
  number: string;
  name: string;
  description: string;
  price: number;
  routing: RoutingStep[];
  bom: BomLine[];
}

// ---------- Transaktionsdata ----------

export type OrderStatus = 'offert' | 'bekräftad' | 'i_produktion' | 'klar' | 'levererad';

export interface OrderLine {
  id: string;
  articleId: string;
  qty: number;
  dueDate: string; // ISO-datum "2026-06-25"
}

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  status: OrderStatus;
  createdDate: string;
  lines: OrderLine[];
}

export type PlannedOpStatus = 'planerad' | 'pågår' | 'klar';

export interface PlannedOperation {
  id: string;
  orderId: string;
  orderLineId: string;
  routingStepId: string;
  operationNo: number;
  description: string;
  machineId: string;
  machineType: MachineType;
  durationMin: number; // ställtid + stycktid * antal, fryst vid frisläpp
  start: string; // ISO datetime
  end: string;
  status: PlannedOpStatus;
  locked: boolean; // manuellt flyttad — autoschemaläggning rör den ej
}

export type PurchaseOrderStatus = 'beställd' | 'mottagen';

export interface PurchaseOrderLine {
  id: string;
  materialId: string;
  qty: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate: string;
  lines: PurchaseOrderLine[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  offert: 'Offert',
  bekräftad: 'Bekräftad',
  i_produktion: 'I produktion',
  klar: 'Klar',
  levererad: 'Levererad',
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'offert',
  'bekräftad',
  'i_produktion',
  'klar',
  'levererad',
];

export const MACHINE_TYPE_LABELS: Record<MachineType, string> = {
  svarv: 'Svarv',
  fräs: 'Fräs',
  borr: 'Borr',
  slip: 'Slip',
  manuell: 'Manuell bearbetning',
  kontroll: 'Kontroll/mätning',
};
