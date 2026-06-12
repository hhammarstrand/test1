// Demodata för en liten svensk mekanisk verkstad. Alla datum genereras
// relativt dagens datum så att demon alltid ser aktuell ut. Ordrar i
// produktion schemaläggs med den riktiga schemaläggaren vid seed.

import type {
  Article,
  Customer,
  Machine,
  Material,
  Order,
  PlannedOperation,
  PurchaseOrder,
  Supplier,
} from '../types';
import { scheduleAll } from '../lib/scheduler';
import { addDays, toISODate } from '../lib/time';

export interface SeedData {
  customers: Customer[];
  suppliers: Supplier[];
  materials: Material[];
  machines: Machine[];
  articles: Article[];
  orders: Order[];
  plannedOperations: PlannedOperation[];
  purchaseOrders: PurchaseOrder[];
  counters: { order: number; po: number };
}

const day = (offset: number) => toISODate(addDays(new Date(), offset));

export function createSeedData(): SeedData {
  const machines: Machine[] = [
    { id: 'machine-svarv-1', name: 'Svarv 1 (Mazak QT-250)', type: 'svarv', hoursPerDay: 9, workdayStartHour: 7, active: true },
    { id: 'machine-svarv-2', name: 'Svarv 2 (manuell)', type: 'svarv', hoursPerDay: 8, workdayStartHour: 7, active: true },
    { id: 'machine-fras-1', name: 'CNC-fräs Haas VF-2', type: 'fräs', hoursPerDay: 9, workdayStartHour: 7, active: true },
    { id: 'machine-fras-2', name: 'CNC-fräs Haas Mini Mill', type: 'fräs', hoursPerDay: 8, workdayStartHour: 7, active: true },
    { id: 'machine-borr-1', name: 'Pelarborr Arboga', type: 'borr', hoursPerDay: 8, workdayStartHour: 7, active: true },
    { id: 'machine-kontroll', name: 'Kontroll/mätrum', type: 'kontroll', hoursPerDay: 8, workdayStartHour: 7, active: true },
  ];

  const customers: Customer[] = [
    { id: 'cust-volvo', name: 'Volvo Penta AB', orgNr: '556034-1330', contact: 'Anna Lindqvist', email: 'anna.lindqvist@volvopenta.se', phone: '031-66 00 00', city: 'Göteborg' },
    { id: 'cust-scanmek', name: 'Scanmek AB', orgNr: '556221-4455', contact: 'Per Olsson', email: 'per@scanmek.se', phone: '040-12 34 56', city: 'Malmö' },
    { id: 'cust-nordhydraulik', name: 'Nordhydraulik AB', orgNr: '556443-7788', contact: 'Maria Berg', email: 'maria.berg@nordhydraulik.se', phone: '0660-21 00 00', city: 'Kramfors' },
    { id: 'cust-berga', name: 'Berga Mekaniska', orgNr: '556789-1122', contact: 'Johan Ek', email: 'johan@bergamek.se', phone: '08-550 12 00', city: 'Södertälje' },
    { id: 'cust-af', name: 'ÅF Industriteknik', orgNr: '556120-6474', contact: 'Sara Holm', email: 'sara.holm@afind.se', phone: '010-505 00 00', city: 'Stockholm' },
  ];

  const suppliers: Supplier[] = [
    { id: 'supp-tibnor', name: 'Tibnor AB', contact: 'Order Syd', email: 'order@tibnor.se', leadTimeDays: 3 },
    { id: 'supp-begroup', name: 'BE Group', contact: 'Kundtjänst', email: 'order@begroup.se', leadTimeDays: 5 },
    { id: 'supp-stena', name: 'Stena Stål', contact: 'Order Väst', email: 'order@stenastal.se', leadTimeDays: 4 },
  ];

  const materials: Material[] = [
    { id: 'mat-1010', number: 'M-1010', name: 'Rundstång SS2172 Ø50', unit: 'm', stockQty: 24, reorderPoint: 10, reorderQty: 30, supplierId: 'supp-tibnor', price: 185 },
    { id: 'mat-1020', number: 'M-1020', name: 'Rundstång SS2172 Ø80', unit: 'm', stockQty: 4, reorderPoint: 8, reorderQty: 24, supplierId: 'supp-tibnor', price: 420 },
    { id: 'mat-1030', number: 'M-1030', name: 'Rundstång rostfri SS2343 Ø40', unit: 'm', stockQty: 12, reorderPoint: 6, reorderQty: 18, supplierId: 'supp-stena', price: 560 },
    { id: 'mat-2010', number: 'M-2010', name: 'Plattstång S355 60x20', unit: 'm', stockQty: 18, reorderPoint: 10, reorderQty: 30, supplierId: 'supp-begroup', price: 95 },
    { id: 'mat-2020', number: 'M-2020', name: 'Plattjärn S235 100x10', unit: 'm', stockQty: 3, reorderPoint: 12, reorderQty: 36, supplierId: 'supp-begroup', price: 78 },
    { id: 'mat-3010', number: 'M-3010', name: 'Aluminiumämne EN AW-6082 110x110', unit: 'st', stockQty: 40, reorderPoint: 20, reorderQty: 50, supplierId: 'supp-begroup', price: 240 },
    { id: 'mat-3020', number: 'M-3020', name: 'Aluminiumplatta EN AW-5083 20 mm', unit: 'kg', stockQty: 85, reorderPoint: 40, reorderQty: 120, supplierId: 'supp-stena', price: 62 },
    { id: 'mat-4010', number: 'M-4010', name: 'Mässingsstång CW614N Ø25', unit: 'm', stockQty: 9, reorderPoint: 5, reorderQty: 15, supplierId: 'supp-tibnor', price: 310 },
  ];

  const articles: Article[] = [
    {
      id: 'art-1001', number: 'A-1001', name: 'Axel Ø40x250', description: 'Drivaxel med kilspår, SS2172', price: 850,
      routing: [
        { id: 'rs-1001-10', operationNo: 10, description: 'Grovsvarvning', machineType: 'svarv', defaultMachineId: 'machine-svarv-1', setupTimeMin: 30, cycleTimeMin: 12 },
        { id: 'rs-1001-20', operationNo: 20, description: 'Finsvarvning', machineType: 'svarv', defaultMachineId: 'machine-svarv-1', setupTimeMin: 20, cycleTimeMin: 8 },
        { id: 'rs-1001-30', operationNo: 30, description: 'Fräsning kilspår', machineType: 'fräs', defaultMachineId: 'machine-fras-2', setupTimeMin: 25, cycleTimeMin: 6 },
        { id: 'rs-1001-40', operationNo: 40, description: 'Kontrollmätning', machineType: 'kontroll', defaultMachineId: 'machine-kontroll', setupTimeMin: 10, cycleTimeMin: 3 },
      ],
      bom: [{ materialId: 'mat-1010', qtyPerUnit: 0.3 }],
    },
    {
      id: 'art-1002', number: 'A-1002', name: 'Hydraulkolv Ø75', description: 'Kolv till hydraulcylinder, rostfri', price: 2400,
      routing: [
        { id: 'rs-1002-10', operationNo: 10, description: 'Grovsvarvning', machineType: 'svarv', defaultMachineId: 'machine-svarv-1', setupTimeMin: 45, cycleTimeMin: 25 },
        { id: 'rs-1002-20', operationNo: 20, description: 'Finsvarvning + gängning', machineType: 'svarv', defaultMachineId: 'machine-svarv-1', setupTimeMin: 30, cycleTimeMin: 18 },
        { id: 'rs-1002-30', operationNo: 30, description: 'Kontrollmätning', machineType: 'kontroll', defaultMachineId: 'machine-kontroll', setupTimeMin: 10, cycleTimeMin: 5 },
      ],
      bom: [{ materialId: 'mat-1020', qtyPerUnit: 0.4 }],
    },
    {
      id: 'art-2001', number: 'A-2001', name: 'Fästplatta 100x80', description: 'Maskinfäste med 6 hål, S235', price: 320,
      routing: [
        { id: 'rs-2001-10', operationNo: 10, description: 'Fräsning kontur', machineType: 'fräs', defaultMachineId: 'machine-fras-1', setupTimeMin: 20, cycleTimeMin: 7 },
        { id: 'rs-2001-20', operationNo: 20, description: 'Borrning hålbild', machineType: 'borr', defaultMachineId: 'machine-borr-1', setupTimeMin: 15, cycleTimeMin: 4 },
      ],
      bom: [{ materialId: 'mat-2020', qtyPerUnit: 0.12 }],
    },
    {
      id: 'art-3001', number: 'A-3001', name: 'Ventilhus aluminium', description: 'Fräst ventilhus EN AW-6082', price: 1850,
      routing: [
        { id: 'rs-3001-10', operationNo: 10, description: 'Fräsning sida 1', machineType: 'fräs', defaultMachineId: 'machine-fras-1', setupTimeMin: 60, cycleTimeMin: 35 },
        { id: 'rs-3001-20', operationNo: 20, description: 'Fräsning sida 2', machineType: 'fräs', defaultMachineId: 'machine-fras-1', setupTimeMin: 40, cycleTimeMin: 22 },
        { id: 'rs-3001-30', operationNo: 30, description: 'Borrning + gängning', machineType: 'borr', defaultMachineId: 'machine-borr-1', setupTimeMin: 20, cycleTimeMin: 9 },
        { id: 'rs-3001-40', operationNo: 40, description: 'Kontrollmätning', machineType: 'kontroll', defaultMachineId: 'machine-kontroll', setupTimeMin: 15, cycleTimeMin: 6 },
      ],
      bom: [{ materialId: 'mat-3010', qtyPerUnit: 1 }],
    },
    {
      id: 'art-4001', number: 'A-4001', name: 'Bussning mässing Ø25x40', description: 'Glidbussning CW614N', price: 145,
      routing: [
        { id: 'rs-4001-10', operationNo: 10, description: 'Svarvning komplett', machineType: 'svarv', defaultMachineId: 'machine-svarv-2', setupTimeMin: 25, cycleTimeMin: 5 },
      ],
      bom: [{ materialId: 'mat-4010', qtyPerUnit: 0.05 }],
    },
    {
      id: 'art-5001', number: 'A-5001', name: 'Distansplatta 60x60', description: 'Distans i aluminium, 20 mm', price: 210,
      routing: [
        { id: 'rs-5001-10', operationNo: 10, description: 'Fräsning kontur + plan', machineType: 'fräs', defaultMachineId: 'machine-fras-2', setupTimeMin: 25, cycleTimeMin: 8 },
        { id: 'rs-5001-20', operationNo: 20, description: 'Borrning', machineType: 'borr', defaultMachineId: 'machine-borr-1', setupTimeMin: 10, cycleTimeMin: 3 },
      ],
      bom: [{ materialId: 'mat-3020', qtyPerUnit: 0.55 }],
    },
  ];

  const orders: Order[] = [
    // Offerter
    {
      id: 'order-1', orderNo: 'KO-2026-009', customerId: 'cust-af', status: 'offert', createdDate: day(-2),
      lines: [{ id: 'ol-1-1', articleId: 'art-3001', qty: 12, dueDate: day(20) }],
    },
    {
      id: 'order-2', orderNo: 'KO-2026-010', customerId: 'cust-berga', status: 'offert', createdDate: day(-1),
      lines: [
        { id: 'ol-2-1', articleId: 'art-4001', qty: 60, dueDate: day(15) },
        { id: 'ol-2-2', articleId: 'art-5001', qty: 25, dueDate: day(18) },
      ],
    },
    // Bekräftade
    {
      id: 'order-3', orderNo: 'KO-2026-011', customerId: 'cust-volvo', status: 'bekräftad', createdDate: day(-4),
      lines: [{ id: 'ol-3-1', articleId: 'art-1002', qty: 8, dueDate: day(14) }],
    },
    {
      id: 'order-4', orderNo: 'KO-2026-012', customerId: 'cust-scanmek', status: 'bekräftad', createdDate: day(-3),
      lines: [{ id: 'ol-4-1', articleId: 'art-2001', qty: 40, dueDate: day(12) }],
    },
    // I produktion — schemaläggs nedan. Order 5 är avsiktligt sen (leverans igår).
    {
      id: 'order-5', orderNo: 'KO-2026-007', customerId: 'cust-nordhydraulik', status: 'i_produktion', createdDate: day(-12),
      lines: [{ id: 'ol-5-1', articleId: 'art-1001', qty: 30, dueDate: day(-1) }],
    },
    {
      id: 'order-6', orderNo: 'KO-2026-008', customerId: 'cust-volvo', status: 'i_produktion', createdDate: day(-8),
      lines: [
        { id: 'ol-6-1', articleId: 'art-3001', qty: 10, dueDate: day(9) },
        { id: 'ol-6-2', articleId: 'art-2001', qty: 20, dueDate: day(9) },
      ],
    },
    // Klar och levererad
    {
      id: 'order-7', orderNo: 'KO-2026-005', customerId: 'cust-berga', status: 'klar', createdDate: day(-18),
      lines: [{ id: 'ol-7-1', articleId: 'art-4001', qty: 100, dueDate: day(2) }],
    },
    {
      id: 'order-8', orderNo: 'KO-2026-003', customerId: 'cust-scanmek', status: 'levererad', createdDate: day(-30),
      lines: [{ id: 'ol-8-1', articleId: 'art-5001', qty: 50, dueDate: day(-10) }],
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-1', poNo: 'IO-2026-004', supplierId: 'supp-tibnor', status: 'beställd',
      orderDate: day(-2), expectedDate: day(1),
      lines: [{ id: 'pol-1-1', materialId: 'mat-1020', qty: 24 }],
    },
    {
      id: 'po-2', poNo: 'IO-2026-005', supplierId: 'supp-begroup', status: 'beställd',
      orderDate: day(-1), expectedDate: day(4),
      lines: [{ id: 'pol-2-1', materialId: 'mat-3010', qty: 50 }],
    },
    {
      id: 'po-3', poNo: 'IO-2026-002', supplierId: 'supp-stena', status: 'mottagen',
      orderDate: day(-9), expectedDate: day(-5),
      lines: [{ id: 'pol-3-1', materialId: 'mat-3020', qty: 120 }],
    },
  ];

  // Generera planerade operationer för ordrar i produktion och schemalägg
  const articleById = new Map(articles.map((a) => [a.id, a]));
  const rawOps: PlannedOperation[] = [];
  for (const order of orders) {
    if (order.status !== 'i_produktion') continue;
    for (const line of order.lines) {
      const article = articleById.get(line.articleId)!;
      for (const step of article.routing) {
        rawOps.push({
          id: `pop-${order.id}-${line.id}-${step.operationNo}`,
          orderId: order.id,
          orderLineId: line.id,
          routingStepId: step.id,
          operationNo: step.operationNo,
          description: step.description,
          machineId: step.defaultMachineId,
          machineType: step.machineType,
          durationMin: step.setupTimeMin + step.cycleTimeMin * line.qty,
          start: '',
          end: '',
          status: 'planerad',
          locked: false,
        });
      }
    }
  }
  const plannedOperations = scheduleAll(rawOps, machines, orders, new Date());

  return {
    customers,
    suppliers,
    materials,
    machines,
    articles,
    orders,
    plannedOperations,
    purchaseOrders,
    counters: { order: 13, po: 6 },
  };
}
