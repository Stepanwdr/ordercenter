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
import kitchenRouter from './routes/kitchen.js';
import { initKitchenRetry } from './services/kitchen/retryWorker.js';
import authorization from './middlewares/authorization.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

// Extra allowed origins via env (comma-separated), e.g. CORS_ORIGINS="https://crm.example.am".
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Allow: any *.deliverydepartment.am (and the apex), any localhost, plus CORS_ORIGINS.
const isAllowedOrigin = (origin) =>
  !!origin && (
    corsOrigins.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
    /^https?:\/\/([a-z0-9-]+\.)*deliverydepartment\.am$/i.test(origin)
  );

// Single CORS layer. Reflects the request origin when allowed (required for
// credentials), handles preflight, and never throws on a disallowed origin.
app.use(cors({
  origin(origin, callback) {
    // no Origin header (server-to-server, curl) → allow; otherwise check the allowlist
    callback(null, !origin || isAllowedOrigin(origin));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Token'],
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
// Kitchen channel endpoints (SSE stream / ack / POS webhooks) authenticate with a
// per-restaurant device token, not the user JWT — mount before the auth layer.
app.use('/kitchen', kitchenRouter);
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

// background worker: retry failed kitchen dispatches (iiko/r_keeper)
try {
  initKitchenRetry();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Kitchen retry worker init error', err?.message || err);
}

export default app;
