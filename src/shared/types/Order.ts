import type {Courier, CourierStatus} from "@shared/types/Courier.ts";
import type {Restaurant} from "@shared/types/Restaurant.ts";
import type {User} from "@shared/types/User.ts";

export type OrderStatus = 'new' | 'cooking' | 'ready' | 'enRoute' | 'done';
export type OrderPaymentMethod = 'CASH' | 'ONLINE' | 'BANK POS' | 'IDRAM';
export interface menuItem {
  article:  string
  categoryId: string
  createdAt  :string
  deletedAt :string
  description :string
  id:string
  image:string
  name:string
  price:number
  quantity:number
  volumeName:string
  volumeValue:number
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  menuItem: menuItem
}

export interface OrderAddress {
  city: string;
  street: string;
  building: string;
  apartment: string;
  comment?: string;
}

export interface Order {
  id: string;
  orderCode: string;
  phone: string;
  restaurant: Restaurant;
  courierProfile: Courier;
  courierPhone: string;
  operatorName: string;
  payMethod: OrderPaymentMethod;
  prepTime: string;
  courierStatus: CourierStatus;
  totalAmount: number;
  price: number;
  status: OrderStatus;
  createdAt: string;
  orderItems: OrderItem[];
  customerPhone?: string;
  deliveryAddress?: string;
  entrance?: string;
  floor?: string;
  domofon?: string;
  home?: string;
  addressComment?: string;
  customerName?: string;
  orderType?: 'dine_in' | 'takeaway' | 'delivery';
  paid: boolean;
  code:string
  operator: User
}

export interface MenuItemOption {
  id: string;
  name: string;
  category: 'Drinks' | 'Food' | 'Meat';
  price: number;
  description: string;
}
