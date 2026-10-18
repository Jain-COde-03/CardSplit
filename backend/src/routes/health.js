import { Router } from 'express';
import { isDatabaseReady } from '../config/database.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptimeSeconds: Number(process.uptime().toFixed(2)),
    },
    meta: {
      requestId: req.requestId,
    },
  });
});

router.get('/health/ready', (req, res) => {
  if (!isDatabaseReady()) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The application is still starting or MongoDB is not ready yet.',
      },
      meta: {
        requestId: req.requestId,
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      status: 'ready',
      database: {
        status: 'connected',
      },
    },
    meta: {
      requestId: req.requestId,
    },
  });
});

export default router;
