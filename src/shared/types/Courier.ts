import type { User } from "@shared/types/User.ts";
import type {Order} from "@shared/types/Order.ts";
import type {Restaurant} from "@shared/types/Restaurant.ts";
export type CourierStatus = 'atRestaurant' | 'pickedUp' | 'enRoute' | 'delivered' | 'free' | 'offline' | 'dayOff';


export interface Courier extends User {
  status: CourierStatus;
  location: { lat: number; lng: number };
  currentOrders: Order[];
  restaurant?: Restaurant;
  orders?: Order[];
  user?: User;
  userId: string;
}
