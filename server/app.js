import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes/index.js';
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
app.use(authorization);
app.use(router);
app.use(notFound);
app.use(errorHandler);

export default app;
