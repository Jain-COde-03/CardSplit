import { describe, expect, it } from 'vitest';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler.js';

describe('Error Handling Middleware', () => {
  it('notFoundHandler returns 404 with structured error payload', () => {
    const req = { requestId: 'req-404-test' };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(payload) {
        jsonSent = payload;
        return this;
      },
    };

    notFoundHandler(req, res);

    expect(statusSent).toBe(404);
    expect(jsonSent.success).toBe(false);
    expect(jsonSent.error.code).toBe('NOT_FOUND');
    expect(jsonSent.meta.requestId).toBe('req-404-test');
  });

  it('errorHandler formats generic error with 500 default and preserves requestId', () => {
    const error = new Error('Database read failed');
    const req = { requestId: 'req-500-test' };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(payload) {
        jsonSent = payload;
        return this;
      },
    };

    const next = () => {};

    errorHandler(error, req, res, next);

    expect(statusSent).toBe(500);
    expect(jsonSent.success).toBe(false);
    expect(jsonSent.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(jsonSent.meta.requestId).toBe('req-500-test');
  });

  it('errorHandler respects custom statusCode and errorCode on custom errors', () => {
    const customError = new Error('Invalid product URL format');
    customError.statusCode = 400;
    customError.code = 'INVALID_PRODUCT_URL';

    const req = { requestId: 'req-custom-error' };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(payload) {
        jsonSent = payload;
        return this;
      },
    };

    const next = () => {};

    errorHandler(customError, req, res, next);

    expect(statusSent).toBe(400);
    expect(jsonSent.success).toBe(false);
    expect(jsonSent.error.code).toBe('INVALID_PRODUCT_URL');
    expect(jsonSent.error.message).toBe('Invalid product URL format');
  });
});

