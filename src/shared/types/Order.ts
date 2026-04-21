export type OrderStatus = 'new' | 'cooking' | 'ready' | 'enRoute' | 'done';
export type OrderPaymentMethod = 'CASH' | 'ONLINE' | 'BANK POS' | 'IDRAM';
export type OrderCourierStatus = 'atRestaurant' | 'pickedUp' | 'enRoute' | 'delivered';

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
  paidMethod: OrderPaymentMethod;
  orderTime: string;
  prepTime: string;
  courierStatus: OrderCourierStatus;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  orderItems: OrderItem[];
  address: OrderAddress;
  customerPhone: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  category: 'Drinks' | 'Food' | 'Meat';
  price: number;
  description: string;
}
