import type { Restaurant } from "@shared/types/Restaurant.ts";
import type { Order } from "@shared/types/Order.ts";

export type UserRole = 'admin' | 'courier'| 'customer' | 'operator'

export interface User {
  email?: string;
  name?: string;
  role?: UserRole;
  avatar?: string;
  phone?: string;
  restaurant?: Restaurant[];
  orders?: Order[];
}
