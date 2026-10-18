import logger from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'HTTP Request Server Error');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'HTTP Request Client Warning');
    } else {
      logger.info(logData, 'HTTP Request Completed');
    }
  });

  next();
}

export default requestLogger;

