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

  // Silently refresh the orders table (list, pagination meta, tab badges) when anything
  // order-related changes server-side (e.g. the kitchen pressed "Принял", or a courier
  // moved the order along its flow).
  const refreshOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orders-paged'] });
    queryClient.invalidateQueries({ queryKey: ['orders-status-counts'] });
  };
  const refreshCouriers = () => {
    queryClient.invalidateQueries({ queryKey: ['couriers'] });
    queryClient.invalidateQueries({ queryKey: ['courier'] });
  };
  // A courier changing status (or an order being assigned/advanced) affects BOTH the
  // orders table and the couriers panel — refresh both so the UI stays live.
  const refreshBoth = () => { refreshOrders(); refreshCouriers(); };

  socket.on('order:update', refreshOrders);
  socket.on('order:create', refreshBoth);
  socket.on('order:delete', refreshBoth);
  // Kitchen accepted an order → refresh the table AND pop a live notification card.
  socket.on('order:accepted', (order) => {
    refreshOrders();
    window.dispatchEvent(new CustomEvent('live:order-accepted', { detail: order }));
  });
  // Courier changed their own status → update the couriers panel AND the orders table
  // (rows show the courier's status/load).
  socket.on('courier:update', refreshBoth);
  // Courier advanced an order along its delivery flow / was (un)assigned.
  socket.on('order:courier_status_changed', refreshBoth);
  socket.on('order:courier_assigned', refreshBoth);
  socket.on('courier:order_created', refreshBoth);

  return () => {
    if (!socket) return;
    socket.off('connect');
    socket.off('order:update', refreshOrders);
    socket.off('order:create', refreshBoth);
    socket.off('order:delete', refreshBoth);
    socket.off('order:accepted');
    socket.off('courier:update', refreshBoth);
    socket.off('order:courier_status_changed', refreshBoth);
    socket.off('order:courier_assigned', refreshBoth);
    socket.off('courier:order_created', refreshBoth);
    socket.disconnect();
    socket = null;
  };
};
