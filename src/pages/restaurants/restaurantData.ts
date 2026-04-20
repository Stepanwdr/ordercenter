import type { Restaurant } from '../../shared/types';

export const sampleRestaurants: Restaurant[] = [
  {
    id: 'r1',
    name: 'Blue Fork',
    cuisine: 'Modern European',
    addresses: ['122 Harper St, San Francisco', '35 Pacific Ave, San Francisco'],
    phone: '+1 415 224 1102',
    status: 'open',
  },
  {
    id: 'r2',
    name: 'Taco Vault',
    cuisine: 'Mexican',
    addresses: ['41 Market Lane, San Francisco'],
    phone: '+1 415 337 8803',
    status: 'busy',
  },
  {
    id: 'r3',
    name: 'Sunset Pizzeria',
    cuisine: 'Italian',
    addresses: ['78 Sunset Blvd, San Francisco', '18 Ocean Drive, Oakland'],
    phone: '+1 415 333 0090',
    status: 'closed',
  },
];
