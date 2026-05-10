export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  menuId: string;
  name: string;
  article: string;
  description?: string | null;
  image?: string | null;
  categoryId: string;
  category?: Category;
  quantity: number;
  volumeValue?: number | null;
  volumeName?: string | null;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Menu {
  id: string;
  restaurantId: string;
  name: string;
  items?: MenuItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuPayload {
  name: string;
}

export interface UpdateMenuPayload {
  name?: string;
}

export interface CreateMenuItemPayload {
  name: string;
  categoryId: string;
  quantity: number;
  volumeValue?: number;
  volumeName?: string;
  image?: string;
  description?: string;
  price?: number;
}
