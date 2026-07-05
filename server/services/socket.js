import { Server } from 'socket.io';

let io = null;

// Same flexible allowlist as the Express CORS layer (app.js): any localhost port (dev
// servers, previews) and any deliverydepartment.am subdomain. A narrow hardcoded list here
// silently blocked Socket.io (net::ERR_FAILED) for any other origin, killing realtime.
const isAllowedOrigin = (origin) =>
  !origin ||
  /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
  /^https?:\/\/([a-z0-9-]+\.)*deliverydepartment\.am$/i.test(origin);

export function initSocket(server) {
  if (io) return io;
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
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
