export type OrderStatus = 'new' | 'cooking' | 'ready' | 'delivering' | 'done';
export type CourierStatus = 'atRestaurant' | 'pickedUp' | 'enRoute' | 'delivered';

export interface MenuItemOption {
  id: string;
  name: string;
  category: 'Drinks' | 'Food' | 'Meat';
  price: number;
  description: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
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
  customerName: string;
  phone: string;
  restaurant: string;
  courier?: string;
  courierPhone: string;
  operatorName: string;
  paidMethod: 'CASH' | 'ONLINE' | 'BANK POS' | 'IDRAM';
  orderTime: string;
  prepTime: string;
  courierStatus: CourierStatus;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  address: OrderAddress;
}
