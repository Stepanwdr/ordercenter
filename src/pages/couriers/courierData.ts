import type { Courier } from '@shared/types';

export const sampleCouriers: Courier[] = [
  { id: 'c1', name: 'Artyom', phone: '+1 415 338 1120', status: 'pickedUp', currentOrder: 'ORD-4742', location: { lat: 37.7749, lng: -122.4194 } },
  { id: 'c2', name: 'Gexam', phone: '+1 415 338 1120', status: 'atRestaurant', currentOrder: 'ORD-4742', location: { lat: 37.7749, lng: -122.4194 } },
  { id: 'c3', name: 'Gago', phone: '+1 415 338 1120', status: 'delivered', currentOrder: 'ORD-4742', location: { lat: 37.7749, lng: -122.4194 } },
];

export const findCourier = (id: string | undefined) =>
  sampleCouriers.find((courier) => courier.id === id) ?? null;
