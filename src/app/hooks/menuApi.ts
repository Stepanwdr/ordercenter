import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategoryRequest,
  deleteCategoryRequest,
  updateCategoryRequest,
  createMenuItemRequest,
  createMenuRequest,
  deleteMenuItemRequest,
  deleteMenuRequest,
  getCategoriesRequest,
  getMenuItemsRequest,
  getRestaurantMenusRequest,
  updateMenuRequest,
} from '@shared/api/menus';
import type { Category, CreateMenuItemPayload, CreateMenuPayload, Menu, MenuItem, UpdateMenuPayload } from '@shared/types/Menu';
import {toast} from "react-toastify";

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
      toast.success("Մենյուի անունը փոփոխվեց")
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

export const useCategoriesQuery = (menuId?: string | null) =>
  useQuery<Category[]>({
    queryKey: ['categories', menuId ?? null],
    queryFn: async () => getCategoriesRequest(menuId),
  });

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['categories', 'create'],
    mutationFn: async (payload: { menuId: string; name: string; slug?: string }) => createCategoryRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['categories', 'update'],
    mutationFn: async ({ id, payload }: { id: string; payload: { name?: string; slug?: string } }) =>
      updateCategoryRequest(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['categories', 'delete'],
    mutationFn: async (id: string) => deleteCategoryRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

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

export const useDeleteMenuItemMutation = (menuId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['menu-items', 'delete', menuId],
    mutationFn: async (itemId: string) => deleteMenuItemRequest(menuId, itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menu-items', menuId] });
    },
  });
};
