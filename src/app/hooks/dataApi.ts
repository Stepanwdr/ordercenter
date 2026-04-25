import { api } from '@shared/api/base';
import { useQuery } from '@tanstack/react-query';
import type { Order } from '@shared/types/Order';
import type { Restaurant } from '@shared/types/Restaurant';
import type { Courier } from '@shared/types/Courier';

export const useOrdersQuery = () =>
  useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get<Order[]>('/orders');
      return res.data;
    },
  });

export const useRestaurantsQuery = () =>
  useQuery<Restaurant[]>({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const res = await api.get<Restaurant[]>('/restaurants');
      return res.data;
    },
  });

export const useCouriersQuery = () => {
  return useQuery<Courier[]>({
    queryKey: ['couriers'],
    queryFn: async () => {
      const res = await api.get<Courier[]>('/courier');
      return res.data;
    },
  });
};
