import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Article,
  Customer,
  Machine,
  Material,
  Order,
  OrderStatus,
  PlannedOperation,
  PurchaseOrder,
  Supplier,
} from '../types';
import { createSeedData } from '../data/seedData';
import { scheduleAll, findSlot } from '../lib/scheduler';
import { addWorkingMinutes, clampToWorkingHours } from '../lib/time';
import { uid, orderNo, poNo } from '../lib/ids';

interface AppState {
  customers: Customer[];
  suppliers: Supplier[];
  materials: Material[];
  machines: Machine[];
  articles: Article[];
  orders: Order[];
  plannedOperations: PlannedOperation[];
  purchaseOrders: PurchaseOrder[];
  counters: { order: number; po: number };

  upsertCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  upsertSupplier: (s: Supplier) => void;
  deleteSupplier: (id: string) => void;
  upsertMaterial: (m: Material) => void;
  deleteMaterial: (id: string) => void;
  upsertMachine: (m: Machine) => void;
  deleteMachine: (id: string) => void;
  upsertArticle: (a: Article) => void;
  deleteArticle: (id: string) => void;

  createOrder: (customerId: string, lines: Order['lines']) => Order;
  updateOrder: (o: Order) => void;
  deleteOrder: (id: string) => void;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  releaseOrderToProduction: (orderId: string) => void;

  rescheduleOperation: (
    opId: string,
    change: { shiftMinutes?: number; newMachineId?: string },
  ) => void;
  unlockOperation: (opId: string) => void;
  setOperationStatus: (opId: string, status: PlannedOperation['status']) => void;
  autoScheduleAll: () => void;

  createPurchaseOrder: (supplierId: string, lines: PurchaseOrder['lines'], expectedDate: string) => PurchaseOrder;
  receivePurchaseOrder: (poId: string) => void;
  deletePurchaseOrder: (id: string) => void;

  resetDemoData: () => void;
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  const copy = [...list];
  copy[idx] = item;
  return copy;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createSeedData(),

      upsertCustomer: (c) => set((s) => ({ customers: upsert(s.customers, c) })),
      deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((x) => x.id !== id) })),
      upsertSupplier: (sup) => set((s) => ({ suppliers: upsert(s.suppliers, sup) })),
      deleteSupplier: (id) => set((s) => ({ suppliers: s.suppliers.filter((x) => x.id !== id) })),
      upsertMaterial: (m) => set((s) => ({ materials: upsert(s.materials, m) })),
      deleteMaterial: (id) => set((s) => ({ materials: s.materials.filter((x) => x.id !== id) })),
      upsertMachine: (m) => set((s) => ({ machines: upsert(s.machines, m) })),
      deleteMachine: (id) => set((s) => ({ machines: s.machines.filter((x) => x.id !== id) })),
      upsertArticle: (a) => set((s) => ({ articles: upsert(s.articles, a) })),
      deleteArticle: (id) => set((s) => ({ articles: s.articles.filter((x) => x.id !== id) })),

      createOrder: (customerId, lines) => {
        const counter = get().counters.order;
        const order: Order = {
          id: uid(),
          orderNo: orderNo(counter),
          customerId,
          status: 'offert',
          createdDate: new Date().toISOString().slice(0, 10),
          lines,
        };
        set((s) => ({
          orders: [...s.orders, order],
          counters: { ...s.counters, order: counter + 1 },
        }));
        return order;
      },
      updateOrder: (o) => set((s) => ({ orders: upsert(s.orders, o) })),
      deleteOrder: (id) =>
        set((s) => ({
          orders: s.orders.filter((x) => x.id !== id),
          plannedOperations: s.plannedOperations.filter((op) => op.orderId !== id),
        })),

      setOrderStatus: (orderId, status) => {
        if (status === 'i_produktion') {
          get().releaseOrderToProduction(orderId);
          return;
        }
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        }));
      },

      releaseOrderToProduction: (orderId) => {
        const s = get();
        const order = s.orders.find((o) => o.id === orderId);
        if (!order || order.status === 'i_produktion') return;
        const articleById = new Map(s.articles.map((a) => [a.id, a]));

        // Generera operationer från beredningen
        const newOps: PlannedOperation[] = [];
        const materialConsumption = new Map<string, number>();
        for (const line of order.lines) {
          const article = articleById.get(line.articleId);
          if (!article) continue;
          for (const step of article.routing) {
            newOps.push({
              id: uid(),
              orderId: order.id,
              orderLineId: line.id,
              routingStepId: step.id,
              operationNo: step.operationNo,
              description: step.description,
              machineId: step.defaultMachineId,
              machineType: step.machineType,
              durationMin: Math.round(step.setupTimeMin + step.cycleTimeMin * line.qty),
              start: '',
              end: '',
              status: 'planerad',
              locked: false,
            });
          }
          // Materialuttag vid frisläpp (negativt saldo tillåts men flaggas i UI)
          for (const bl of article.bom) {
            materialConsumption.set(
              bl.materialId,
              (materialConsumption.get(bl.materialId) ?? 0) + bl.qtyPerUnit * line.qty,
            );
          }
        }

        const orders = s.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'i_produktion' as OrderStatus } : o,
        );
        const allOps = scheduleAll(
          [...s.plannedOperations, ...newOps],
          s.machines,
          orders,
          new Date(),
        );
        const materials = s.materials.map((m) => {
          const used = materialConsumption.get(m.id);
          return used ? { ...m, stockQty: Math.round((m.stockQty - used) * 100) / 100 } : m;
        });
        set({ orders, plannedOperations: allOps, materials });
      },

      rescheduleOperation: (opId, change) => {
        const s = get();
        const op = s.plannedOperations.find((o) => o.id === opId);
        if (!op) return;
        let updated: PlannedOperation = { ...op, locked: true };

        if (change.newMachineId && change.newMachineId !== op.machineId) {
          const machine = s.machines.find((m) => m.id === change.newMachineId);
          if (!machine) return;
          const busy = s.plannedOperations
            .filter(
              (o) =>
                o.id !== opId &&
                o.machineId === machine.id &&
                o.status !== 'klar' &&
                o.start &&
                o.end,
            )
            .map((o) => ({ start: new Date(o.start).getTime(), end: new Date(o.end).getTime() }))
            .sort((a, b) => a.start - b.start);
          const earliest = op.start ? new Date(op.start) : new Date();
          const slot = findSlot(machine, earliest, op.durationMin, busy);
          updated = {
            ...updated,
            machineId: machine.id,
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
          };
        } else if (change.shiftMinutes) {
          const machine = s.machines.find((m) => m.id === op.machineId);
          if (!machine || !op.start) return;
          const rawStart = new Date(new Date(op.start).getTime() + change.shiftMinutes * 60000);
          const start = clampToWorkingHours(machine, rawStart);
          const end = addWorkingMinutes(machine, start, op.durationMin);
          updated = { ...updated, start: start.toISOString(), end: end.toISOString() };
        }

        const ops = s.plannedOperations.map((o) => (o.id === opId ? updated : o));
        // Olåsta operationer flödar runt det låsta blocket
        set({ plannedOperations: scheduleAll(ops, s.machines, s.orders, new Date()) });
      },

      unlockOperation: (opId) => {
        const s = get();
        const ops = s.plannedOperations.map((o) =>
          o.id === opId ? { ...o, locked: false } : o,
        );
        set({ plannedOperations: scheduleAll(ops, s.machines, s.orders, new Date()) });
      },

      setOperationStatus: (opId, status) =>
        set((s) => ({
          plannedOperations: s.plannedOperations.map((o) =>
            o.id === opId ? { ...o, status } : o,
          ),
        })),

      autoScheduleAll: () => {
        const s = get();
        set({
          plannedOperations: scheduleAll(s.plannedOperations, s.machines, s.orders, new Date()),
        });
      },

      createPurchaseOrder: (supplierId, lines, expectedDate) => {
        const counter = get().counters.po;
        const po: PurchaseOrder = {
          id: uid(),
          poNo: poNo(counter),
          supplierId,
          status: 'beställd',
          orderDate: new Date().toISOString().slice(0, 10),
          expectedDate,
          lines,
        };
        set((s) => ({
          purchaseOrders: [...s.purchaseOrders, po],
          counters: { ...s.counters, po: counter + 1 },
        }));
        return po;
      },

      receivePurchaseOrder: (poId) => {
        const s = get();
        const po = s.purchaseOrders.find((p) => p.id === poId);
        if (!po || po.status === 'mottagen') return;
        const received = new Map(po.lines.map((l) => [l.materialId, l.qty]));
        set({
          purchaseOrders: s.purchaseOrders.map((p) =>
            p.id === poId ? { ...p, status: 'mottagen' } : p,
          ),
          materials: s.materials.map((m) => {
            const qty = received.get(m.id);
            return qty ? { ...m, stockQty: Math.round((m.stockQty + qty) * 100) / 100 } : m;
          }),
        });
      },

      deletePurchaseOrder: (id) =>
        set((s) => ({ purchaseOrders: s.purchaseOrders.filter((p) => p.id !== id) })),

      resetDemoData: () => set({ ...createSeedData() }),
    }),
    {
      name: 'verkstad-poc-v1',
      version: 2,
      // v1→v2: artiklar fick 3D-modell — fyll på befintlig lagrad data
      // med seed-modellerna för matchande artikel-id:n.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<AppState>;
        if (version < 2 && state.articles) {
          const seedModels = new Map(createSeedData().articles.map((a) => [a.id, a.model]));
          state.articles = state.articles.map((a) => ({
            ...a,
            model: a.model ?? seedModels.get(a.id),
          }));
        }
        return state as AppState;
      },
    },
  ),
);
