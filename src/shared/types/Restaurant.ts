export type RestaurantStatus = 'open' | 'busy' | 'closed';

// A kitchen printer. The print-agent prints the same ticket to every one.
export interface Printer {
  name?: string;
  ip: string;
  port?: number;
}

// A restaurant BRANCH (филиал). Kept under the name `Address` for back-compat with the
// existing `restaurant.addresses` field; each branch carries its own address/photo/printers.
export interface Address{
  id?: string;
  name?: string;
  address: string;
  phone?: string;
  photo?: string | null;
  lat?: number;
  lng?: number;
  comment?: string;
  deliveryChannel?: DeliveryChannel;
  channelConfig?: ChannelConfig;
  // Branch printers [{name, ip, port}]. Stored into channelConfig.printers; the branch's
  // print-agent fetches them. Edited as a small list in the form.
  printers?: Printer[];
  isActive?: boolean;
}

export type Branch = Address;

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
  printers?: Printer[]; // the scope's print-agent fetches this
  [key: string]: unknown;
}

export type DeliveryChannel = 'client' | 'iiko' | 'rkeeper';

export interface Restaurant {
  id: string;
  name: string;
  photo?: string | null;
  logo?: string | null;
  cuisine: string;
  // The restaurant's own address — used when it has no branches.
  address?: string | null;
  // Branches (филиалы). When present, address/photo/printers live per-branch.
  addresses?: Address[];
  phone: string;
  status: RestaurantStatus;
  deliveryChannel?: DeliveryChannel;
  channelConfig?: ChannelConfig;
  // The restaurant's own printers (used when it has no branches).
  printers?: Printer[];
}
