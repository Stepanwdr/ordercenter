export type RestaurantStatus = 'open' | 'busy' | 'closed';


export interface Address{
  address: string;
  comment?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  photo?: string | null;
  cuisine: string;
  // addresses can be an array of simple strings or structured objects
  addresses?: Address[];
  phone: string;
  status: RestaurantStatus;
}

