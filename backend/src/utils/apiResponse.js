export function sendSuccess(res, statusCode, data, requestId, message) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
    meta: { requestId },
  });
}

export function createApiError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
