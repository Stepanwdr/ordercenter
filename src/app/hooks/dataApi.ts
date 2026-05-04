import { api } from '@shared/api/base';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order } from '@shared/types/Order';
import type { Restaurant } from '@shared/types/Restaurant';
type RestaurantAddressInput = {
  city?: string;
  street?: string;
  building?: string;
  apartment?: string;
  comment?: string;
};
type CreateRestaurantPayload = {
  name: string;
  photo?: string | null;
  lat?: number;
  lng?: number;
  cuisine?: string;
  addresses?: RestaurantAddressInput[];
  ownerId?: string;
  phone:string
};
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
  useQuery<{data:Restaurant[]}>({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const res = await api.get<{data:Restaurant[]}>('/restaurants');
      return res.data;
    },
  });

// Create restaurant mutation
// export const useCreateRestaurantMutation = () => {
//   const queryClient = useQueryClient();
//
//   return useMutation<Restaurant, unknown, CreateRestaurantPayload | FormData>(
//     async (payload) => {
//       if (payload instanceof FormData) {
//         const res = await api.post<{ data: Restaurant }>('/restaurants', payload, {
//           headers: { 'Content-Type': 'multipart/form-data' },
//         });
//         return res.data.data;
//       }
//     },
//     {
//       onSuccess: async() => {
//         await queryClient.invalidateQueries({queryKey:['restaurants']});
//       },
//     }
//   );
// };

export const useCreateRestaurantMutation = () => {
  const queryClient = useQueryClient();

  return  useMutation({
    mutationKey: [ 'create-restaurant'],
    // Let axios set the appropriate Content-Type based on payload type
    mutationFn: async (payload: CreateRestaurantPayload | FormData) => api.post<{ data: Restaurant }>('/restaurants', payload),
    onSuccess: async() => {
      await  queryClient.invalidateQueries({queryKey:['restaurants']});
    },
  });

};

export const useUpdateRestaurantMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<any, unknown, { id: string; payload: CreateRestaurantPayload | FormData }>({
    mutationKey: ['update-restaurant'],
    mutationFn: async ({ id, payload }) => {
      const isForm = payload instanceof FormData;
      return api.put<{ data: any }>(`/restaurants/${id}`, payload, {
        headers: isForm ? { 'Content-Type': 'multipart/form-data' } : {},
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
};

export const useDeleteRestaurantMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationKey: ['delete-restaurant'],
    mutationFn: async (id) => {
      await api.delete(`/restaurants/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
};

export const useCouriersQuery = () => {
  return useQuery<Courier[]>({
    queryKey: ['couriers'],
    queryFn: async () => {
      const res = await api.get<Courier[]>('/courier');
      return res.data;
    },
  });
};

// Menus for a specific restaurant
export const useRestaurantMenusQuery = (restaurantId: string | null) => {
  return useQuery<any[]>({
    queryKey: restaurantId ? ['menus', restaurantId] : ['menus', 'all'],
    queryFn: async () => {
      if (!restaurantId) return [];
      const res = await api.get<any[]>(`/restaurants/${restaurantId}/menus`);
      return res.data;
    },
  });
};

export const useMenuItemsQuery = (menuId: string | null) => {
  return useQuery<any[]>({
    queryKey: menuId ? ['menuItems', menuId] : ['menuItems', 'all'],
    queryFn: async () => {
      if (!menuId) return [];
      const res = await api.get<any[]>(`/menus/${menuId}/items`);
      return res.data;
    },
  });
};
