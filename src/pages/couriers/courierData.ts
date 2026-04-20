import type { Courier } from '../../shared/types';

export const sampleCouriers: Courier[] = [
  { id: 'c1', name: 'Nova Kai', phone: '+1 415 338 1120', status: 'delivering', currentOrder: 'ORD-4742', location: { lat: 37.7749, lng: -122.4194 } },
  { id: 'c2', name: 'Maya Ortiz', phone: '+1 415 226 0077', status: 'idle', location: { lat: 37.7849, lng: -122.4094 } },
  { id: 'c3', name: 'Jin Park', phone: '+1 415 888 8822', status: 'offline' },
];

export const findCourier = (id: string | undefined) =>
  sampleCouriers.find((courier) => courier.id === id) ?? null;
