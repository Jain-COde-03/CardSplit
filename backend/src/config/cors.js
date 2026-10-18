import cors from 'cors';
import { env } from './env.js';

const clientOrigins = (env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set(
  [
    ...clientOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean)
);

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const cleanOrigin = origin.replace(/\/$/, '');

    if (
      allowedOrigins.has(cleanOrigin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin) ||
      cleanOrigin.endsWith('.onrender.com')
    ) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
});

export default corsMiddleware;
