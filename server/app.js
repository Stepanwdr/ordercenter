import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes/index.js';
import courierAppRouter from './routes/courierApp.js';
import { initPolling } from './services/telegramBot.js';
import path from 'path';
import uploadRouter from './routes/upload.js';
import authorization from './middlewares/authorization.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || 'https://api.deliverydepartment.am')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// fallback CORS headers — set before everything
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin || '';
  const allowed = corsOrigins.includes(requestOrigin) || /^https?:\/\/localhost(:\d+)?$/.test(requestOrigin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', corsOrigins[0] || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// cors package for convenience (origin check already done above)
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin is not allowed'));
  },
  credentials: true,
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Serve uploaded images publicly before auth middleware.
// Override helmet's default CORP so images can be embedded cross-origin
// (e.g. the frontend on :5173 loading an <img> from this API on :5000).
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.resolve('uploads')),
);
app.use('/upload', uploadRouter);
app.use('/courier-app', courierAppRouter);
app.use(authorization);
app.use(router);

// (uploads routes mounted earlier). 404 handler and error handler below
// 404 handler and error handler after route setup
// (no additional upload routes here)
app.use(errorHandler);

// initialize telegram polling if enabled
try {
  initPolling();
} catch (err) {
  // ignore bot init errors
  // eslint-disable-next-line no-console
  console.error('Telegram bot init error', err?.message || err);
}

export default app;
