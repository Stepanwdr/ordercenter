import { Server } from 'socket.io';
import { isAllowedOrigin } from '../utils/cors.js';

let io = null;

export function initSocket(server) {
  if (io) return io;
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
      methods: ['GET','POST','PUT','PATCH'],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    // simple log
    // eslint-disable-next-line no-console
    console.info('Socket connected', socket.id);

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.info('Socket disconnected', socket.id);
    });
  });

  return io;
}

export function getIo() {
  return io;
}
