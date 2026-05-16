import { getTelegramInitData } from '@shared/utils/telegram';
import type { Order } from '@shared/types';
import type { Courier } from '@shared/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const initData = getTelegramInitData();
  const res = await fetch(`${BASE_URL}/courier-app${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json.data;
}

export const courierAppApi = {
  getMe: () => request<Courier>('/me'),

  getOrders: () => request<Order[]>('/orders'),

  updateOrderStatus: (orderId: string, status: string) =>
    request<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateLocation: (lat: number, lng: number) =>
    request<Courier>('/location', {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
    }),
};
