import { Server } from 'socket.io';

let io = null;

export function initSocket(server) {
  if (io) return io;
  io = new Server(server, {
    cors: {
      origin: ("" || '').split(',').map(s => s.trim()).filter(Boolean).concat(['http://localhost:5173','http://localhost:5174','http://localhost:3000']),
      methods: ['GET','POST','PATCH']
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
