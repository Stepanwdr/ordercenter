import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes/index.js';
import path from 'path';
import uploadRouter from './routes/upload.js';
import authorization from './middlewares/authorization.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

dotenv.config();

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || 'https://dev.deliverydepartment.am')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin is not allowed'));
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Serve uploaded images publicly before auth middleware
app.use('/uploads', express.static(path.resolve('uploads')));
app.use('/upload', uploadRouter);
app.use(authorization);
app.use(router);

// (uploads routes mounted earlier). 404 handler and error handler below
// 404 handler and error handler after route setup
// (no additional upload routes here)
app.use(errorHandler);

export default app;
