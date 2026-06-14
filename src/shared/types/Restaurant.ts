export type RestaurantStatus = 'open' | 'busy' | 'closed';


export interface Address{
  address: string;
  comment?: string;
}

export interface PrinterConfig {
  ip?: string;
  port?: number;
  required?: boolean;
  timeout?: number;
  charset?: string;
}

export interface ChannelConfig {
  deviceToken?: string;
  printer?: PrinterConfig;
  [key: string]: unknown;
}

export type DeliveryChannel = 'client' | 'iiko' | 'rkeeper';

export interface Restaurant {
  id: string;
  name: string;
  photo?: string | null;
  cuisine: string;
  // addresses can be an array of simple strings or structured objects
  addresses?: Address[];
  phone: string;
  status: RestaurantStatus;
  deliveryChannel?: DeliveryChannel;
  channelConfig?: ChannelConfig;
}

