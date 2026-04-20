export type CourierStatus = 'idle' | 'delivering' | 'offline';

export interface Courier {
  id: string;
  name: string;
  phone: string;
  status: CourierStatus;
  currentOrder?: string;
  location?: { lat: number; lng: number };
}
