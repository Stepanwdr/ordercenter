import { io, Socket } from 'socket.io-client';
import type { QueryClient } from '@tanstack/react-query';

let socket: Socket | null = null;

export const initializeSocket = (queryClient: QueryClient) => {
  if (socket) {
    return () => {};
  }

  // Socket.io is attached to the same HTTP server as the API (default port 5000),
  // so fall back to the API base URL, then localhost:5000.
  const url = import.meta.env.VITE_WS_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
  socket = io(url, {});

  socket.on('connect', () => {
    console.info('Socket connected:', socket?.id);
  });

  // Silently refresh the orders table when anything order-related changes server-side
  // (e.g. the kitchen pressed "Принял" → status becomes "Պատրաստվում է").
  const refreshOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orders-paged'] });
  };

  socket.on('order:update', refreshOrders);
  socket.on('order:create', refreshOrders);
  socket.on('order:delete', refreshOrders);
  // Kitchen accepted an order → refresh the table AND pop a live notification card.
  socket.on('order:accepted', (order) => {
    refreshOrders();
    window.dispatchEvent(new CustomEvent('live:order-accepted', { detail: order }));
  });
  socket.on('courier:update', () => {
    queryClient.invalidateQueries({ queryKey: ['couriers'] });
  });

  return () => {
    if (!socket) return;
    socket.off('connect');
    socket.off('courier:update');
    socket.off('order:update', refreshOrders);
    socket.off('order:create', refreshOrders);
    socket.off('order:delete', refreshOrders);
    socket.disconnect();
    socket = null;
  };
};
