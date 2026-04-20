import { io, Socket } from 'socket.io-client';
import { useOrdersStore } from '@store/ordersStore';

let socket: Socket | null = null;

export const initializeSocket = () => {
  if (socket) {
    return () => {};
  }

  socket = io(import.meta.env.VITE_WS_URL ?? 'http://localhost:4000', {
    transports: ['websocket'],
  });

  const store = useOrdersStore.getState();

  socket.on('connect', () => {
    console.info('Socket connected:', socket?.id);
  });

  socket.on('courier:update', (payload: { courierId: string; status: string; orderId?: string }) => {
    store.setCourierUpdate(payload);
  });

  socket.on('order:update', (order) => {
    store.mergeOrder(order);
  });

  return () => {
    if (!socket) return;
    socket.off('connect');
    socket.off('courier:update');
    socket.off('order:update');
    socket.disconnect();
    socket = null;
  };
};
