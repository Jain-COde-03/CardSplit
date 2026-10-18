export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested route was not found.',
    },
    meta: {
      requestId: req.requestId,
    },
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }
  const statusCode = error.code === 'LIMIT_FILE_SIZE'
    ? 413
    : Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const requestId = req.requestId || 'unknown';

  const payload = {
    success: false,
    error: {
      code: error.code === 'LIMIT_FILE_SIZE' ? 'AVATAR_TOO_LARGE' : error.code || 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Something went wrong. Please try again later.'
          : error.code === 'LIMIT_FILE_SIZE'
            ? 'Profile photos must be 4 MB or smaller.'
            : error.message || 'Unexpected server error.',
    },
    meta: {
      requestId,
    },
  };

  if (process.env.NODE_ENV !== 'production' && error.stack) {
    payload.error.stack = error.stack;
  }

  res.status(statusCode).json(payload);
}

export default errorHandler;
