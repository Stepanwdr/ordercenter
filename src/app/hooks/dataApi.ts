import { api } from '@shared/api/base';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@shared/api/orders';
import type { Order } from '@shared/types/Order';
import type { Restaurant } from '@shared/types/Restaurant';
import type { Courier } from '@shared/types/Courier';
import {toast} from "react-toastify";

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

interface CreateCourierPayload {
  name?: string;
  phone?: string;
  status?: Courier['status'];
  lat?: number;
  lng?: number;
  restaurantId?: string;
  currentOrder?: string
  email:string
}

interface UpdateCourierPayload extends CreateCourierPayload {
}

export const useOrdersQuery = () =>
  useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get<{data:Order[]}>('/orders');
      return res.data.data;
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
  return useQuery<{ data: Courier[] }>({
    queryKey: ['couriers'],
    queryFn: async () => {
      const res = await api.get<{ data: Courier[] }>('/couriers');
      return res.data;
    },
  });
};

// Menus for a specific restaurant
export const useRestaurantMenusQuery = (restaurantId: string | null) => {
  return useQuery<Restaurant[]>({
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

// Courier-specific data hooks
export const useCourierQuery = (id: string | null) => {
  return useQuery<{ data: Courier }>({
    queryKey: ['courier', id],
    queryFn: async () => {
      const res = await api.get<{ data: Courier}>(`/couriers/${id}`);
      return res.data;
    },
  });
};


export const useCreateCourierMutation = (successCb:()=>void) => {
  const queryClient = useQueryClient();
  return useMutation<any, unknown, { payload: CreateCourierPayload }>({
    mutationKey: ['create-courier'],
    mutationFn: async ({ payload }) => {
      return api.post<{ data: Courier }>(`/couriers`, payload);
    },
    onSuccess: async () => {
      successCb()
      await queryClient.invalidateQueries({ queryKey: ['couriers'] });
    },
  });
};

// Orders mutations (separate tanstack hooks for actions formerly on useOrdersStore)
export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-order'],
    mutationFn: async (payload: any) => ordersApi.createOrder(payload),
    onSuccess: async () => {
      toast.success('Պատվերը ստեղծվեց');
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['update-order'],
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => ordersApi.updateOrder(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useSendOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['send-order'],
    mutationFn: async (id: string) => ordersApi.sendOrder(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useAssignCourierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['assign-courier'],
    mutationFn: async ({ id, courierId }: { id: string; courierId: string }) => {
      return await api.put<{ data: Order }>(`/orders/${id}/assign-courier`, { courierId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};


export const useUpdateCourierMutation = (successCb:()=>void) => {
  const queryClient = useQueryClient();
  return useMutation<any, unknown, { id: string; payload: UpdateCourierPayload }>({
    mutationKey: ['update-courier'],
    mutationFn: async ({ id, payload }) => {
      return api.put<{ data: Courier }>(`/couriers/${id}`, payload);
    },
    onSuccess: async () => {
      successCb()
      await queryClient.invalidateQueries({ queryKey: ['couriers'] });
    },
  });
};

export const useDeleteCourierMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationKey: ['delete-courier'],
    mutationFn: async (id) => {
      await api.delete(`/couriers/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['couriers'] });
    },
  });
};
