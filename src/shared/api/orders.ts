import { api } from './base';
import type {Order} from "../types";

export const ordersApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders');
    return response.data;
  },
  createOrder: async (payload: Partial<Order>): Promise<Order> => {
    const response = await api.post<Order>('/orders', payload);
    return response.data;
  },
  updateOrder: async (id: string, payload: Partial<Order>): Promise<Order> => {
    const response = await api.patch<Order>(`/orders/${id}`, payload);
    return response.data;
  },
  sendOrder: async (id: string): Promise<Order> => {
    const response = await api.post<Order>(`/orders/${id}/send`);
    return response.data;
  },
  assignCourier: async (id: string, courierId: string): Promise<Order> => {
    const response = await api.post<Order>(`/orders/${id}/assign`, { courierId });
    return response.data;
  },
};
