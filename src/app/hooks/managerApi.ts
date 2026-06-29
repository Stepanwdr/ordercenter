import { api } from '@shared/api/base';
import { useQuery } from '@tanstack/react-query';

export interface ManagerRestaurant {
  id: string;
  name: string;
  logo?: string | null;
}

export interface SalesKpis {
  revenue: number;
  ordersCount: number;
  completedCount: number;
  cancelledCount: number;
  avgCheck: number;
}

export interface SalesPoint {
  day: string;
  revenue: number;
  orders: number;
}

export interface SalesBreakdown {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface SalesOverview {
  kpis: SalesKpis;
  timeseries: SalesPoint[];
  byBranch: SalesBreakdown[];
  byPayMethod: SalesBreakdown[];
  byOrderType: SalesBreakdown[];
}

export interface TopItem {
  menuItemId: string | null;
  name: string;
  qty: number;
  revenue: number;
}

export interface ReportParams {
  restaurantId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Restaurants the logged-in manager owns — backs the restaurant switcher.
export const useManagerRestaurantsQuery = () =>
  useQuery<ManagerRestaurant[]>({
    queryKey: ['manager-restaurants'],
    queryFn: async () => {
      const res = await api.get<{ data: ManagerRestaurant[] }>('/manager/restaurants');
      return res.data.data;
    },
  });

export const useSalesOverviewQuery = (params: ReportParams) =>
  useQuery<SalesOverview>({
    queryKey: ['manager-sales-overview', params],
    queryFn: async () => {
      const res = await api.get<{ data: SalesOverview }>('/manager/sales/overview', { params });
      return res.data.data;
    },
    refetchInterval: 60_000,
  });

export const useTopItemsQuery = (params: ReportParams & { limit?: number }) =>
  useQuery<TopItem[]>({
    queryKey: ['manager-top-items', params],
    queryFn: async () => {
      const res = await api.get<{ data: TopItem[] }>('/manager/sales/top-items', { params });
      return res.data.data;
    },
  });

// Stream the CSV report and trigger a browser download.
export async function downloadOrdersCsv(params: ReportParams) {
  const res = await api.get('/manager/reports/orders.csv', { params, responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'orders-report.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
