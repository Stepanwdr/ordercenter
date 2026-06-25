import { api } from './base';
import type {Order} from "../types";

export const ordersApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await api.get<{ data: Order[] }>('/orders');
    return response.data.data;
  },
  createOrder: async (payload: Partial<Order>): Promise<Order> => {
    const response = await api.post<{ data: Order }>('/orders', payload);
    return response.data.data;
  },
  updateOrder: async (id: string, payload: Partial<Order>): Promise<Order> => {
    const response = await api.put<{ data: Order }>(`/orders/${id}`, payload);
    return response.data.data;
  },
  sendOrder: async (id: string): Promise<Order> => {
    const response = await api.post<{ data: Order }>(`/orders/${id}/send`);
    return response.data.data;
  },
  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const response = await api.put<{ data: Order }>(`/orders/${id}/status`, { status });
    return response.data.data;
  },
  updateOrderPayMethod: async (id: string, payMethod: string): Promise<Order> => {
    const response = await api.put<{ data: Order }>(`/orders/${id}/pay-method`, { payMethod });
    return response.data.data;
  },
  updateOrderType: async (id: string, orderType: string): Promise<Order> => {
    const response = await api.put<{ data: Order }>(`/orders/${id}/order-type`, { orderType });
    return response.data.data;
  },
  deleteOrder: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },
};
