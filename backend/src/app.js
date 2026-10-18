import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { corsMiddleware } from './config/cors.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.js';
import productRoutes from './routes/product.routes.js';
import accountRoutes from './routes/account.routes.js';
import memberRoutes from './routes/member.routes.js';
import savedDealRoutes from './routes/savedDeal.routes.js';
import socialRoutes from './routes/social.routes.js';
import circleRoutes from './routes/circle.routes.js';

import requestLogger from './middleware/requestLogger.js';

import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger.js';

const app = express();

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down and try again later.',
    },
  },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https:'],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(corsMiddleware);
app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(generalLimiter);

// Interactive Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API v1 routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', accountRoutes);
app.use('/api/v1', memberRoutes);
app.use('/api/v1', savedDealRoutes);
app.use('/api/v1', socialRoutes);
app.use('/api/v1/circles', circleRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
