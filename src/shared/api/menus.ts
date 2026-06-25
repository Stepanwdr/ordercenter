import { api } from '@shared/api/base';
import type { Category, CreateMenuItemPayload, CreateMenuPayload, Menu, MenuItem, UpdateMenuPayload } from '@shared/types/Menu';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export const getRestaurantMenusRequest = async (restaurantId: string) => {
  const response = await api.get<ApiEnvelope<Menu[]>>(`/restaurants/${restaurantId}/menus`);
  return response.data.data;
};

export const createMenuRequest = async (restaurantId: string, payload: CreateMenuPayload) => {
  const response = await api.post<ApiEnvelope<Menu>>(`/restaurants/${restaurantId}/menus`, payload);
  return response.data.data;
};

export const updateMenuRequest = async (menuId: string,restoranId:string, payload: UpdateMenuPayload) => {
  const response = await api.put<ApiEnvelope<Menu>>(`/restaurants/${restoranId}/menus/${menuId}`, payload);
  return response.data.data;
};

export const deleteMenuRequest = async (menuId: string) => {
  await api.delete(`/menus/${menuId}`);
};

export const getCategoriesRequest = async (menuId?: string | null) => {
  const response = await api.get<ApiEnvelope<Category[]>>('/categories', {
    params: menuId ? { menuId } : undefined,
  });
  return response.data.data;
};

export const createCategoryRequest = async (payload: { menuId: string; name: string; slug?: string }) => {
  const response = await api.post<ApiEnvelope<Category>>('/categories', payload);
  return response.data.data;
};

export const updateCategoryRequest = async (id: string, payload: { name?: string; slug?: string }) => {
  const response = await api.put<ApiEnvelope<Category>>(`/categories/${id}`, payload);
  return response.data.data;
};

export const deleteCategoryRequest = async (id: string) => {
  await api.delete(`/categories/${id}`);
};

export const getMenuItemsRequest = async (menuId: string, search?: string) => {
  const response = await api.get<ApiEnvelope<MenuItem[]>>(`/menus/${menuId}/items`, {
    params: search ? { search } : undefined,
  });
  return response.data.data;
};

export const createMenuItemRequest = async (menuId: string, payload: CreateMenuItemPayload) => {
  const response = await api.post<ApiEnvelope<MenuItem>>(`/menus/${menuId}/items`, payload);
  return response.data.data;
};

export const deleteMenuItemRequest = async (menuId: string, itemId: string) => {
  await api.delete(`/menus/${menuId}/items/${itemId}`);
};
