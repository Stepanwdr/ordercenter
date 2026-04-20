export type RestaurantStatus = 'open' | 'busy' | 'closed';

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  addresses: string[];
  phone: string;
  status: RestaurantStatus;
}
