import type { User } from "@shared/types/User.ts";
export type CourierStatus= 'atRestaurant' | 'pickedUp' | 'enRoute' | 'delivered';


export interface Courier extends User {
  status: CourierStatus;
  location: { lat: number; lng: number };
  currentOrder:string
}
