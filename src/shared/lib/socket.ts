import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = () => {
  if (socket) {
    return () => {};
  }

  socket = io(import.meta.env.VITE_WS_URL ?? 'http://localhost:4000', {
  });


  socket.on('connect', () => {
    console.info('Socket cosnnected:', socket?.id);
  });

  socket.on('courier:update', (payload: { courierId: string; status: string; orderId?: string }) => {

  });

  socket.on('order:update', (order) => {
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
