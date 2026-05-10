import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMenuItemRequest,
  createMenuRequest,
  deleteMenuRequest,
  getCategoriesRequest,
  getMenuItemsRequest,
  getRestaurantMenusRequest,
  updateMenuRequest,
} from '@shared/api/menus';
import type { Category, CreateMenuItemPayload, CreateMenuPayload, Menu, MenuItem, UpdateMenuPayload } from '@shared/types/Menu';

export const useMenusQuery = (restaurantId: string | null) =>
  useQuery<Menu[]>({
    queryKey: ['menus', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      return getRestaurantMenusRequest(restaurantId);
    },
    enabled: Boolean(restaurantId),
  });

export const useCreateMenuMutation = (restaurantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['menus', 'create', restaurantId],
    mutationFn: async (payload: CreateMenuPayload) => createMenuRequest(restaurantId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menus', restaurantId] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateMenuMutation = (restaurantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['menus', 'update', restaurantId],
    mutationFn: async ({ menuId, payload }: { menuId: string; payload: UpdateMenuPayload }) =>
      updateMenuRequest(menuId, restaurantId,payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menus', restaurantId] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteMenuMutation = (restaurantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['menus', 'delete', restaurantId],
    mutationFn: async (menuId: string) => deleteMenuRequest(menuId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menus', restaurantId] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useCategoriesQuery = () =>
  useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => getCategoriesRequest(),
  });

export const useMenuItemsQuery = (menuId: string | null, search = '') =>
  useQuery<MenuItem[]>({
    queryKey: ['menu-items', menuId, search],
    queryFn: async () => {
      if (!menuId) return [];
      return getMenuItemsRequest(menuId, search);
    },
    enabled: Boolean(menuId),
  });

export const useCreateMenuItemMutation = (menuId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['menu-items', 'create', menuId],
    mutationFn: async (payload: CreateMenuItemPayload) => createMenuItemRequest(menuId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menu-items', menuId] });
    },
  });
};
