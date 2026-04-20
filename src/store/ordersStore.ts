import { create } from 'zustand';
import { ordersApi } from '../shared/api/orders';
import type {Order, OrderStatus} from "../shared/types";

interface OrdersState {
  orders: Order[];
  loading: boolean;
  selectedOrder: Order | null;
  error?: string;
  fetchOrders: () => Promise<void>;
  createOrder: (payload: Partial<Order>) => Promise<void>;
  updateOrder: (id: string, payload: Partial<Order>) => Promise<void>;
  sendOrder: (id: string) => Promise<void>;
  assignCourier: (id: string, courierId: string) => Promise<void>;
  selectOrder: (order: Order | null) => void;
  mergeOrder: (order: Partial<Order> & { id: string }) => void;
  setCourierUpdate: (payload: { courierId: string; status: string; orderId?: string }) => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  loading: false,
  selectedOrder: null,
  error: undefined,

  fetchOrders: async () => {
    set({ loading: true, error: undefined });
    try {
      const orders = await ordersApi.getOrders();
      set({ orders });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createOrder: async (payload) => {
    set({ loading: true, error: undefined });
    try {
      const order = await ordersApi.createOrder(payload);
      set((state) => ({ orders: [order, ...state.orders] }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateOrder: async (id, payload) => {
    set({ loading: true, error: undefined });
    try {
      const updated = await ordersApi.updateOrder(id, payload);
      set((state) => ({ orders: state.orders.map((order) => (order.id === id ? updated : order)) }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  sendOrder: async (id) => {
    set({ loading: true, error: undefined });
    try {
      const updated = await ordersApi.sendOrder(id);
      set((state) => ({ orders: state.orders.map((order) => (order.id === id ? updated : order)) }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  assignCourier: async (id, courierId) => {
    set({ loading: true, error: undefined });
    try {
      const updated = await ordersApi.assignCourier(id, courierId);
      set((state) => ({ orders: state.orders.map((order) => (order.id === id ? updated : order)) }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  selectOrder: (order) => set({ selectedOrder: order }),

  mergeOrder: (order) =>
    set((state) => ({ orders: state.orders.map((item) => (item.id === order.id ? { ...item, ...order } : item)) })),

  setCourierUpdate: ({ courierId, status, orderId }) =>
    set((state) => {
      if (!orderId) return state;

      let didUpdate = false;
      const orders = state.orders.map((order) => {
        if (order.id !== orderId) return order;

        const nextStatus = status as OrderStatus;
        if (order.status === nextStatus) return order;

        didUpdate = true;
        return { ...order, status: nextStatus } as Order;
      });

      return didUpdate ? { orders } : state;
    }),
}));
